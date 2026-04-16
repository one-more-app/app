import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { UserEntity } from '../auth/entities/user.entity.js';
import { PerformanceEntryEntity } from '../performance/performance-entry.entity.js';

@Entity({ name: 'tracked_exercises' })
@Index('IDX_tracked_exercises_userId', ['userId'])
@Unique('UQ_tracked_exercises_userId_clientId', ['userId', 'clientId'])
export class TrackedExerciseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  userId!: string;

  @ManyToOne(() => UserEntity, (user) => user.trackedExercises, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user!: Relation<UserEntity>;

  @Column({ type: 'text' })
  clientId!: string;

  @Column({ type: 'text' })
  exerciseId!: string;

  @Column({ type: 'text' })
  name!: string;

  @Column({ type: 'text', nullable: true })
  originalName!: string | null;

  @Column({ type: 'text', nullable: true })
  bodyPart!: string | null;

  @Column({ type: 'text', nullable: true })
  target!: string | null;

  @Column({ type: 'text', nullable: true })
  equipment!: string | null;

  @Column({ type: 'text', nullable: true })
  category!: string | null;

  @Column({ type: 'text', nullable: true })
  gifUrl!: string | null;

  @Column({ type: 'boolean' })
  isCustom!: boolean;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  deletedAt!: Date | null;

  @OneToMany(() => PerformanceEntryEntity, (entry) => entry.trackedExercise)
  entries!: Relation<PerformanceEntryEntity[]>;
}
