import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export type OutboundDispatchStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed';

@Entity({ name: 'outbound_dispatches' })
export class OutboundDispatchEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'text' })
  segmentKey!: string;

  @Column({ type: 'jsonb', default: () => "'{}'" })
  segmentParams!: Record<string, unknown>;

  @Column({ type: 'text' })
  templateKey!: string;

  @Column({ type: 'text' })
  channel!: string;

  @Column({ type: 'text', nullable: true })
  campaignKey!: string | null;

  @Column({ type: 'text', unique: true })
  idempotencyKey!: string;

  @Column({ type: 'text', default: 'pending' })
  status!: OutboundDispatchStatus;

  @Column({ type: 'integer', default: 0 })
  recipientCount!: number;

  @Column({ type: 'integer', default: 0 })
  queuedCount!: number;

  @Column({ type: 'text', nullable: true })
  errorMessage!: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
