import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Invite } from './invite.entity';
import { BabyCaregiver } from '../babies/baby-caregiver.entity';
import { BabiesService } from '../babies/babies.service';
import { CreateInviteDto, AcceptInviteDto, UpdatePermissionsDto } from './dto/sharing.dto';
import { InviteStatus, UserRole, Permission } from '../../common/enums';
import { customAlphabet } from 'nanoid';

const generateCode = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 8);

@Injectable()
export class SharingService {
  constructor(
    @InjectRepository(Invite)
    private inviteRepository: Repository<Invite>,
    @InjectRepository(BabyCaregiver)
    private caregiverRepository: Repository<BabyCaregiver>,
    private babiesService: BabiesService,
  ) {}

  async createInvite(userId: string, dto: CreateInviteDto) {
    // Validate the user is a parent of this baby
    await this.babiesService.validateAccess(dto.babyId, userId, true);

    if (dto.role === UserRole.PARENT) {
      // Parents get all permissions
      dto.permissions = Object.values(Permission);
    }

    const codeExpiresInHours = dto.codeExpiresInHours || 48;
    const codeExpiresAt = new Date();
    codeExpiresAt.setHours(codeExpiresAt.getHours() + codeExpiresInHours);

    const invite = this.inviteRepository.create({
      code: generateCode(),
      babyId: dto.babyId,
      invitedByUserId: userId,
      role: dto.role,
      permissions: dto.permissions || [Permission.VIEW_ALL],
      status: InviteStatus.PENDING,
      accessExpiresAt: dto.accessExpiresAt ? new Date(dto.accessExpiresAt) : undefined,
      codeExpiresAt,
    });

    const savedInvite = await this.inviteRepository.save(invite as Invite);

    return {
      code: savedInvite.code,
      role: savedInvite.role,
      permissions: savedInvite.permissions,
      codeExpiresAt: savedInvite.codeExpiresAt,
      accessExpiresAt: savedInvite.accessExpiresAt,
    };
  }

  async acceptInvite(userId: string, dto: AcceptInviteDto) {
    const invite = await this.inviteRepository.findOne({
      where: { code: dto.code.toUpperCase(), status: InviteStatus.PENDING },
      relations: ['baby'],
    });

    if (!invite) {
      throw new NotFoundException('Invalid or expired invite code');
    }

    if (new Date() > invite.codeExpiresAt) {
      invite.status = InviteStatus.EXPIRED;
      await this.inviteRepository.save(invite);
      throw new BadRequestException('This invite code has expired');
    }

    // Check if already a caregiver
    const existingCaregiver = await this.caregiverRepository.findOne({
      where: { userId, babyId: invite.babyId, isActive: true },
    });

    if (existingCaregiver) {
      throw new ConflictException('You already have access to this baby');
    }

    // Create caregiver relationship
    const caregiver = this.caregiverRepository.create({
      userId,
      babyId: invite.babyId,
      role: invite.role,
      permissions: invite.permissions,
      isActive: true,
      expiresAt: invite.accessExpiresAt,
      invitedBy: invite.invitedByUserId,
    });

    await this.caregiverRepository.save(caregiver);

    // Update invite status
    invite.status = InviteStatus.ACCEPTED;
    invite.acceptedByUserId = userId;
    invite.acceptedAt = new Date();
    await this.inviteRepository.save(invite);

    return {
      message: 'Invite accepted successfully',
      baby: invite.baby,
      role: invite.role,
      permissions: invite.permissions,
      expiresAt: invite.accessExpiresAt,
    };
  }

  async revokeInvite(inviteId: string, userId: string) {
    const invite = await this.inviteRepository.findOne({
      where: { id: inviteId },
    });

    if (!invite) {
      throw new NotFoundException('Invite not found');
    }

    await this.babiesService.validateAccess(invite.babyId, userId, true);

    invite.status = InviteStatus.REVOKED;
    await this.inviteRepository.save(invite);

    // If the invite was already accepted, also deactivate the caregiver
    if (invite.acceptedByUserId) {
      const caregiver = await this.caregiverRepository.findOne({
        where: { userId: invite.acceptedByUserId, babyId: invite.babyId },
      });

      if (caregiver) {
        caregiver.isActive = false;
        await this.caregiverRepository.save(caregiver);
      }
    }

    return { message: 'Invite revoked successfully' };
  }

  async getInvites(babyId: string, userId: string) {
    await this.babiesService.validateAccess(babyId, userId, true);

    return this.inviteRepository.find({
      where: { babyId },
      order: { createdAt: 'DESC' },
    });
  }

  async updateCaregiverPermissions(
    babyId: string,
    targetUserId: string,
    userId: string,
    dto: UpdatePermissionsDto,
  ) {
    await this.babiesService.validateAccess(babyId, userId, true);

    const caregiver = await this.caregiverRepository.findOne({
      where: { userId: targetUserId, babyId, isActive: true },
    });

    if (!caregiver) {
      throw new NotFoundException('Caregiver not found');
    }

    if (caregiver.role === UserRole.PARENT) {
      throw new ForbiddenException('Cannot modify parent permissions');
    }

    caregiver.permissions = dto.permissions;
    if (dto.expiresAt) {
      caregiver.expiresAt = new Date(dto.expiresAt);
    }

    return this.caregiverRepository.save(caregiver);
  }
}
