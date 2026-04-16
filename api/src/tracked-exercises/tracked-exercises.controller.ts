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
  CreateTrackedExerciseDto,
  ListTrackedExercisesQueryDto,
  UpdateTrackedExerciseDto,
} from './tracked-exercises.dto.js';
import { TrackedExercisesService } from './tracked-exercises.service.js';

@UseGuards(JwtAuthGuard)
@Controller('/tracked-exercises')
export class TrackedExercisesController {
  constructor(private readonly trackedExercisesService: TrackedExercisesService) {}

  @Get()
  async list(@Req() req: any, @Query() query: ListTrackedExercisesQueryDto) {
    if (query.withPerformance === true) {
      return await this.trackedExercisesService.listWithPerformance(req.user.sub);
    }

    return await this.trackedExercisesService.list(
      req.user.sub,
      query.includeDeleted === true,
    );
  }

  @Post()
  async create(@Req() req: any, @Body() body: CreateTrackedExerciseDto) {
    return await this.trackedExercisesService.create(req.user.sub, body);
  }

  @Patch('/:id')
  async update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: UpdateTrackedExerciseDto,
  ) {
    return await this.trackedExercisesService.update(req.user.sub, id, body);
  }

  @Delete('/:id')
  async remove(@Req() req: any, @Param('id') id: string) {
    return await this.trackedExercisesService.remove(req.user.sub, id);
  }
}
