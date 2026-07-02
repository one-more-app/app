import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { PerformanceEntryEntity } from '../../performance/performance-entry.entity.js';
import { UserProfileEntity } from '../../profile/user-profile.entity.js';
import { TrackedExerciseEntity } from '../../tracked-exercises/tracked-exercise.entity.js';
import { OAuthAccountEntity } from './oauth-account.entity.js';
import { SessionEntity } from './session.entity.js';

@Entity({ name: 'users' })
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'text', nullable: true, unique: true })
  email!: string | null;

  @Column({ type: 'text', nullable: true })
  password!: string | null;

  @Column({ type: 'boolean', default: false })
  isPremium!: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;

  @OneToOne(() => UserProfileEntity, (profile) => profile.user)
  profile?: Relation<UserProfileEntity> | null;

  @OneToMany(() => SessionEntity, (session) => session.user)
  sessions!: Relation<SessionEntity[]>;

  @OneToMany(() => OAuthAccountEntity, (oauth) => oauth.user)
  oauth!: Relation<OAuthAccountEntity[]>;

  @OneToMany(() => TrackedExerciseEntity, (tracked) => tracked.user)
  trackedExercises!: Relation<TrackedExerciseEntity[]>;

  @OneToMany(() => PerformanceEntryEntity, (entry) => entry.user)
  performanceEntries!: Relation<PerformanceEntryEntity[]>;
}
