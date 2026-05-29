import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { XpSourceType } from './xp-source-type.enum.js';

@Entity({ name: 'xp_events' })
@Unique('UQ_xp_events_userId_sourceType_sourceId', [
  'userId',
  'sourceType',
  'sourceId',
])
@Index('IDX_xp_events_userId_activityDate', ['userId', 'activityDate'])
export class XpEventEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  userId!: string;

  @Column({ type: 'text' })
  sourceType!: XpSourceType;

  @Column({ type: 'text' })
  sourceId!: string;

  @Column({ type: 'int' })
  amount!: number;

  @CreateDateColumn({ type: 'timestamptz' })
  earnedAt!: Date;

  @Column({ type: 'date' })
  activityDate!: string;
}
