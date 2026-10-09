import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { UserEntity } from '../../auth/entities/user.entity.js';

/** Séance d'entraînement first-class (plusieurs possibles le même jour). */
@Entity({ name: 'workout_sessions' })
@Index('IDX_workout_sessions_owner_date', ['ownerUserId', 'sessionDate'])
@Index('IDX_workout_sessions_owner_ended', ['ownerUserId', 'endedAt'])
export class WorkoutSessionEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  ownerUserId!: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ownerUserId' })
  owner!: Relation<UserEntity>;

  @Column({ type: 'date' })
  sessionDate!: string;

  @Column({ type: 'timestamptz' })
  startedAt!: Date;

  /** Null = séance encore ouverte. */
  @Column({ type: 'timestamptz', nullable: true })
  endedAt!: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}
