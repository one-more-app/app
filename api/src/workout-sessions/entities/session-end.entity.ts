import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { UserEntity } from '../../auth/entities/user.entity.js';

/** Fin explicite d'une séance (un jour d'un utilisateur). */
@Entity({ name: 'workout_session_ends' })
@Unique('UQ_workout_session_ends_owner_date', ['ownerUserId', 'sessionDate'])
export class SessionEndEntity {
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
  endedAt!: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}
