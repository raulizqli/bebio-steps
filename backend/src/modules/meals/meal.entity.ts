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
import { MealType } from '../../common/enums';

@Entity('meals')
export class Meal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  babyId: string;

  @Column({ type: 'uuid' })
  loggedByUserId: string;

  @Column({ type: 'enum', enum: MealType })
  type: MealType;

  @Column({ type: 'timestamp' })
  time: Date;

  @Column({ type: 'simple-array', nullable: true })
  foods: string[];

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  amountOz: number;

  @Column({ nullable: true })
  texture: string;

  @Column({ type: 'boolean', default: false })
  isAllergenTest: boolean;

  @Column({ nullable: true })
  allergenTested: string;

  @Column({ nullable: true })
  reaction: string;

  @Column({ type: 'int', nullable: true })
  rating: number;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Baby, (baby) => baby.meals, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'babyId' })
  baby: Baby;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'loggedByUserId' })
  loggedBy: User;
}
