import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { OutboundDispatchEntity } from './outbound-dispatch.entity.js';

export type OutboundMessageStatus =
  | 'pending'
  | 'sending'
  | 'sent'
  | 'failed'
  | 'suppressed';

@Entity({ name: 'outbound_messages' })
@Index('IDX_outbound_messages_status_createdAt', ['status', 'createdAt'])
@Index('IDX_outbound_messages_userId', ['userId'])
export class OutboundMessageEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', nullable: true })
  dispatchId!: string | null;

  @ManyToOne(() => OutboundDispatchEntity, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'dispatchId' })
  dispatch!: Relation<OutboundDispatchEntity | null>;

  @Column({ type: 'uuid' })
  userId!: string;

  @Column({ type: 'text' })
  templateKey!: string;

  @Column({ type: 'text' })
  channel!: string;

  @Column({ type: 'text' })
  category!: string;

  @Column({ type: 'text', unique: true })
  dedupKey!: string;

  @Column({ type: 'text', default: 'pending' })
  status!: OutboundMessageStatus;

  @Column({ type: 'jsonb', default: () => "'{}'" })
  variables!: Record<string, string | number | boolean>;

  @Column({ type: 'text', nullable: true })
  providerMessageId!: string | null;

  @Column({ type: 'text', nullable: true })
  lastError!: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  sentAt!: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  openedAt!: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  clickedAt!: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
