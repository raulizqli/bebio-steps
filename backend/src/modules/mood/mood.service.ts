import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { MoodLog } from './mood.entity';
import { BabiesService } from '../babies/babies.service';
import { CreateMoodDto, UpdateMoodDto } from './dto/mood.dto';

@Injectable()
export class MoodService {
  constructor(
    @InjectRepository(MoodLog)
    private moodRepository: Repository<MoodLog>,
    private babiesService: BabiesService,
  ) {}

  async create(userId: string, dto: CreateMoodDto): Promise<MoodLog> {
    await this.babiesService.validateAccess(dto.babyId, userId);

    const moodLog = this.moodRepository.create({
      ...dto,
      loggedByUserId: userId,
    });

    return this.moodRepository.save(moodLog);
  }

  async findAllForBaby(babyId: string, userId: string, date?: string): Promise<MoodLog[]> {
    await this.babiesService.validateAccess(babyId, userId);

    const where: any = { babyId };

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      where.observedAt = Between(startOfDay, endOfDay);
    }

    return this.moodRepository.find({
      where,
      relations: ['loggedBy'],
      order: { observedAt: 'DESC' },
    });
  }

  async update(moodId: string, userId: string, dto: UpdateMoodDto): Promise<MoodLog> {
    const moodLog = await this.moodRepository.findOne({ where: { id: moodId } });

    if (!moodLog) {
      throw new NotFoundException('Mood log not found');
    }

    await this.babiesService.validateAccess(moodLog.babyId, userId);
    Object.assign(moodLog, dto);
    return this.moodRepository.save(moodLog);
  }

  async delete(moodId: string, userId: string): Promise<void> {
    const moodLog = await this.moodRepository.findOne({ where: { id: moodId } });

    if (!moodLog) {
      throw new NotFoundException('Mood log not found');
    }

    await this.babiesService.validateAccess(moodLog.babyId, userId);
    await this.moodRepository.remove(moodLog);
  }
}
