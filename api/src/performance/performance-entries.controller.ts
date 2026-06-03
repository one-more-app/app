import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard.js';
import {
  CreatePerformanceEntryDto,
  ListPerformanceEntriesQueryDto,
  UpdatePerformanceEntryDto,
} from './performance-entries.dto.js';
import { PerformanceEntriesService } from './performance-entries.service.js';

@UseGuards(JwtAuthGuard)
@Controller('/performance-entries')
export class PerformanceEntriesController {
  constructor(
    private readonly performanceEntriesService: PerformanceEntriesService,
  ) {}

  @Get()
  async list(@Req() req: any, @Query() query: ListPerformanceEntriesQueryDto) {
    return await this.performanceEntriesService.list(req.user.sub, {
      trackedExerciseId: query.trackedExerciseId,
      includeDeleted: query.includeDeleted === true,
      withLeagueInsights: query.withLeagueInsights === true,
    });
  }

  @Post()
  async create(@Req() req: any, @Body() body: CreatePerformanceEntryDto) {
    return await this.performanceEntriesService.create(req.user.sub, body);
  }

  @Patch('/:id')
  async update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: UpdatePerformanceEntryDto,
  ) {
    return await this.performanceEntriesService.update(req.user.sub, id, body);
  }

  @Delete('/:id')
  async remove(@Req() req: any, @Param('id') id: string) {
    return await this.performanceEntriesService.remove(req.user.sub, id);
  }
}
