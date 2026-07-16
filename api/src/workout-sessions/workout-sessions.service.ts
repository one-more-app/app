import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { localDateKey } from '../notifications/lib/timezone.js';
import { PerformanceEntriesService } from '../performance/performance-entries.service.js';
import { PresenceService } from '../presence/presence.service.js';
import { PresenceStatus } from '../presence/entities/presence-status.enum.js';
import { UserProfileEntity } from '../profile/user-profile.entity.js';
import { FriendsService } from '../social/friends.service.js';
import { TrackedExercisesService } from '../tracked-exercises/tracked-exercises.service.js';
import { SESSION_ACTIVE_IDLE_MS } from '../shared/session-timing.js';
import { SessionCommentEntity } from './entities/session-comment.entity.js';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export type SessionCommentAuthorDto = {
  userId: string;
  firstName: string | null;
  lastName: string | null;
  username: string | null;
  avatarUrl: string | null;
};

export type SessionCommentDto = {
  id: string;
  author: SessionCommentAuthorDto;
  body: string;
  createdAt: string;
  parentId: string | null;
  replies: SessionCommentDto[];
};

@Injectable()
export class WorkoutSessionsService {
  constructor(
    @InjectRepository(SessionCommentEntity)
    private readonly commentsRepo: Repository<SessionCommentEntity>,
    @InjectRepository(UserProfileEntity)
    private readonly profilesRepo: Repository<UserProfileEntity>,
    private readonly friendsService: FriendsService,
    private readonly performanceEntriesService: PerformanceEntriesService,
    private readonly trackedExercisesService: TrackedExercisesService,
    private readonly presenceService: PresenceService,
  ) {}

  private assertValidDate(date: string) {
    if (!DATE_RE.test(date)) {
      throw new BadRequestException('Date invalide');
    }
  }

  async assertCanViewSession(viewerId: string, ownerUserId: string) {
    if (viewerId === ownerUserId) return;
    const friendIds = await this.friendsService.getAcceptedFriendIds(viewerId);
    if (!friendIds.includes(ownerUserId)) {
      throw new ForbiddenException('Séance non accessible');
    }
  }

  private mapAuthor(
    profile: UserProfileEntity | null,
    userId: string,
  ): SessionCommentAuthorDto {
    return {
      userId,
      firstName: profile?.firstName ?? null,
      lastName: profile?.lastName ?? null,
      username: profile?.username ?? null,
      avatarUrl: profile?.avatarUrl ?? null,
    };
  }

  async getSession(viewerId: string, ownerUserId: string, date: string) {
    this.assertValidDate(date);
    await this.assertCanViewSession(viewerId, ownerUserId);

    const profile = await this.profilesRepo.findOne({
      where: { userId: ownerUserId },
    });
    if (!profile) throw new NotFoundException('Profil introuvable');

    const allEntries = await this.performanceEntriesService.list(ownerUserId, {
      withLeagueInsights: true,
    });
    const entries = allEntries.filter((e) => e.date === date && !e.deletedAt);

    const trackedExerciseIds = [
      ...new Set(entries.map((e) => e.trackedExerciseId)),
    ];
    const allExercises =
      await this.trackedExercisesService.listWithPerformance(ownerUserId);
    const exercises = allExercises.filter((ex) =>
      trackedExerciseIds.includes(ex.id),
    );

    const highlights = entries
      .filter((e) => {
        if (!('leagueInsight' in e)) return false;
        const insight = e.leagueInsight as { isRecord?: boolean } | undefined;
        return insight?.isRecord === true;
      })
      .map((e) => ({ entryId: e.id, type: 'pr' as const }));

    const today = localDateKey('UTC');
    const presence = await this.presenceService.getPresence(ownerUserId);
    const lastEntry = entries.reduce<(typeof entries)[number] | null>(
      (latest, entry) => {
        if (!latest) return entry;
        return new Date(entry.createdAt).getTime() >
          new Date(latest.createdAt).getTime()
          ? entry
          : latest;
      },
      null,
    );
    const now = Date.now();
    const isLive =
      date === today &&
      (presence?.status === PresenceStatus.TRAINING ||
        (lastEntry != null &&
          now - new Date(lastEntry.createdAt).getTime() <
            SESSION_ACTIVE_IDLE_MS));

    const commentCount = await this.commentsRepo.count({
      where: {
        ownerUserId,
        sessionDate: date,
        deletedAt: IsNull(),
      },
    });

    return {
      owner: {
        userId: ownerUserId,
        firstName: profile.firstName ?? null,
        lastName: profile.lastName ?? null,
        username: profile.username ?? null,
        avatarUrl: profile.avatarUrl ?? null,
      },
      date,
      isLive,
      exercises,
      entries,
      highlights,
      commentCount,
      exerciseCount: exercises.length,
      setCount: entries.length,
    };
  }

