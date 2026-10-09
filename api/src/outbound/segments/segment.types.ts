import type { SelectQueryBuilder } from 'typeorm';
import { UserEntity } from '../../auth/entities/user.entity.js';

export type SegmentContext = {
  params: Record<string, unknown>;
};

export type OutboundSegment = {
  key: string;
  resolveUserIds: (
    qb: SelectQueryBuilder<UserEntity>,
    ctx: SegmentContext,
  ) => Promise<string[]>;
};
