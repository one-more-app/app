import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard.js';
import { NotificationDispatchService } from '../notifications/notification-dispatch.service.js';
import { RealtimeBroadcaster } from '../realtime/realtime-broadcaster.service.js';
import { CreateSessionCommentDto } from './dto/create-session-comment.dto.js';
import { ToggleSessionReactionDto } from './dto/toggle-session-reaction.dto.js';
import { WorkoutSessionsService } from './workout-sessions.service.js';

@Controller('sessions')
@UseGuards(JwtAuthGuard)
export class WorkoutSessionsController {
  constructor(
    private readonly sessionsService: WorkoutSessionsService,
    private readonly realtime: RealtimeBroadcaster,
    private readonly notifications: NotificationDispatchService,
  ) {}

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
