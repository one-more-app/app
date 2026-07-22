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
import {
  SESSION_REACTION_EMOJIS,
  SessionReactionEntity,
  type SessionReactionTargetType,
} from './entities/session-reaction.entity.js';

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

export type ReactionBubbleDto = {
  emoji: string;
  count: number;
  reactedByMe: boolean;
};

export type SessionReactionTargetDto = {
  targetType: SessionReactionTargetType;
  trackedExerciseId: string | null;
  reactions: ReactionBubbleDto[];
};

@Injectable()
export class WorkoutSessionsService {
  constructor(
    @InjectRepository(SessionCommentEntity)
    private readonly commentsRepo: Repository<SessionCommentEntity>,
    @InjectRepository(SessionReactionEntity)
    private readonly reactionsRepo: Repository<SessionReactionEntity>,
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

    const { reactions, reactionsByExerciseId } = await this.aggregateReactions(
      viewerId,
      ownerUserId,
      date,
    );

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
      reactions,
      reactionsByExerciseId,
    };
  }

  private aggregateReactionRows(
    rows: SessionReactionEntity[],
    viewerId: string,
  ): ReactionBubbleDto[] {
    const byEmoji = new Map<string, { count: number; reactedByMe: boolean }>();
    for (const row of rows) {
      const current = byEmoji.get(row.emoji) ?? {
        count: 0,
        reactedByMe: false,
      };
      current.count += 1;
      if (row.authorUserId === viewerId) current.reactedByMe = true;
      byEmoji.set(row.emoji, current);
    }
    return [...byEmoji.entries()]
      .map(([emoji, value]) => ({
        emoji,
        count: value.count,
        reactedByMe: value.reactedByMe,
      }))
      .sort((a, b) => b.count - a.count || a.emoji.localeCompare(b.emoji));
  }

  private async aggregateReactions(
    viewerId: string,
    ownerUserId: string,
    date: string,
  ): Promise<{
    reactions: ReactionBubbleDto[];
    reactionsByExerciseId: Record<string, ReactionBubbleDto[]>;
  }> {
    const rows = await this.reactionsRepo.find({
      where: { ownerUserId, sessionDate: date },
      order: { createdAt: 'ASC' },
    });

    const sessionRows = rows.filter((row) => row.targetType === 'session');
    const reactions = this.aggregateReactionRows(sessionRows, viewerId);

    const reactionsByExerciseId: Record<string, ReactionBubbleDto[]> = {};
    const exerciseRows = rows.filter(
      (row) => row.targetType === 'exercise' && row.trackedExerciseId,
    );
    const byExercise = new Map<string, SessionReactionEntity[]>();
    for (const row of exerciseRows) {
      const key = row.trackedExerciseId!;
      const list = byExercise.get(key) ?? [];
      list.push(row);
      byExercise.set(key, list);
    }
    for (const [trackedExerciseId, list] of byExercise) {
      reactionsByExerciseId[trackedExerciseId] = this.aggregateReactionRows(
        list,
        viewerId,
      );
    }

    return { reactions, reactionsByExerciseId };
  }

  private assertReactionTarget(
    targetType: SessionReactionTargetType,
    trackedExerciseId?: string | null,
  ): string | null {
    if (targetType === 'session') {
      if (trackedExerciseId) {
        throw new BadRequestException(
          'trackedExerciseId interdit pour une réaction de séance',
        );
      }
      return null;
    }
    if (!trackedExerciseId) {
      throw new BadRequestException(
        'trackedExerciseId requis pour une réaction d’exercice',
      );
    }
    return trackedExerciseId;
  }

  private assertAllowedEmoji(emoji: string) {
    if (!(SESSION_REACTION_EMOJIS as readonly string[]).includes(emoji)) {
      throw new BadRequestException('Emoji non autorisé');
    }
  }

  async toggleReaction(
    viewerId: string,
    ownerUserId: string,
    date: string,
    emoji: string,
    targetType: SessionReactionTargetType,
    trackedExerciseId?: string,
  ): Promise<{
    target: SessionReactionTargetDto;
    added: boolean;
  }> {
    this.assertValidDate(date);
    await this.assertCanViewSession(viewerId, ownerUserId);
    this.assertAllowedEmoji(emoji);
    const resolvedTrackedId = this.assertReactionTarget(
      targetType,
      trackedExerciseId,
    );

    const existing = await this.reactionsRepo.findOne({
      where: {
        ownerUserId,
        sessionDate: date,
        authorUserId: viewerId,
        emoji,
        targetType,
        trackedExerciseId:
          resolvedTrackedId === null ? IsNull() : resolvedTrackedId,
      },
    });

    let added = false;
    if (existing) {
      await this.reactionsRepo.remove(existing);
    } else {
      await this.reactionsRepo.save(
        this.reactionsRepo.create({
          ownerUserId,
          sessionDate: date,
          authorUserId: viewerId,
          emoji,
          targetType,
          trackedExerciseId: resolvedTrackedId,
        }),
      );
      added = true;
    }

    const targetRows = await this.reactionsRepo.find({
      where: {
        ownerUserId,
        sessionDate: date,
        targetType,
        trackedExerciseId:
          resolvedTrackedId === null ? IsNull() : resolvedTrackedId,
      },
      order: { createdAt: 'ASC' },
    });

    return {
      added,
      target: {
        targetType,
        trackedExerciseId: resolvedTrackedId,
        reactions: this.aggregateReactionRows(targetRows, viewerId),
      },
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
  ): Promise<{
    comment: SessionCommentDto;
    parentAuthorUserId: string | null;
  }> {
    this.assertValidDate(date);
    await this.assertCanViewSession(viewerId, ownerUserId);

    const trimmed = body.trim();
    if (!trimmed) throw new BadRequestException('Message vide');

    let parentAuthorUserId: string | null = null;
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
      parentAuthorUserId = parent.authorUserId;
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
    return {
      comment: this.toCommentDto(entity, authors),
      parentAuthorUserId,
    };
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
