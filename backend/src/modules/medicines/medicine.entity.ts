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

@Entity('medicines')
export class Medicine {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  babyId: string;

  @Column({ type: 'uuid' })
  loggedByUserId: string;

  @Column({ length: 200 })
  name: string;

  @Column({ nullable: true })
  dosage: string;

  @Column({ nullable: true })
  unit: string;

  @Column({ nullable: true })
  frequency: string;

  @Column({ type: 'timestamp' })
  administeredAt: Date;

  @Column({ type: 'date', nullable: true })
  prescribedDate: Date;

  @Column({ type: 'date', nullable: true })
  endDate: Date;

  @Column({ nullable: true })
  prescribedBy: string;

  @Column({ nullable: true })
  reason: string;

  @Column({ type: 'boolean', default: false })
  isRecurring: boolean;

  @Column({ nullable: true })
  recurringSchedule: string;

  @Column({ type: 'text', nullable: true })
  sideEffects: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Baby, (baby) => baby.medicines, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'babyId' })
  baby: Baby;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'loggedByUserId' })
  loggedBy: User;
}
