import { Controller, Get, Query } from '@nestjs/common';
import { ExercisesService } from './exercises.service.js';
import { ListExercisesQueryDto } from './exercises.dto.js';

@Controller('/exercises')
export class ExercisesController {
  constructor(private readonly exercises: ExercisesService) {}

  @Get()
  async list(@Query() query: ListExercisesQueryDto) {
    const limitRaw = query.limit as unknown as string | undefined;
    const offsetRaw = query.offset as unknown as string | undefined;
    const parsedLimit = Number.parseInt(limitRaw ?? '', 10);
    const parsedOffset = Number.parseInt(offsetRaw ?? '', 10);
    return await this.exercises.list({
      ...query,
      limit: Number.isFinite(parsedLimit) ? parsedLimit : 25,
      offset: Number.isFinite(parsedOffset) ? parsedOffset : 0,
    });
  }

  @Get('/meta')
  async meta() {
    return await this.exercises.meta();
  }
}
