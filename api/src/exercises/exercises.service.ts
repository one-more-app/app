import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { ExerciseCatalogEntity } from './exercise-catalog.entity.js';
import type { ExerciseCatalogDto, ListExercisesQueryDto } from './exercises.dto.js';

@Injectable()
export class ExercisesService {
  constructor(
    @InjectRepository(ExerciseCatalogEntity)
    private readonly catalogRepo: Repository<ExerciseCatalogEntity>,
  ) {}

  async list(query: ListExercisesQueryDto): Promise<{
    items: ExerciseCatalogDto[];
    total: number;
  }> {
    const limit = query.limit ?? 25;
    const offset = query.offset ?? 0;

    const qb = this.catalogRepo.createQueryBuilder('ex');
    qb.where('1=1');

    if (query.search?.trim()) {
      const q = `%${query.search.trim()}%`;
      qb.andWhere('(ex.name ILIKE :q OR ex."nameFr" ILIKE :q)', { q });
    }
    if (query.target) qb.andWhere('ex.target = :target', { target: query.target });
    if (query.equipment) {
      qb.andWhere('ex.equipment = :equipment', { equipment: query.equipment });
    }

    qb.orderBy('ex.name', 'ASC').limit(limit).offset(offset);
    const [rows, total] = await qb.getManyAndCount();

    return {
      items: rows.map((row) => ({
        id: row.exerciseId,
        name: row.name,
        ...(row.nameFr ? { nameFr: row.nameFr } : {}),
        bodyPart: row.bodyPart,
        target: row.target,
        equipment: row.equipment,
        secondaryMuscles: row.secondaryMuscles ?? [],
        instructions: row.instructions ?? [],
        ...(row.gifUrl ? { gifUrl: row.gifUrl } : {}),
      })),
      total,
    };
  }

  async meta(): Promise<{ targets: string[]; equipment: string[] }> {
    const targetsRows = await this.catalogRepo.find({
      select: { target: true },
      where: { target: ILike('%') },
    });
    const equipmentRows = await this.catalogRepo.find({
      select: { equipment: true },
      where: { equipment: ILike('%') },
    });

    const targets = Array.from(new Set(targetsRows.map((r) => r.target))).sort();
    const equipment = Array.from(new Set(equipmentRows.map((r) => r.equipment))).sort();
    return { targets, equipment };
  }
}
