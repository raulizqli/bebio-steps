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
import { SymptomSeverity } from '../../common/enums';

@Entity('symptoms')
export class Symptom {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  babyId: string;

  @Column({ type: 'uuid' })
  loggedByUserId: string;

  @Column({ length: 200 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'enum', enum: SymptomSeverity, default: SymptomSeverity.MILD })
  severity: SymptomSeverity;

  @Column({ type: 'timestamp' })
  observedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  resolvedAt: Date;

  @Column({ type: 'decimal', precision: 4, scale: 1, nullable: true })
  temperatureCelsius: number;

  @Column({ nullable: true })
  relatedIllness: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Baby, (baby) => baby.symptoms, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'babyId' })
  baby: Baby;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'loggedByUserId' })
  loggedBy: User;
}
