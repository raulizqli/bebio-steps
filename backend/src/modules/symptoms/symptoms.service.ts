import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Symptom } from './symptom.entity';
import { BabiesService } from '../babies/babies.service';
import { CreateSymptomDto, UpdateSymptomDto } from './dto/symptom.dto';

@Injectable()
export class SymptomsService {
  constructor(
    @InjectRepository(Symptom)
    private symptomRepository: Repository<Symptom>,
    private babiesService: BabiesService,
  ) {}

  async create(userId: string, dto: CreateSymptomDto): Promise<Symptom> {
    await this.babiesService.validateAccess(dto.babyId, userId);

    const symptom = this.symptomRepository.create({
      ...dto,
      loggedByUserId: userId,
    });

    return this.symptomRepository.save(symptom);
  }

  async findAllForBaby(babyId: string, userId: string, activeOnly = false): Promise<Symptom[]> {
    await this.babiesService.validateAccess(babyId, userId);

    const where: any = { babyId };
    if (activeOnly) {
      where.resolvedAt = IsNull();
    }

    return this.symptomRepository.find({
      where,
      relations: ['loggedBy'],
      order: { observedAt: 'DESC' },
    });
  }

  async update(symptomId: string, userId: string, dto: UpdateSymptomDto): Promise<Symptom> {
    const symptom = await this.symptomRepository.findOne({ where: { id: symptomId } });

    if (!symptom) {
      throw new NotFoundException('Symptom not found');
    }

    await this.babiesService.validateAccess(symptom.babyId, userId);
    Object.assign(symptom, dto);
    return this.symptomRepository.save(symptom);
  }

  async delete(symptomId: string, userId: string): Promise<void> {
    const symptom = await this.symptomRepository.findOne({ where: { id: symptomId } });

    if (!symptom) {
      throw new NotFoundException('Symptom not found');
    }

    await this.babiesService.validateAccess(symptom.babyId, userId);
    await this.symptomRepository.remove(symptom);
  }
}
