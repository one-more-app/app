import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { UserEntity } from '../auth/entities/user.entity.js';
import { AccessTier } from '../social/entities/access-tier.enum.js';

@Entity({ name: 'user_profiles' })
export class UserProfileEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', unique: true })
  userId!: string;

  @OneToOne(() => UserEntity, (user) => user.profile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: Relation<UserEntity>;

  @Column({ type: 'real', nullable: true })
  weightKg!: number | null;

  @Column({ type: 'real', nullable: true })
  heightCm!: number | null;

  @Column({ type: 'text', nullable: true })
  gender!: string | null;

  @Column({ type: 'text', nullable: true })
  firstName!: string | null;

  @Column({ type: 'text', nullable: true })
  lastName!: string | null;

  @Column({ type: 'text', nullable: true, unique: true })
  inviteCode!: string | null;

  @Column({ type: 'text', nullable: true })
  avatarUrl!: string | null;

  @Column({ type: 'text', nullable: true })
  username!: string | null;

  @Column({ type: 'boolean', default: true })
  searchableByName!: boolean;

  @Column({ type: 'boolean', default: true })
  discoverableByUsername!: boolean;

  @Column({
    type: 'enum',
    enum: AccessTier,
    default: AccessTier.LIMITED,
  })
  accessTier!: AccessTier;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
