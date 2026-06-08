import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { UserEntity } from '../../auth/entities/user.entity.js';

@Entity({ name: 'friend_training_alerts' })
export class FriendTrainingAlertEntity {
  @PrimaryColumn({ type: 'uuid' })
  subscriberId!: string;

  @PrimaryColumn({ type: 'uuid' })
  friendId!: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'subscriberId' })
  subscriber!: Relation<UserEntity>;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'friendId' })
  friend!: Relation<UserEntity>;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}
