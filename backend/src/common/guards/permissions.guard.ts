import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BabyCaregiver } from '../../modules/babies/baby-caregiver.entity';
import { Permission, UserRole } from '../enums';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @InjectRepository(BabyCaregiver)
    private caregiverRepository: Repository<BabyCaregiver>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>('permissions', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const babyId = request.params.babyId || request.body?.babyId;

    if (!babyId) {
      return true;
    }

    const caregiver = await this.caregiverRepository.findOne({
      where: { userId: user.id, babyId, isActive: true },
    });

    if (!caregiver) {
      throw new ForbiddenException('You do not have access to this baby\'s data');
    }

    // Check if access has expired (for nannies with time-limited access)
    if (caregiver.expiresAt && new Date() > new Date(caregiver.expiresAt)) {
      caregiver.isActive = false;
      await this.caregiverRepository.save(caregiver);
      throw new ForbiddenException('Your access has expired');
    }

    // Parents have all permissions
    if (caregiver.role === UserRole.PARENT) {
      return true;
    }

    // Check specific permissions
    const userPermissions = caregiver.permissions || [];
    const hasPermission = requiredPermissions.some(
      (perm) =>
        userPermissions.includes(perm) ||
        userPermissions.includes(Permission.VIEW_ALL) ||
        userPermissions.includes(Permission.LOG_ALL),
    );

    if (!hasPermission) {
      throw new ForbiddenException('Insufficient permissions for this action');
    }

    return true;
  }
}