  private async loadAuthors(
    userIds: string[],
  ): Promise<Map<string, UserProfileEntity | null>> {
    const unique = [...new Set(userIds)];
    if (unique.length === 0) return new Map();
    const profiles = await this.profilesRepo.find({
      where: unique.map((userId) => ({ userId })),
    });
    const byUserId = new Map(profiles.map((p) => [p.userId, p]));
    return new Map(unique.map((id) => [id, byUserId.get(id) ?? null]));
  }

  private toCommentDto(
    comment: SessionCommentEntity,
    authors: Map<string, UserProfileEntity | null>,
    replies: SessionCommentDto[] = [],
  ): SessionCommentDto {
    return {
      id: comment.id,
      author: this.mapAuthor(
        authors.get(comment.authorUserId) ?? null,
        comment.authorUserId,
      ),
      body: comment.body,
      createdAt: comment.createdAt.toISOString(),
      parentId: comment.parentId,
      replies,
    };
  }

  async listComments(
    viewerId: string,
    ownerUserId: string,
    date: string,
  ): Promise<{ items: SessionCommentDto[] }> {
    this.assertValidDate(date);
    await this.assertCanViewSession(viewerId, ownerUserId);

    const comments = await this.commentsRepo.find({
      where: {
        ownerUserId,
        sessionDate: date,
        deletedAt: IsNull(),
      },
      order: { createdAt: 'ASC' },
    });

    const roots = comments.filter((c) => !c.parentId);
    const repliesByParent = new Map<string, SessionCommentEntity[]>();
    for (const comment of comments) {
      if (!comment.parentId) continue;
      const list = repliesByParent.get(comment.parentId) ?? [];
      list.push(comment);
      repliesByParent.set(comment.parentId, list);
    }

    const authorIds = comments.map((c) => c.authorUserId);
    const authors = await this.loadAuthors(authorIds);

    const items = roots.map((root) =>
      this.toCommentDto(
        root,
        authors,
        (repliesByParent.get(root.id) ?? []).map((reply) =>
          this.toCommentDto(reply, authors),
        ),
      ),
    );

    return { items };
  }

  async createComment(
    viewerId: string,
    ownerUserId: string,
    date: string,
    body: string,
    parentId?: string,
  ): Promise<SessionCommentDto> {
    this.assertValidDate(date);
    await this.assertCanViewSession(viewerId, ownerUserId);

    const trimmed = body.trim();
    if (!trimmed) throw new BadRequestException('Message vide');

    if (parentId) {
      const parent = await this.commentsRepo.findOne({
        where: {
          id: parentId,
          ownerUserId,
          sessionDate: date,
          deletedAt: IsNull(),
        },
      });
      if (!parent)
        throw new NotFoundException('Commentaire parent introuvable');
      if (parent.parentId) {
        throw new BadRequestException('Réponse à une réponse interdite');
      }
    }

    const entity = await this.commentsRepo.save(
      this.commentsRepo.create({
        ownerUserId,
        sessionDate: date,
        authorUserId: viewerId,
        parentId: parentId ?? null,
        body: trimmed,
      }),
    );

    const authors = await this.loadAuthors([viewerId]);
    return this.toCommentDto(entity, authors);
  }

  async deleteComment(
    viewerId: string,
    ownerUserId: string,
    date: string,
    commentId: string,
  ) {
    this.assertValidDate(date);
    await this.assertCanViewSession(viewerId, ownerUserId);

    const comment = await this.commentsRepo.findOne({
      where: {
        id: commentId,
        ownerUserId,
        sessionDate: date,
        deletedAt: IsNull(),
      },
    });
    if (!comment) throw new NotFoundException('Commentaire introuvable');
    if (comment.authorUserId !== viewerId) {
      throw new ForbiddenException('Suppression non autorisée');
    }

    comment.deletedAt = new Date();
    await this.commentsRepo.save(comment);
    return { ok: true };
  }
}
