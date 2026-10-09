import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../../auth/entities/user.entity.js';
import { activeWithEmailSegment } from './active-with-email.segment.js';
import { inactiveSinceSegment } from './inactive-since.segment.js';
import { lapsedAfterSessionSegment } from './lapsed-after-session.segment.js';
import { registeredNoExerciseSegment } from './registered-no-exercise.segment.js';
import { registeredNoPushSegment } from './registered-no-push.segment.js';
import { signedUpDaysAgoSegment } from './signed-up-days-ago.segment.js';
import { streakAtRiskSegment } from './streak-at-risk.segment.js';
import type { OutboundSegment } from './segment.types.js';

@Injectable()
export class SegmentRegistryService {
  private readonly segments: Map<string, OutboundSegment>;

  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepo: Repository<UserEntity>,
  ) {
    const list = [
      activeWithEmailSegment,
      inactiveSinceSegment,
      signedUpDaysAgoSegment,
      streakAtRiskSegment,
      registeredNoExerciseSegment,
      registeredNoPushSegment,
      lapsedAfterSessionSegment,
    ];
    this.segments = new Map(list.map((s) => [s.key, s]));
  }

  async resolveUserIds(
    segmentKey: string,
    params: Record<string, unknown>,
  ): Promise<string[]> {
    const segment = this.segments.get(segmentKey);
    if (!segment) {
      throw new NotFoundException(`Segment inconnu: ${segmentKey}`);
    }
    const qb = this.usersRepo.createQueryBuilder('u');
    return segment.resolveUserIds(qb, { params });
  }
}
