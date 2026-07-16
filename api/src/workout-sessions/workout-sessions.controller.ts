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
import { RealtimeBroadcaster } from '../realtime/realtime-broadcaster.service.js';
import { CreateSessionCommentDto } from './dto/create-session-comment.dto.js';
import { WorkoutSessionsService } from './workout-sessions.service.js';

@Controller('sessions')
@UseGuards(JwtAuthGuard)
export class WorkoutSessionsController {
  constructor(
    private readonly sessionsService: WorkoutSessionsService,
    private readonly realtime: RealtimeBroadcaster,
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
    const comment = await this.sessionsService.createComment(
      req.user.sub,
      ownerUserId,
      date,
      body.body,
      body.parentId,
    );
    this.realtime.emitSessionComment(ownerUserId, date, comment);
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
}
