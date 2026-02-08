import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { BabyCaregiver } from './baby-caregiver.entity';
import { Feeding } from '../feedings/feeding.entity';
import { SleepLog } from '../sleep/sleep.entity';
import { Meal } from '../meals/meal.entity';
import { Symptom } from '../symptoms/symptom.entity';
import { Medicine } from '../medicines/medicine.entity';
import { MoodLog } from '../mood/mood.entity';
import { BabyGoal } from './baby-goal.entity';

@Entity('babies')
export class Baby {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  firstName: string;

  @Column({ length: 100, nullable: true })
  lastName: string;

  @Column({ type: 'date' })
  dateOfBirth: Date;

  @Column({ nullable: true, length: 10 })
  gender: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  birthWeightKg: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  birthHeightCm: number;

  @Column({ nullable: true })
  avatarUrl: string;

  @Column({ nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => BabyCaregiver, (caregiver) => caregiver.baby)
  caregivers: BabyCaregiver[];

  @OneToMany(() => Feeding, (feeding) => feeding.baby)
  feedings: Feeding[];

  @OneToMany(() => SleepLog, (sleep) => sleep.baby)
  sleepLogs: SleepLog[];

  @OneToMany(() => Meal, (meal) => meal.baby)
  meals: Meal[];

  @OneToMany(() => Symptom, (symptom) => symptom.baby)
  symptoms: Symptom[];

  @OneToMany(() => Medicine, (medicine) => medicine.baby)
  medicines: Medicine[];

  @OneToMany(() => MoodLog, (mood) => mood.baby)
  moodLogs: MoodLog[];

  @OneToMany(() => BabyGoal, (goal) => goal.baby)
  goals: BabyGoal[];
}
