import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Baby } from '../babies/baby.entity';
import { User } from '../users/user.entity';
import { MoodType } from '../../common/enums';

@Entity('mood_logs')
export class MoodLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  babyId: string;

  @Column({ type: 'uuid' })
  loggedByUserId: string;

  @Column({ type: 'enum', enum: MoodType })
  mood: MoodType;

  @Column({ type: 'int', nullable: true })
  intensityLevel: number;

  @Column({ type: 'timestamp' })
  observedAt: Date;

  @Column({ type: 'int', nullable: true })
  durationMinutes: number;

  @Column({ nullable: true })
  trigger: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Baby, (baby) => baby.moodLogs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'babyId' })
  baby: Baby;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'loggedByUserId' })
  loggedBy: User;
}
