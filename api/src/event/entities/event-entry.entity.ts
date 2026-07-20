import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { EventExercise } from './event-exercise.enum.js';
import { EventGender } from './event-gender.enum.js';

@Entity('event_entries')
@Index(['exercise', 'gender', 'reps', 'createdAt'])
export class EventEntryEntity {
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

  @Column({ type: 'integer' })
  reps!: number;

  @Column({ type: 'varchar', length: 500, nullable: true })
  notes!: string | null;

  @Column({ type: 'boolean', default: false })
  beatPreviousLeader!: boolean;

  @Column({ type: 'boolean', default: false })
  tshirtAwarded!: boolean;

  @Column({ type: 'boolean', default: false })
  celebrationPending!: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}
