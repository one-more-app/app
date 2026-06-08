import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { UserEntity } from '../../auth/entities/user.entity.js';

@Entity({ name: 'notification_preferences' })
export class NotificationPreferencesEntity {
  @PrimaryColumn({ type: 'uuid' })
  userId!: string;

  @OneToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: Relation<UserEntity>;

  @Column({ type: 'boolean', default: true })
  streakReminders!: boolean;

  @Column({ type: 'boolean', default: true })
  friendRequests!: boolean;

  @Column({ type: 'boolean', default: true })
  friendAccepted!: boolean;

  @Column({ type: 'boolean', default: true })
  messages!: boolean;

  @Column({ type: 'boolean', default: true })
  friendTraining!: boolean;

  @Column({ type: 'boolean', default: true })
  friendRecords!: boolean;

  @Column({ type: 'boolean', default: true })
  weeklyRecap!: boolean;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
