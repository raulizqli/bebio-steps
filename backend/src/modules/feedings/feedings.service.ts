import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Feeding } from './feeding.entity';
import { BabiesService } from '../babies/babies.service';
import { CreateFeedingDto, UpdateFeedingDto } from './dto/feeding.dto';

@Injectable()
export class FeedingsService {
  constructor(
    @InjectRepository(Feeding)
    private feedingRepository: Repository<Feeding>,
    private babiesService: BabiesService,
  ) {}

  async create(userId: string, dto: CreateFeedingDto): Promise<Feeding> {
    await this.babiesService.validateAccess(dto.babyId, userId);

    const feeding = this.feedingRepository.create({
      ...dto,
      loggedByUserId: userId,
    });

    return this.feedingRepository.save(feeding);
  }

  async findAllForBaby(
    babyId: string,
    userId: string,
    date?: string,
  ): Promise<Feeding[]> {
    await this.babiesService.validateAccess(babyId, userId);

    const where: any = { babyId };

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      where.startTime = Between(startOfDay, endOfDay);
    }

    return this.feedingRepository.find({
      where,
      relations: ['loggedBy'],
      order: { startTime: 'DESC' },
    });
  }

  async getDailySummary(babyId: string, userId: string, date: string) {
    await this.babiesService.validateAccess(babyId, userId);

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const feedings = await this.feedingRepository.find({
      where: { babyId, startTime: Between(startOfDay, endOfDay) },
    });

    const totalOz = feedings.reduce((sum, f) => sum + (Number(f.amountOz) || 0), 0);
    const totalMl = feedings.reduce((sum, f) => sum + (Number(f.amountMl) || 0), 0);
    const totalFeedings = feedings.length;
    const totalDurationMinutes = feedings.reduce(
      (sum, f) => sum + (f.durationMinutes || 0),
      0,
    );

    return {
      date,
      totalFeedings,
      totalOz: Math.round(totalOz * 100) / 100,
      totalMl: Math.round(totalMl * 100) / 100,
      totalDurationMinutes,
      feedings,
    };
  }

  async update(
    feedingId: string,
    userId: string,
    dto: UpdateFeedingDto,
  ): Promise<Feeding> {
    const feeding = await this.feedingRepository.findOne({
      where: { id: feedingId },
    });

    if (!feeding) {
      throw new NotFoundException('Feeding not found');
    }

    await this.babiesService.validateAccess(feeding.babyId, userId);

    Object.assign(feeding, dto);
    return this.feedingRepository.save(feeding);
  }

  async delete(feedingId: string, userId: string): Promise<void> {
    const feeding = await this.feedingRepository.findOne({
      where: { id: feedingId },
    });

    if (!feeding) {
      throw new NotFoundException('Feeding not found');
    }

    await this.babiesService.validateAccess(feeding.babyId, userId);
    await this.feedingRepository.remove(feeding);
  }
}
