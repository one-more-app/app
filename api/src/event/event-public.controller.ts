import { Body, Controller, Get, Header, Post } from '@nestjs/common';
import { CreateEventEntryDto } from './dto/create-event-entry.dto.js';
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

  @Post('/celebration/dismiss')
  async dismissCelebration() {
    return await this.eventService.dismissActiveCelebration();
  }

  @Get('/entries/recent')
  @Header('Cache-Control', 'no-cache')
  async getRecentEntries() {
    const entries = await this.eventService.getRecentEntries();
    return { entries };
  }
}
