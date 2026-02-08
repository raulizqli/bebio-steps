import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { BabyCaregiver } from '../babies/baby-caregiver.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  firstName: string;

  @Column({ length: 100 })
  lastName: string;

  @Column({ unique: true, length: 255 })
  email: string;

  @Column({ select: false })
  password: string;

  @Column({ nullable: true, length: 20 })
  phone: string;

  @Column({ nullable: true })
  avatarUrl: string;

  @Column({ nullable: true })
  fcmToken: string;

  @Column({ nullable: true })
  alexaUserId: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  emailVerified: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => BabyCaregiver, (caregiver) => caregiver.user)
  caregiverProfiles: BabyCaregiver[];
}
