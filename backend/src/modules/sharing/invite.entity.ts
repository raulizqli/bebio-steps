import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Baby } from '../babies/baby.entity';
import { User } from '../users/user.entity';
import { UserRole, InviteStatus } from '../../common/enums';

@Entity('invites')
export class Invite {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 10 })
  code: string;

  @Column({ type: 'uuid' })
  babyId: string;

  @Column({ type: 'uuid' })
  invitedByUserId: string;

  @Column({ type: 'enum', enum: UserRole })
  role: UserRole;

  @Column({ type: 'simple-array', nullable: true })
  permissions: string[];

  @Column({ type: 'enum', enum: InviteStatus, default: InviteStatus.PENDING })
  status: InviteStatus;

  @Column({ type: 'timestamp', nullable: true })
  accessExpiresAt: Date;

  @Column({ type: 'timestamp' })
  codeExpiresAt: Date;

  @Column({ nullable: true })
  acceptedByUserId: string;

  @Column({ nullable: true })
  acceptedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Baby, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'babyId' })
  baby: Baby;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'invitedByUserId' })
  invitedBy: User;
}
