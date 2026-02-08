import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Meal } from './meal.entity';
import { BabiesService } from '../babies/babies.service';
import { CreateMealDto, UpdateMealDto } from './dto/meal.dto';

@Injectable()
export class MealsService {
  constructor(
    @InjectRepository(Meal)
    private mealRepository: Repository<Meal>,
    private babiesService: BabiesService,
  ) {}

  async create(userId: string, dto: CreateMealDto): Promise<Meal> {
    await this.babiesService.validateAccess(dto.babyId, userId);

    const meal = this.mealRepository.create({
      ...dto,
      loggedByUserId: userId,
    });

    return this.mealRepository.save(meal);
  }

  async findAllForBaby(babyId: string, userId: string, date?: string): Promise<Meal[]> {
    await this.babiesService.validateAccess(babyId, userId);

    const where: any = { babyId };

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      where.time = Between(startOfDay, endOfDay);
    }

    return this.mealRepository.find({
      where,
      relations: ['loggedBy'],
      order: { time: 'DESC' },
    });
  }

  async update(mealId: string, userId: string, dto: UpdateMealDto): Promise<Meal> {
    const meal = await this.mealRepository.findOne({ where: { id: mealId } });

    if (!meal) {
      throw new NotFoundException('Meal not found');
    }

    await this.babiesService.validateAccess(meal.babyId, userId);
    Object.assign(meal, dto);
    return this.mealRepository.save(meal);
  }

  async delete(mealId: string, userId: string): Promise<void> {
    const meal = await this.mealRepository.findOne({ where: { id: mealId } });

    if (!meal) {
      throw new NotFoundException('Meal not found');
    }

    await this.babiesService.validateAccess(meal.babyId, userId);
    await this.mealRepository.remove(meal);
  }
}
