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
import { SleepType } from '../../common/enums';

@Entity('sleep_logs')
export class SleepLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  babyId: string;

  @Column({ type: 'uuid' })
  loggedByUserId: string;

  @Column({ type: 'enum', enum: SleepType })
  type: SleepType;

  @Column({ type: 'timestamp' })
  startTime: Date;

  @Column({ type: 'timestamp', nullable: true })
  endTime: Date;

  @Column({ type: 'int', nullable: true })
  durationMinutes: number;

  @Column({ type: 'int', nullable: true })
  qualityRating: number;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Baby, (baby) => baby.sleepLogs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'babyId' })
  baby: Baby;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'loggedByUserId' })
  loggedBy: User;
}
