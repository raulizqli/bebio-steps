import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Medicine } from './medicine.entity';
import { BabiesService } from '../babies/babies.service';
import { CreateMedicineDto, UpdateMedicineDto } from './dto/medicine.dto';

@Injectable()
export class MedicinesService {
  constructor(
    @InjectRepository(Medicine)
    private medicineRepository: Repository<Medicine>,
    private babiesService: BabiesService,
  ) {}

  async create(userId: string, dto: CreateMedicineDto): Promise<Medicine> {
    await this.babiesService.validateAccess(dto.babyId, userId);

    const medicine = this.medicineRepository.create({
      ...dto,
      loggedByUserId: userId,
    });

    return this.medicineRepository.save(medicine);
  }

  async findAllForBaby(babyId: string, userId: string): Promise<Medicine[]> {
    await this.babiesService.validateAccess(babyId, userId);

    return this.medicineRepository.find({
      where: { babyId },
      relations: ['loggedBy'],
      order: { administeredAt: 'DESC' },
    });
  }

  async getActiveMedicines(babyId: string, userId: string): Promise<Medicine[]> {
    await this.babiesService.validateAccess(babyId, userId);

    const today = new Date().toISOString().split('T')[0];

    const medicines = await this.medicineRepository
      .createQueryBuilder('medicine')
      .where('medicine.babyId = :babyId', { babyId })
      .andWhere('(medicine.endDate IS NULL OR medicine.endDate >= :today)', { today })
      .orderBy('medicine.administeredAt', 'DESC')
      .getMany();

    return medicines;
  }

  async update(medicineId: string, userId: string, dto: UpdateMedicineDto): Promise<Medicine> {
    const medicine = await this.medicineRepository.findOne({ where: { id: medicineId } });

    if (!medicine) {
      throw new NotFoundException('Medicine not found');
    }

    await this.babiesService.validateAccess(medicine.babyId, userId);
    Object.assign(medicine, dto);
    return this.medicineRepository.save(medicine);
  }

  async delete(medicineId: string, userId: string): Promise<void> {
    const medicine = await this.medicineRepository.findOne({ where: { id: medicineId } });

    if (!medicine) {
      throw new NotFoundException('Medicine not found');
    }

    await this.babiesService.validateAccess(medicine.babyId, userId);
    await this.medicineRepository.remove(medicine);
  }
}
