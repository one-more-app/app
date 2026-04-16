import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'exercise_catalog' })
@Index('IDX_exercise_catalog_name', ['name'])
@Index('IDX_exercise_catalog_target', ['target'])
@Index('IDX_exercise_catalog_equipment', ['equipment'])
export class ExerciseCatalogEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'text', unique: true })
  exerciseId!: string;

  @Column({ type: 'text' })
  name!: string;

  @Column({ type: 'text', nullable: true })
  nameFr!: string | null;

  @Column({ type: 'text' })
  bodyPart!: string;

  @Column({ type: 'text' })
  target!: string;

  @Column({ type: 'text' })
  equipment!: string;

  @Column({ type: 'jsonb', default: () => "'[]'::jsonb" })
  secondaryMuscles!: string[];

  @Column({ type: 'jsonb', default: () => "'[]'::jsonb" })
  instructions!: string[];

  @Column({ type: 'text', nullable: true })
  gifUrl!: string | null;
}
