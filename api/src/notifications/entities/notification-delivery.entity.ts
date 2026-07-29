import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { UserEntity } from '../../auth/entities/user.entity.js';

@Entity({ name: 'notification_deliveries' })
@Index('IDX_notification_deliveries_userId_sentAt', ['userId', 'sentAt'])
@Index('IDX_notification_deliveries_userId_readAt', ['userId', 'readAt'])
export class NotificationDeliveryEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  userId!: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: Relation<UserEntity>;

  @Column({ type: 'text' })
  type!: string;

  @Column({ type: 'text' })
  dedupKey!: string;

  @Column({ type: 'timestamptz' })
  sentAt!: Date;

  @Column({ type: 'text', nullable: true })
  title!: string | null;

  @Column({ type: 'text', nullable: true })
  body!: string | null;

  @Column({ type: 'text', nullable: true })
  route!: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  readAt!: Date | null;
}
