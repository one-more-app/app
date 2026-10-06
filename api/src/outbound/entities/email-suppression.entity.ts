import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

export type EmailSuppressionReason =
  | 'bounce_hard'
  | 'complaint'
  | 'unsubscribe'
  | 'manual';

@Entity({ name: 'email_suppressions' })
export class EmailSuppressionEntity {
  @PrimaryColumn({ type: 'text' })
  email!: string;

  @Column({ type: 'text' })
  reason!: EmailSuppressionReason;

  @Column({ type: 'jsonb', nullable: true })
  meta!: Record<string, unknown> | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}
