import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { UserEntity } from '../../auth/entities/user.entity.js';

export type UserBadgeKind = 'ranking_gym' | 'streak' | 'personal_record';

export type RankingGymBadgeTier = 'top1' | 'top3' | 'top10' | 'top50';

@Entity({ name: 'user_badges' })
@Unique('UQ_user_badges_user_kind_source', ['userId', 'kind', 'sourceKey'])
@Index('IDX_user_badges_userId_earnedAt', ['userId', 'earnedAt'])
export class UserBadgeEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  userId!: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: Relation<UserEntity>;

  @Column({ type: 'varchar', length: 64 })
  kind!: UserBadgeKind;

  @Column({ type: 'varchar', length: 64 })
  tier!: string;

  /** Clé d’idempotence (ex. mois YYYY-MM pour ranking_gym). */
  @Column({ type: 'varchar', length: 128 })
  sourceKey!: string;

  @Column({ type: 'timestamptz' })
  earnedAt!: Date;

  @Column({ type: 'jsonb', default: {} })
  meta!: Record<string, unknown>;

  @Column({ type: 'varchar', length: 512, nullable: true })
  deeplink!: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}
