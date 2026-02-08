import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Baby } from './baby.entity';

@Entity('baby_goals')
export class BabyGoal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  babyId: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  dailySleepHoursGoal: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  dailyFeedingOzGoal: number;

  @Column({ type: 'int', nullable: true })
  dailyMealsGoal: number;

  @Column({ type: 'int', nullable: true })
  minNapsPerDay: number;

  @Column({ default: true })
  notifySleepGoal: boolean;

  @Column({ default: true })
  notifyFeedingGoal: boolean;

  @Column({ default: false })
  notifyMealGoal: boolean;

  @Column({ type: 'time', nullable: true })
  goalCheckTime: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Baby, (baby) => baby.goals, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'babyId' })
  baby: Baby;
}
