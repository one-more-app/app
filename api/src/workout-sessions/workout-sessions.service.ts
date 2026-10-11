import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { PerformanceEntriesService } from '../performance/performance-entries.service.js';
import { PresenceService } from '../presence/presence.service.js';
import { PresenceStatus } from '../presence/entities/presence-status.enum.js';
import { UserProfileEntity } from '../profile/user-profile.entity.js';
import { FriendsService } from '../social/friends.service.js';
import { TrackedExercisesService } from '../tracked-exercises/tracked-exercises.service.js';
import { ProgressService } from '../progress/progress.service.js';
import { SESSION_ACTIVE_IDLE_MS } from '../shared/session-timing.js';
import { SessionCommentEntity } from './entities/session-comment.entity.js';
import {
  SESSION_REACTION_EMOJIS,
  SessionReactionEntity,
  type SessionReactionTargetType,
} from './entities/session-reaction.entity.js';
import type { WorkoutSessionEntity } from './entities/workout-session.entity.js';
import { SessionLifecycleService } from './session-lifecycle.service.js';

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
  users: SessionCommentAuthorDto[];
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
    private readonly progressService: ProgressService,
    private readonly lifecycle: SessionLifecycleService,
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

  /** Liste résumée des séances d'un jour (nouveau client). */
  async listDaySessions(viewerId: string, ownerUserId: string, date: string) {
    this.assertValidDate(date);
    await this.assertCanViewSession(viewerId, ownerUserId);
    const sessions = await this.lifecycle.listForDay(ownerUserId, date);
    // Jour demandé = date locale client (pas UTC) : sinon isLive faux après minuit local.
    const presence = await this.presenceService.getPresence(ownerUserId);
    const isPresenceTraining = presence?.status === PresenceStatus.TRAINING;

    const items: Array<{
      id: string;
      date: string;
      startedAt: string;
      endedAt: string | null;
      isLive: boolean;
    }> = [];
    for (const raw of sessions) {
      const session = isPresenceTraining
        ? raw
        : await this.lifecycle.lazyCloseIfIdle(raw);
      const lastSetAt = await this.lifecycle.getLastSetAt(session.id);
      const isLive = this.lifecycle.isSessionLive(session, {
        todayKey: date,
        isPresenceTraining,
        lastSetAt,
      });
      items.push({
        id: session.id,
        date: session.sessionDate,
        startedAt: session.startedAt.toISOString(),
        endedAt: session.endedAt?.toISOString() ?? null,
        isLive,
      });
    }
    return { items };
  }

  /** Détail séance by id (nouveau client). */
  async getSessionById(viewerId: string, sessionId: string) {
    let session = await this.lifecycle.findById(sessionId);
    await this.assertCanViewSession(viewerId, session.ownerUserId);
    const presence = await this.presenceService.getPresence(
      session.ownerUserId,
    );
    const isPresenceTraining = presence?.status === PresenceStatus.TRAINING;
    if (!isPresenceTraining) {
      session = await this.lifecycle.lazyCloseIfIdle(session);
    }
    return await this.buildSessionPayload(viewerId, session);
  }

  async endSessionById(
    viewerId: string,
    sessionId: string,
  ): Promise<{ id: string; date: string; endedAt: string }> {
    const session = await this.lifecycle.findById(sessionId);
    if (viewerId !== session.ownerUserId) {
      throw new ForbiddenException(
        'Seul le propriétaire peut terminer la séance',
      );
    }
    const closed = await this.lifecycle.endSessionNow(session);
    return {
      id: closed.id,
      date: closed.sessionDate,
      endedAt: closed.endedAt!.toISOString(),
    };
  }

  private async buildSessionPayload(
    viewerId: string,
    session: WorkoutSessionEntity,
  ) {
    const ownerUserId = session.ownerUserId;
    const date = session.sessionDate;

    const profile = await this.profilesRepo.findOne({
      where: { userId: ownerUserId },
    });
    if (!profile) throw new NotFoundException('Profil introuvable');

    const allEntries = await this.performanceEntriesService.list(ownerUserId, {
      withLeagueInsights: true,
    });
    const scoped = allEntries.filter((e) => !e.deletedAt);
    const bySessionId = scoped.filter(
      (e) =>
        (e as { workoutSessionId?: string | null }).workoutSessionId ===
        session.id,
    );
    const sessionEntries =
      bySessionId.length > 0
        ? bySessionId
        : scoped.filter((e) => e.date === date);

    const trackedExerciseIds = [
      ...new Set(sessionEntries.map((e) => e.trackedExerciseId)),
    ];
    const allExercises =
      await this.trackedExercisesService.listWithPerformance(ownerUserId);
    const exercises = allExercises.filter((ex) =>
      trackedExerciseIds.includes(ex.id),
    );

    const highlights = sessionEntries
      .filter((e) => {
        if (!('leagueInsight' in e)) return false;
        const insight = e.leagueInsight as { isRecord?: boolean } | undefined;
        return insight?.isRecord === true;
      })
      .map((e) => ({ entryId: e.id, type: 'pr' as const }));

    const presence = await this.presenceService.getPresence(ownerUserId);
    const lastSetAt = await this.lifecycle.getLastSetAt(session.id);
    const isLive = this.lifecycle.isSessionLive(session, {
      todayKey: date,
      isPresenceTraining: presence?.status === PresenceStatus.TRAINING,
      lastSetAt,
    });

    const xpEarned = await this.progressService.getDailyXpTotal(
      ownerUserId,
      date,
    );

    const commentCount = await this.commentsRepo.count({
      where: {
        workoutSessionId: session.id,
        deletedAt: IsNull(),
      },
    });

    const { reactions, reactionsByExerciseId } =
      await this.aggregateReactionsBySession(viewerId, session.id);

    return {
      id: session.id,
      owner: {
        userId: ownerUserId,
        firstName: profile.firstName ?? null,
        lastName: profile.lastName ?? null,
        username: profile.username ?? null,
        avatarUrl: profile.avatarUrl ?? null,
      },
      date,
      isLive,
      endedAt: session.endedAt?.toISOString() ?? null,
      xpEarned,
      exercises,
      entries: sessionEntries,
      highlights,
      commentCount,
      exerciseCount: exercises.length,
      setCount: sessionEntries.length,
      reactions,
      reactionsByExerciseId,
    };
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
    const isPresenceTraining = presence?.status === PresenceStatus.TRAINING;
    const daySessionsRaw = await this.lifecycle.listForDay(ownerUserId, date);
    // Présence training : ne pas persister de fin idle (compat vieux clients live).
    if (!isPresenceTraining) {
      for (const raw of daySessionsRaw) {
        await this.lifecycle.lazyCloseIfIdle(raw);
      }
    }
    const daySessions = isPresenceTraining
      ? daySessionsRaw
      : await this.lifecycle.listForDay(ownerUserId, date);
    let isLive = false;
    let liveSessionId: string | undefined;
    for (const sessionRow of daySessions) {
      const lastSetAt = await this.lifecycle.getLastSetAt(sessionRow.id);
      if (
        this.lifecycle.isSessionLive(sessionRow, {
          todayKey: date,
          isPresenceTraining,
          lastSetAt,
        })
      ) {
        isLive = true;
        liveSessionId = sessionRow.id;
        break;
      }
    }
    if (!isLive && daySessions.length === 0 && lastEntry) {
      const idleMs = Date.now() - new Date(lastEntry.createdAt).getTime();
      isLive = isPresenceTraining || idleMs < SESSION_ACTIVE_IDLE_MS;
    }

    const primary =
      (liveSessionId
        ? daySessions.find((s) => s.id === liveSessionId)
        : null) ??
      daySessions.find((s) => !s.endedAt) ??
      daySessions[daySessions.length - 1];

    const endedAt = isLive ? null : (primary?.endedAt?.toISOString() ?? null);

    const xpEarned = await this.progressService.getDailyXpTotal(
      ownerUserId,
      date,
    );

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
      id: primary?.id,
      owner: {
        userId: ownerUserId,
        firstName: profile.firstName ?? null,
        lastName: profile.lastName ?? null,
        username: profile.username ?? null,
        avatarUrl: profile.avatarUrl ?? null,
      },
      date,
      isLive,
      endedAt,
      xpEarned,
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

  /**
   * @deprecated Facade jour : clôture la session **ouverte** du jour.
   * Réservé au propriétaire.
   */
  async endSession(
    viewerId: string,
    ownerUserId: string,
    date: string,
  ): Promise<{ date: string; endedAt: string }> {
    this.assertValidDate(date);
    if (viewerId !== ownerUserId) {
      throw new ForbiddenException(
        'Seul le propriétaire peut terminer la séance',
      );
    }

    const allEntries = await this.performanceEntriesService.list(ownerUserId);
    const entries = allEntries.filter((e) => e.date === date && !e.deletedAt);
    if (entries.length === 0) {
      throw new NotFoundException('Aucune séance pour ce jour');
    }

    const open = await this.lifecycle.findOpenSession(ownerUserId);
    if (open && open.sessionDate === date) {
      const closed = await this.lifecycle.endSessionNow(open);
      return { date, endedAt: closed.endedAt!.toISOString() };
    }

    const daySessions = await this.lifecycle.listForDay(ownerUserId, date);
    const latest = daySessions[daySessions.length - 1];
    if (latest && !latest.endedAt) {
      const closed = await this.lifecycle.endSessionNow(latest);
      return { date, endedAt: closed.endedAt!.toISOString() };
    }
    if (latest?.endedAt) {
      return { date, endedAt: latest.endedAt.toISOString() };
    }

    const created = await this.lifecycle.attachOrCreateSession(
      ownerUserId,
      date,
      new Date(),
    );
    const closed = await this.lifecycle.endSessionNow(created);
    return { date, endedAt: closed.endedAt!.toISOString() };
  }

  private aggregateReactionRows(
    rows: SessionReactionEntity[],
    viewerId: string,
    authors: Map<string, UserProfileEntity | null>,
  ): ReactionBubbleDto[] {
    const byEmoji = new Map<
      string,
      { count: number; reactedByMe: boolean; userIds: string[] }
    >();
    for (const row of rows) {
      const current = byEmoji.get(row.emoji) ?? {
        count: 0,
        reactedByMe: false,
        userIds: [],
      };
      current.count += 1;
      current.userIds.push(row.authorUserId);
      if (row.authorUserId === viewerId) current.reactedByMe = true;
      byEmoji.set(row.emoji, current);
    }
    return [...byEmoji.entries()]
      .map(([emoji, value]) => ({
        emoji,
        count: value.count,
        reactedByMe: value.reactedByMe,
        users: value.userIds.map((userId) =>
          this.mapAuthor(authors.get(userId) ?? null, userId),
        ),
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
    return this.partitionReactionRows(viewerId, rows);
  }

  private async aggregateReactionsBySession(
    viewerId: string,
    workoutSessionId: string,
  ): Promise<{
    reactions: ReactionBubbleDto[];
    reactionsByExerciseId: Record<string, ReactionBubbleDto[]>;
  }> {
    const rows = await this.reactionsRepo.find({
      where: { workoutSessionId },
      order: { createdAt: 'ASC' },
    });
    return this.partitionReactionRows(viewerId, rows);
  }

  private async partitionReactionRows(
    viewerId: string,
    rows: SessionReactionEntity[],
  ): Promise<{
    reactions: ReactionBubbleDto[];
    reactionsByExerciseId: Record<string, ReactionBubbleDto[]>;
  }> {
    const authors = await this.loadAuthors(rows.map((row) => row.authorUserId));

    const sessionRows = rows.filter((row) => row.targetType === 'session');
    const reactions = this.aggregateReactionRows(
      sessionRows,
      viewerId,
      authors,
    );

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
        authors,
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

    const workoutSessionId = await this.resolveSessionIdForDay(
      ownerUserId,
      date,
    );

    let added = false;
    if (existing) {
      await this.reactionsRepo.remove(existing);
    } else {
      await this.reactionsRepo.save(
        this.reactionsRepo.create({
          ownerUserId,
          sessionDate: date,
          workoutSessionId,
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
    const authors = await this.loadAuthors(
      targetRows.map((row) => row.authorUserId),
    );

    return {
      added,
      target: {
        targetType,
        trackedExerciseId: resolvedTrackedId,
        reactions: this.aggregateReactionRows(targetRows, viewerId, authors),
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
    let effectiveParentId: string | null = parentId ?? null;
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
      // Réponse à une réponse : même niveau (sous la racine), pas de profondeur +1.
      if (parent.parentId) {
        effectiveParentId = parent.parentId;
      }
      parentAuthorUserId = parent.authorUserId;
    }

    const workoutSessionId = await this.resolveSessionIdForDay(
      ownerUserId,
      date,
    );

    const entity = await this.commentsRepo.save(
      this.commentsRepo.create({
        ownerUserId,
        sessionDate: date,
        workoutSessionId,
        authorUserId: viewerId,
        parentId: effectiveParentId,
        body: trimmed,
      }),
    );

    const authors = await this.loadAuthors([viewerId]);
    return {
      comment: this.toCommentDto(entity, authors),
      parentAuthorUserId,
    };
  }

  /** Séance ouverte du jour, sinon la plus récente (dual-emit realtime legacy). */
  async resolveSessionIdForDay(
    ownerUserId: string,
    date: string,
  ): Promise<string | null> {
    const open = await this.lifecycle.findOpenSession(ownerUserId);
    if (open && open.sessionDate === date) return open.id;
    const daySessions = await this.lifecycle.listForDay(ownerUserId, date);
    return daySessions[daySessions.length - 1]?.id ?? null;
  }

  async listCommentsBySessionId(
    viewerId: string,
    sessionId: string,
  ): Promise<{ items: SessionCommentDto[] }> {
    const session = await this.lifecycle.findById(sessionId);
    await this.assertCanViewSession(viewerId, session.ownerUserId);

    const comments = await this.commentsRepo.find({
      where: {
        workoutSessionId: sessionId,
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

    const authors = await this.loadAuthors(comments.map((c) => c.authorUserId));
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

  async createCommentBySessionId(
    viewerId: string,
    sessionId: string,
    body: string,
    parentId?: string,
  ): Promise<{
    comment: SessionCommentDto;
    parentAuthorUserId: string | null;
  }> {
    const session = await this.lifecycle.findById(sessionId);
    await this.assertCanViewSession(viewerId, session.ownerUserId);

    const trimmed = body.trim();
    if (!trimmed) throw new BadRequestException('Message vide');

    let parentAuthorUserId: string | null = null;
    let effectiveParentId: string | null = parentId ?? null;
    if (parentId) {
      const parent = await this.commentsRepo.findOne({
        where: {
          id: parentId,
          workoutSessionId: sessionId,
          deletedAt: IsNull(),
        },
      });
      if (!parent)
        throw new NotFoundException('Commentaire parent introuvable');
      if (parent.parentId) {
        effectiveParentId = parent.parentId;
      }
      parentAuthorUserId = parent.authorUserId;
    }

    const entity = await this.commentsRepo.save(
      this.commentsRepo.create({
        ownerUserId: session.ownerUserId,
        sessionDate: session.sessionDate,
        workoutSessionId: sessionId,
        authorUserId: viewerId,
        parentId: effectiveParentId,
        body: trimmed,
      }),
    );

    const authors = await this.loadAuthors([viewerId]);
    return {
      comment: this.toCommentDto(entity, authors),
      parentAuthorUserId,
    };
  }

  async updateCommentBySessionId(
    viewerId: string,
    sessionId: string,
    commentId: string,
    body: string,
  ): Promise<SessionCommentDto> {
    const session = await this.lifecycle.findById(sessionId);
    await this.assertCanViewSession(viewerId, session.ownerUserId);

    const trimmed = body.trim();
    if (!trimmed) throw new BadRequestException('Message vide');

    const comment = await this.commentsRepo.findOne({
      where: {
        id: commentId,
        workoutSessionId: sessionId,
        deletedAt: IsNull(),
      },
    });
    if (!comment) throw new NotFoundException('Commentaire introuvable');
    if (comment.authorUserId !== viewerId) {
      throw new ForbiddenException('Modification non autorisée');
    }

    comment.body = trimmed;
    const entity = await this.commentsRepo.save(comment);
    const authors = await this.loadAuthors([viewerId]);
    return this.toCommentDto(entity, authors);
  }

  async deleteCommentBySessionId(
    viewerId: string,
    sessionId: string,
    commentId: string,
  ) {
    const session = await this.lifecycle.findById(sessionId);
    await this.assertCanViewSession(viewerId, session.ownerUserId);

    const comment = await this.commentsRepo.findOne({
      where: {
        id: commentId,
        workoutSessionId: sessionId,
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

  async toggleReactionBySessionId(
    viewerId: string,
    sessionId: string,
    emoji: string,
    targetType: SessionReactionTargetType,
    trackedExerciseId?: string,
  ): Promise<{
    target: SessionReactionTargetDto;
    added: boolean;
  }> {
    const session = await this.lifecycle.findById(sessionId);
    await this.assertCanViewSession(viewerId, session.ownerUserId);
    this.assertAllowedEmoji(emoji);
    const resolvedTrackedId = this.assertReactionTarget(
      targetType,
      trackedExerciseId,
    );

    const existing = await this.reactionsRepo.findOne({
      where: {
        workoutSessionId: sessionId,
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
          ownerUserId: session.ownerUserId,
          sessionDate: session.sessionDate,
          workoutSessionId: sessionId,
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
        workoutSessionId: sessionId,
        targetType,
        trackedExerciseId:
          resolvedTrackedId === null ? IsNull() : resolvedTrackedId,
      },
      order: { createdAt: 'ASC' },
    });
    const authors = await this.loadAuthors(
      targetRows.map((row) => row.authorUserId),
    );

    return {
      added,
      target: {
        targetType,
        trackedExerciseId: resolvedTrackedId,
        reactions: this.aggregateReactionRows(targetRows, viewerId, authors),
      },
    };
  }

  async updateComment(
    viewerId: string,
    ownerUserId: string,
    date: string,
    commentId: string,
    body: string,
  ): Promise<SessionCommentDto> {
    this.assertValidDate(date);
    await this.assertCanViewSession(viewerId, ownerUserId);

    const trimmed = body.trim();
    if (!trimmed) throw new BadRequestException('Message vide');

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
      throw new ForbiddenException('Modification non autorisée');
    }

    comment.body = trimmed;
    const entity = await this.commentsRepo.save(comment);
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
