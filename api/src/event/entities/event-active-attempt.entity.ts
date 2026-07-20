import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { EventExercise } from './event-exercise.enum.js';
import { EventGender } from './event-gender.enum.js';

@Entity('event_active_attempts')
export class EventActiveAttemptEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 80 })
  firstName!: string;

  @Column({ type: 'varchar', length: 80 })
  lastName!: string;

  @Column({ type: 'varchar', length: 255 })
  email!: string;

  @Column({ type: 'enum', enum: EventGender })
  gender!: EventGender;

  @Column({ type: 'enum', enum: EventExercise })
  exercise!: EventExercise;

  @Column({ type: 'varchar', length: 500, nullable: true })
  notes!: string | null;

  @Column({ type: 'integer', default: 0 })
  reps!: number;

  @CreateDateColumn({ type: 'timestamptz' })
  startedAt!: Date;
}
