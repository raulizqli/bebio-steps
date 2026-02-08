import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { SleepLog } from './sleep.entity';
import { BabiesService } from '../babies/babies.service';
import { CreateSleepDto, UpdateSleepDto } from './dto/sleep.dto';

@Injectable()
export class SleepService {
  constructor(
    @InjectRepository(SleepLog)
    private sleepRepository: Repository<SleepLog>,
    private babiesService: BabiesService,
  ) {}

  async create(userId: string, dto: CreateSleepDto): Promise<SleepLog> {
    await this.babiesService.validateAccess(dto.babyId, userId);

    const sleepLog = this.sleepRepository.create({
      ...dto,
      loggedByUserId: userId,
    });

    // Calculate duration if both times are provided
    if (dto.startTime && dto.endTime) {
      const start = new Date(dto.startTime);
      const end = new Date(dto.endTime);
      sleepLog.durationMinutes = Math.round(
        (end.getTime() - start.getTime()) / (1000 * 60),
      );
    }

    return this.sleepRepository.save(sleepLog);
  }

  async findAllForBaby(
    babyId: string,
    userId: string,
    date?: string,
  ): Promise<SleepLog[]> {
    await this.babiesService.validateAccess(babyId, userId);

    const where: any = { babyId };

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      where.startTime = Between(startOfDay, endOfDay);
    }

    return this.sleepRepository.find({
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

    const sleepLogs = await this.sleepRepository.find({
      where: { babyId, startTime: Between(startOfDay, endOfDay) },
    });

    const totalMinutes = sleepLogs.reduce(
      (sum, s) => sum + (s.durationMinutes || 0),
      0,
    );
    const totalHours = Math.round((totalMinutes / 60) * 100) / 100;
    const napCount = sleepLogs.filter((s) => s.type === 'nap').length;
    const nightSleepCount = sleepLogs.filter((s) => s.type === 'night').length;

    return {
      date,
      totalSleepMinutes: totalMinutes,
      totalSleepHours: totalHours,
      napCount,
      nightSleepCount,
      totalEntries: sleepLogs.length,
      sleepLogs,
    };
  }

  async update(sleepId: string, userId: string, dto: UpdateSleepDto): Promise<SleepLog> {
    const sleepLog = await this.sleepRepository.findOne({
      where: { id: sleepId },
    });

    if (!sleepLog) {
      throw new NotFoundException('Sleep log not found');
    }

    await this.babiesService.validateAccess(sleepLog.babyId, userId);

    Object.assign(sleepLog, dto);

    // Recalculate duration if end time updated
    if (dto.endTime) {
      const start = new Date(sleepLog.startTime);
      const end = new Date(dto.endTime);
      sleepLog.durationMinutes = Math.round(
        (end.getTime() - start.getTime()) / (1000 * 60),
      );
    }

    return this.sleepRepository.save(sleepLog);
  }

  async delete(sleepId: string, userId: string): Promise<void> {
    const sleepLog = await this.sleepRepository.findOne({
      where: { id: sleepId },
    });

    if (!sleepLog) {
      throw new NotFoundException('Sleep log not found');
    }

    await this.babiesService.validateAccess(sleepLog.babyId, userId);
    await this.sleepRepository.remove(sleepLog);
  }
}
