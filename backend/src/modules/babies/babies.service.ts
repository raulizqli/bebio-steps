import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Baby } from './baby.entity';
import { BabyCaregiver } from './baby-caregiver.entity';
import { BabyGoal } from './baby-goal.entity';
import { CreateBabyDto, UpdateBabyDto, SetGoalsDto } from './dto/baby.dto';
import { UserRole, Permission } from '../../common/enums';

@Injectable()
export class BabiesService {
  constructor(
    @InjectRepository(Baby)
    private babyRepository: Repository<Baby>,
    @InjectRepository(BabyCaregiver)
    private caregiverRepository: Repository<BabyCaregiver>,
    @InjectRepository(BabyGoal)
    private goalRepository: Repository<BabyGoal>,
  ) {}

  async create(userId: string, dto: CreateBabyDto): Promise<Baby> {
    const baby = this.babyRepository.create(dto);
    const savedBaby = await this.babyRepository.save(baby);

    // Automatically add the creator as a parent
    const caregiver = this.caregiverRepository.create({
      userId,
      babyId: savedBaby.id,
      role: UserRole.PARENT,
      permissions: Object.values(Permission),
      isActive: true,
    });
    await this.caregiverRepository.save(caregiver);

    // Create default goals
    const goal = this.goalRepository.create({
      babyId: savedBaby.id,
      dailySleepHoursGoal: 14,
      dailyFeedingOzGoal: 24,
      goalCheckTime: '20:00',
    });
    await this.goalRepository.save(goal);

    return savedBaby;
  }

  async findAllForUser(userId: string): Promise<Baby[]> {
    const caregiverProfiles = await this.caregiverRepository.find({
      where: { userId, isActive: true },
      relations: ['baby'],
    });

    // Filter out expired access
    const activeBabies = caregiverProfiles
      .filter((cp) => {
        if (cp.expiresAt && new Date() > new Date(cp.expiresAt)) {
          return false;
        }
        return true;
      })
      .map((cp) => cp.baby);

    return activeBabies;
  }

  async findOne(babyId: string, userId: string): Promise<Baby> {
    await this.validateAccess(babyId, userId);

    const baby = await this.babyRepository.findOne({
      where: { id: babyId },
      relations: ['caregivers', 'caregivers.user', 'goals'],
    });

    if (!baby) {
      throw new NotFoundException('Baby not found');
    }

    return baby;
  }

  async update(babyId: string, userId: string, dto: UpdateBabyDto): Promise<Baby> {
    await this.validateAccess(babyId, userId, true);

    const baby = await this.babyRepository.findOne({ where: { id: babyId } });
    if (!baby) {
      throw new NotFoundException('Baby not found');
    }

    Object.assign(baby, dto);
    return this.babyRepository.save(baby);
  }

  async setGoals(babyId: string, userId: string, dto: SetGoalsDto): Promise<BabyGoal> {
    await this.validateAccess(babyId, userId, true);

    let goal = await this.goalRepository.findOne({ where: { babyId } });

    if (!goal) {
      goal = this.goalRepository.create({ babyId, ...dto });
    } else {
      Object.assign(goal, dto);
    }

    return this.goalRepository.save(goal);
  }

  async getGoals(babyId: string, userId: string): Promise<BabyGoal> {
    await this.validateAccess(babyId, userId);

    const goal = await this.goalRepository.findOne({ where: { babyId } });
    if (!goal) {
      throw new NotFoundException('Goals not configured for this baby');
    }

    return goal;
  }

  async getCaregivers(babyId: string, userId: string) {
    await this.validateAccess(babyId, userId, true);

    return this.caregiverRepository.find({
      where: { babyId },
      relations: ['user'],
    });
  }

  async removeCaregiver(babyId: string, caregiverId: string, userId: string) {
    await this.validateAccess(babyId, userId, true);

    const caregiver = await this.caregiverRepository.findOne({
      where: { id: caregiverId, babyId },
    });

    if (!caregiver) {
      throw new NotFoundException('Caregiver not found');
    }

    if (caregiver.role === UserRole.PARENT && caregiver.userId === userId) {
      throw new ForbiddenException('Cannot remove yourself as a parent');
    }

    caregiver.isActive = false;
    return this.caregiverRepository.save(caregiver);
  }

  async revokeAccess(babyId: string, targetUserId: string, userId: string) {
    await this.validateAccess(babyId, userId, true);

    const caregiver = await this.caregiverRepository.findOne({
      where: { userId: targetUserId, babyId, isActive: true },
    });

    if (!caregiver) {
      throw new NotFoundException('Caregiver not found');
    }

    if (caregiver.role === UserRole.PARENT) {
      throw new ForbiddenException('Cannot revoke parent access');
    }

    caregiver.isActive = false;
    await this.caregiverRepository.save(caregiver);

    return { message: 'Access revoked successfully' };
  }

  async validateAccess(babyId: string, userId: string, requireParent = false): Promise<BabyCaregiver> {
    const caregiver = await this.caregiverRepository.findOne({
      where: { userId, babyId, isActive: true },
    });

    if (!caregiver) {
      throw new ForbiddenException('You do not have access to this baby');
    }

    if (caregiver.expiresAt && new Date() > new Date(caregiver.expiresAt)) {
      caregiver.isActive = false;
      await this.caregiverRepository.save(caregiver);
      throw new ForbiddenException('Your access has expired');
    }

    if (requireParent && caregiver.role !== UserRole.PARENT) {
      throw new ForbiddenException('Only parents can perform this action');
    }

    return caregiver;
  }
}
