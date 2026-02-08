import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Baby } from './baby.entity';
import { UserRole } from '../../common/enums';

@Entity('baby_caregivers')
export class BabyCaregiver {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'uuid' })
  babyId: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.PARENT })
  role: UserRole;

  @Column({ type: 'simple-array', nullable: true })
  permissions: string[];

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt: Date;

  @Column({ nullable: true })
  invitedBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.caregiverProfiles, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Baby, (baby) => baby.caregivers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'babyId' })
  baby: Baby;
}
