import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TshirtRewardStatus } from './tshirt-reward-status.enum.js';

@Entity('tshirt_reward_claims')
export class TshirtRewardClaimEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index({ unique: true })
  @Column({ type: 'uuid' })
  userId!: string;

  @Column({
    type: 'enum',
    enum: TshirtRewardStatus,
    default: TshirtRewardStatus.Pending,
  })
  status!: TshirtRewardStatus;

  @Column({ type: 'varchar', length: 8 })
  size!: string;

  @Column({ type: 'varchar', length: 120 })
  fullName!: string;

  @Column({ type: 'varchar', length: 200 })
  street!: string;

  @Column({ type: 'varchar', length: 100 })
  city!: string;

  @Column({ type: 'varchar', length: 20 })
  postalCode!: string;

  @Column({ type: 'varchar', length: 80 })
  country!: string;

  @Column({ type: 'varchar', length: 80, nullable: true })
  trackingNumber!: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  claimedAt!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  shippedAt!: Date | null;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
