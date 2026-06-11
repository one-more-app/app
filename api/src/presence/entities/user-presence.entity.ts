import { Column, Entity, JoinColumn, OneToOne, PrimaryColumn } from 'typeorm';
import type { Relation } from 'typeorm';
import { UserEntity } from '../../auth/entities/user.entity.js';
import { PresenceStatus } from './presence-status.enum.js';

@Entity({ name: 'user_presence' })
export class UserPresenceEntity {
  @PrimaryColumn({ type: 'uuid' })
  userId!: string;

  @OneToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: Relation<UserEntity>;

  @Column({
    type: 'enum',
    enum: PresenceStatus,
    default: PresenceStatus.OFFLINE,
  })
  status!: PresenceStatus;

  @Column({ type: 'text', nullable: true })
  exerciseName!: string | null;

  @Column({ type: 'text', nullable: true })
  trackedExerciseId!: string | null;

  @Column({ type: 'timestamptz' })
  lastHeartbeatAt!: Date;
}
