import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard.js';
import { NotificationDispatchService } from '../notifications/notification-dispatch.service.js';
import { RealtimeBroadcaster } from '../realtime/realtime-broadcaster.service.js';
import { CreateSessionCommentDto } from './dto/create-session-comment.dto.js';
import { ToggleSessionReactionDto } from './dto/toggle-session-reaction.dto.js';
import { UpdateSessionCommentDto } from './dto/update-session-comment.dto.js';
import { WorkoutSessionsService } from './workout-sessions.service.js';

@Controller('sessions')
@UseGuards(JwtAuthGuard)
export class WorkoutSessionsController {
  constructor(
    private readonly sessionsService: WorkoutSessionsService,
    private readonly realtime: RealtimeBroadcaster,
    private readonly notifications: NotificationDispatchService,
  ) {}

  // ——— Nouveau contrat (sessionId) ———

  @Get(':ownerUserId/day/:date')
  async listDaySessions(
    @Req() req: { user: { sub: string } },
    @Param('ownerUserId', ParseUUIDPipe) ownerUserId: string,
    @Param('date') date: string,
  ) {
    return await this.sessionsService.listDaySessions(
      req.user.sub,
      ownerUserId,
      date,
    );
  }

  @Get(':sessionId')
  async getSessionById(
    @Req() req: { user: { sub: string } },
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
  ) {
    return await this.sessionsService.getSessionById(req.user.sub, sessionId);
  }

  @Post(':sessionId/end')
  async endSessionById(
    @Req() req: { user: { sub: string } },
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
  ) {
    return await this.sessionsService.endSessionById(req.user.sub, sessionId);
  }

  @Get(':sessionId/comments')
  async listCommentsBySessionId(
    @Req() req: { user: { sub: string } },
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
  ) {
    return await this.sessionsService.listCommentsBySessionId(
      req.user.sub,
      sessionId,
    );
  }

  @Post(':sessionId/comments')
  async createCommentBySessionId(
    @Req() req: { user: { sub: string } },
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
    @Body() body: CreateSessionCommentDto,
  ) {
    const { comment, parentAuthorUserId } =
      await this.sessionsService.createCommentBySessionId(
        req.user.sub,
        sessionId,
        body.body,
        body.parentId,
      );
    const session = await this.sessionsService.getSessionById(
      req.user.sub,
      sessionId,
    );
    this.realtime.emitSessionCommentById(sessionId, comment);
    this.realtime.emitSessionComment(
      session.owner.userId,
      session.date,
      comment,
    );
    void this.notifications.notifySessionComment({
      ownerUserId: session.owner.userId,
      sessionDate: session.date,
      commentId: comment.id,
      authorUserId: req.user.sub,
      body: body.body,
      parentAuthorUserId,
    });
    return { comment };
  }

  @Patch(':sessionId/comments/:commentId')
  async updateCommentBySessionId(
    @Req() req: { user: { sub: string } },
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
    @Param('commentId', ParseUUIDPipe) commentId: string,
    @Body() body: UpdateSessionCommentDto,
  ) {
    const comment = await this.sessionsService.updateCommentBySessionId(
      req.user.sub,
      sessionId,
      commentId,
      body.body,
    );
    const session = await this.sessionsService.getSessionById(
      req.user.sub,
      sessionId,
    );
    this.realtime.emitSessionCommentById(sessionId, comment);
    this.realtime.emitSessionComment(
      session.owner.userId,
      session.date,
      comment,
    );
    return { comment };
  }

  @Delete(':sessionId/comments/:commentId')
  async deleteCommentBySessionId(
    @Req() req: { user: { sub: string } },
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
    @Param('commentId', ParseUUIDPipe) commentId: string,
  ) {
    return await this.sessionsService.deleteCommentBySessionId(
      req.user.sub,
      sessionId,
      commentId,
    );
  }

  @Post(':sessionId/reactions')
  async toggleReactionBySessionId(
    @Req() req: { user: { sub: string } },
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
    @Body() body: ToggleSessionReactionDto,
  ) {
    const { target, added } =
      await this.sessionsService.toggleReactionBySessionId(
        req.user.sub,
        sessionId,
        body.emoji,
        body.targetType,
        body.trackedExerciseId,
      );
    const session = await this.sessionsService.getSessionById(
      req.user.sub,
      sessionId,
    );
    this.realtime.emitSessionReactionById(sessionId, target);
    this.realtime.emitSessionReaction(
      session.owner.userId,
      session.date,
      target,
    );
    if (added) {
      void this.notifications.notifySessionReaction({
        ownerUserId: session.owner.userId,
        sessionDate: session.date,
        authorUserId: req.user.sub,
        emoji: body.emoji,
        targetType: body.targetType,
      });
    }
    return { target, added };
  }

  // ——— Legacy (deprecated) : agrégat jour pour vieux clients ———

