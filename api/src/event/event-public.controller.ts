import { Body, Controller, Get, Header, Patch, Post } from '@nestjs/common';
import { CreateEventEntryDto } from './dto/create-event-entry.dto.js';
import { PatchEventAttemptRepsDto } from './dto/patch-event-attempt-reps.dto.js';
import { StartEventAttemptDto } from './dto/start-event-attempt.dto.js';
import { EventService } from './event.service.js';

@Controller('/public/event')
export class EventPublicController {
  constructor(private readonly eventService: EventService) {}

  @Get('/leaderboard')
  @Header('Cache-Control', 'no-cache')
  async getLeaderboard() {
    return await this.eventService.getLeaderboardPayload();
  }

  @Post('/entries')
  async createEntry(@Body() body: CreateEventEntryDto) {
    const entry = await this.eventService.createEntry(body);
    return { entry };
  }

  @Post('/attempt/start')
  async startAttempt(@Body() body: StartEventAttemptDto) {
    const attempt = await this.eventService.startAttempt(body);
    return { attempt };
  }

  @Patch('/attempt/reps')
  async patchAttemptReps(@Body() body: PatchEventAttemptRepsDto) {
    const attempt = await this.eventService.patchAttemptReps(body.reps);
    return { attempt };
  }

  @Post('/attempt/finalize')
  async finalizeAttempt() {
    return await this.eventService.finalizeAttempt();
  }

  @Post('/attempt/cancel')
  async cancelAttempt() {
    return await this.eventService.cancelAttempt();
  }

  @Post('/celebration/dismiss')
  async dismissCelebration() {
    return await this.eventService.dismissActiveCelebration();
  }

  @Post('/attempt/result/dismiss')
  async dismissAttemptResult() {
    return await this.eventService.dismissRecentAttemptResult();
  }

  @Post('/display/dismiss')
  async dismissTvDisplay() {
    return await this.eventService.dismissTvDisplay();
  }

  @Post('/entries/reset')
  async softDeleteAllEntries() {
    return await this.eventService.softDeleteAllEventData();
  }

  @Get('/entries/recent')
  @Header('Cache-Control', 'no-cache')
  async getRecentEntries() {
    const entries = await this.eventService.getRecentEntries();
    return { entries };
  }
}
