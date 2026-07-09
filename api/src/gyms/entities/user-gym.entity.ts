import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { UserEntity } from '../../auth/entities/user.entity.js';

@Entity({ name: 'user_gyms' })
export class UserGymEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', unique: true })
  userId!: string;

  @OneToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: Relation<UserEntity>;

  @Column({ type: 'text' })
  placeId!: string;

  @Column({ type: 'varchar', length: 200 })
  name!: string;

  @Column({ type: 'varchar', length: 300, nullable: true })
  address!: string | null;

  @Column({ type: 'double precision' })
  lat!: number;

  @Column({ type: 'double precision' })
  lng!: number;

  @Column({ type: 'int', default: 120 })
  radiusM!: number;

  @Column({ type: 'boolean', default: false })
  onboardingGymPending!: boolean;

  @Column({ type: 'boolean', default: true })
  geofenceEnabled!: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