  /** @deprecated Utiliser GET /sessions/:sessionId */
  @Get(':ownerUserId/:date')
  async getSession(
    @Req() req: { user: { sub: string } },
    @Param('ownerUserId', ParseUUIDPipe) ownerUserId: string,
    @Param('date') date: string,
  ) {
    return await this.sessionsService.getSession(
      req.user.sub,
      ownerUserId,
      date,
    );
  }

  /** @deprecated Utiliser POST /sessions/:sessionId/end */
  @Post(':ownerUserId/:date/end')
  async endSession(
    @Req() req: { user: { sub: string } },
    @Param('ownerUserId', ParseUUIDPipe) ownerUserId: string,
    @Param('date') date: string,
  ) {
    return await this.sessionsService.endSession(
      req.user.sub,
      ownerUserId,
      date,
    );
  }

  /** @deprecated Utiliser GET /sessions/:sessionId/comments */
  @Get(':ownerUserId/:date/comments')
  async listComments(
    @Req() req: { user: { sub: string } },
    @Param('ownerUserId', ParseUUIDPipe) ownerUserId: string,
    @Param('date') date: string,
  ) {
    return await this.sessionsService.listComments(
      req.user.sub,
      ownerUserId,
      date,
    );
  }

  /** @deprecated Utiliser POST /sessions/:sessionId/comments */
  @Post(':ownerUserId/:date/comments')
  async createComment(
    @Req() req: { user: { sub: string } },
    @Param('ownerUserId', ParseUUIDPipe) ownerUserId: string,
    @Param('date') date: string,
    @Body() body: CreateSessionCommentDto,
  ) {
    const { comment, parentAuthorUserId } =
      await this.sessionsService.createComment(
        req.user.sub,
        ownerUserId,
        date,
        body.body,
        body.parentId,
      );
    this.realtime.emitSessionComment(ownerUserId, date, comment);
    const sessionId = await this.sessionsService.resolveSessionIdForDay(
      ownerUserId,
      date,
    );
    if (sessionId) {
      this.realtime.emitSessionCommentById(sessionId, comment);
    }
    void this.notifications.notifySessionComment({
      ownerUserId,
      sessionDate: date,
      commentId: comment.id,
      authorUserId: req.user.sub,
      body: body.body,
      parentAuthorUserId,
    });
    return { comment };
  }

  /** @deprecated Utiliser PATCH /sessions/:sessionId/comments/:commentId */
  @Patch(':ownerUserId/:date/comments/:commentId')
  async updateComment(
    @Req() req: { user: { sub: string } },
    @Param('ownerUserId', ParseUUIDPipe) ownerUserId: string,
    @Param('date') date: string,
    @Param('commentId', ParseUUIDPipe) commentId: string,
    @Body() body: UpdateSessionCommentDto,
  ) {
    const comment = await this.sessionsService.updateComment(
      req.user.sub,
      ownerUserId,
      date,
      commentId,
      body.body,
    );
    this.realtime.emitSessionComment(ownerUserId, date, comment);
    const sessionId = await this.sessionsService.resolveSessionIdForDay(
      ownerUserId,
      date,
    );
    if (sessionId) {
      this.realtime.emitSessionCommentById(sessionId, comment);
    }
    return { comment };
  }

  /** @deprecated Utiliser DELETE /sessions/:sessionId/comments/:commentId */
  @Delete(':ownerUserId/:date/comments/:commentId')
  async deleteComment(
    @Req() req: { user: { sub: string } },
    @Param('ownerUserId', ParseUUIDPipe) ownerUserId: string,
    @Param('date') date: string,
    @Param('commentId', ParseUUIDPipe) commentId: string,
  ) {
    return await this.sessionsService.deleteComment(
      req.user.sub,
      ownerUserId,
      date,
      commentId,
    );
  }

  /** @deprecated Utiliser POST /sessions/:sessionId/reactions */
  @Post(':ownerUserId/:date/reactions')
  async toggleReaction(
    @Req() req: { user: { sub: string } },
    @Param('ownerUserId', ParseUUIDPipe) ownerUserId: string,
    @Param('date') date: string,
    @Body() body: ToggleSessionReactionDto,
  ) {
    const { target, added } = await this.sessionsService.toggleReaction(
      req.user.sub,
      ownerUserId,
      date,
      body.emoji,
      body.targetType,
      body.trackedExerciseId,
    );
    this.realtime.emitSessionReaction(ownerUserId, date, target);
    const sessionId = await this.sessionsService.resolveSessionIdForDay(
      ownerUserId,
      date,
    );
    if (sessionId) {
      this.realtime.emitSessionReactionById(sessionId, target);
    }
    if (added) {
      void this.notifications.notifySessionReaction({
        ownerUserId,
        sessionDate: date,
        authorUserId: req.user.sub,
        emoji: body.emoji,
        targetType: body.targetType,
      });
    }
    return { target, added };
  }
}
