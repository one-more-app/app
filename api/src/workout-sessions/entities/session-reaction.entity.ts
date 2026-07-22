import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { UserEntity } from '../../auth/entities/user.entity.js';

export const SESSION_REACTION_EMOJIS = ['🔥', '💪', '👏', '😮', '❤️'] as const;

export type SessionReactionEmoji = (typeof SESSION_REACTION_EMOJIS)[number];

export type SessionReactionTargetType = 'session' | 'exercise';

@Entity({ name: 'session_reactions' })
export class SessionReactionEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  ownerUserId!: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ownerUserId' })
  owner!: Relation<UserEntity>;

  @Column({ type: 'date' })
  sessionDate!: string;

  @Column({ type: 'uuid' })
  authorUserId!: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'authorUserId' })
  author!: Relation<UserEntity>;

  @Column({ type: 'varchar', length: 16 })
  emoji!: string;

  @Column({ type: 'varchar', length: 16 })
  targetType!: SessionReactionTargetType;

  @Column({ type: 'varchar', length: 128, nullable: true })
  trackedExerciseId!: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}
