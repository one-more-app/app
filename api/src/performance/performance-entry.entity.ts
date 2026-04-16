import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { UserEntity } from '../auth/entities/user.entity.js';
import { TrackedExerciseEntity } from '../tracked-exercises/tracked-exercise.entity.js';

@Entity({ name: 'performance_entries' })
@Index('IDX_performance_entries_userId', ['userId'])
@Index('IDX_performance_entries_trackedExerciseId', ['trackedExerciseId'])
@Unique('UQ_performance_entries_userId_clientId', ['userId', 'clientId'])
export class PerformanceEntryEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  userId!: string;

  @ManyToOne(() => UserEntity, (user) => user.performanceEntries, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user!: Relation<UserEntity>;

  @Column({ type: 'text' })
  clientId!: string;

  @Column({ type: 'uuid' })
  trackedExerciseId!: string;

  @ManyToOne(() => TrackedExerciseEntity, (tracked) => tracked.entries, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'trackedExerciseId' })
  trackedExercise!: Relation<TrackedExerciseEntity>;

  @Column({ type: 'date' })
  date!: string;

  @Column({ type: 'double precision' })
  weight!: number;

  @Column({ type: 'integer' })
  reps!: number;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  deletedAt!: Date | null;
}
