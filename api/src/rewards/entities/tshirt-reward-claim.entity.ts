import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TshirtRewardStatus } from './tshirt-reward-status.enum.js';
import { TshirtRewardType } from './tshirt-reward-type.enum.js';

@Entity('tshirt_reward_claims')
@Index(['userId', 'rewardType'], { unique: true })
export class TshirtRewardClaimEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  userId!: string;

  @Column({
    type: 'enum',
    enum: TshirtRewardType,
  })
  rewardType!: TshirtRewardType;

  @Column({
    type: 'enum',
    enum: TshirtRewardStatus,
    default: TshirtRewardStatus.ClaimPending,
  })
  status!: TshirtRewardStatus;

  @Column({ type: 'varchar', length: 8, nullable: true })
  size!: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  fullName!: string | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  street!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city!: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  postalCode!: string | null;

  @Column({ type: 'varchar', length: 80, nullable: true })
  country!: string | null;

  @Column({ type: 'varchar', length: 80, nullable: true })
  trackingNumber!: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  claimedAt!: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  shippedAt!: Date | null;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
