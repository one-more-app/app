import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { UserEntity } from './user.entity.js';

export enum OAuthProvider {
  GOOGLE = 'GOOGLE',
  APPLE = 'APPLE',
}

@Entity({ name: 'oauth_accounts' })
@Unique('oauth_accounts_provider_provideruserid_key', ['provider', 'providerUserId'])
@Index('oauth_accounts_userid_provider_idx', ['userId', 'provider'])
export class OAuthAccountEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  userId!: string;

  @ManyToOne(() => UserEntity, (user) => user.oauth, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: Relation<UserEntity>;

  @Column({ type: 'text' })
  provider!: OAuthProvider;

  @Column({ type: 'text' })
  providerUserId!: string;

  @Column({ type: 'text', nullable: true })
  email!: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}
