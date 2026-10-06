import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export type MessageTemplateCategory = 'marketing' | 'transactional';
export type MessageTemplateChannel = 'email' | 'push' | 'both';

export type MessageTemplateContent = {
  email?: {
    subject: string;
    preheader: string;
    eyebrow: string;
    title: string;
    bodyHtml: string;
    bodyText: string;
    cta?: { label: string; href: string };
    secondaryText?: string;
  };
  push?: {
    title: string;
    body: string;
    route: string;
  };
};

@Entity({ name: 'message_templates' })
export class MessageTemplateEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'text', unique: true })
  key!: string;

  @Column({ type: 'text' })
  category!: MessageTemplateCategory;

  @Column({ type: 'text' })
  channel!: MessageTemplateChannel;

  @Column({ type: 'jsonb' })
  content!: MessageTemplateContent;

  @Column({ type: 'text', array: true, default: () => "'{}'" })
  variables!: string[];

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ type: 'integer', default: 1 })
  version!: number;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
