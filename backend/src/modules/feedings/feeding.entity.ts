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
import { FeedingType, BreastSide } from '../../common/enums';

@Entity('feedings')
export class Feeding {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  babyId: string;

  @Column({ type: 'uuid' })
  loggedByUserId: string;

  @Column({ type: 'enum', enum: FeedingType })
  type: FeedingType;

  @Column({ type: 'timestamp' })
  startTime: Date;

  @Column({ type: 'timestamp', nullable: true })
  endTime: Date;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  amountOz: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  amountMl: number;

  @Column({ type: 'enum', enum: BreastSide, nullable: true })
  breastSide: BreastSide;

  @Column({ type: 'int', nullable: true })
  durationMinutes: number;

  @Column({ nullable: true })
  formulaBrand: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Baby, (baby) => baby.feedings, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'babyId' })
  baby: Baby;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'loggedByUserId' })
  loggedBy: User;
}
