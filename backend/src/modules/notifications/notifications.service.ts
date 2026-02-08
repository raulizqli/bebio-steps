import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Notification } from './notification.entity';
import { BabyGoal } from '../babies/baby-goal.entity';
import { BabyCaregiver } from '../babies/baby-caregiver.entity';
import { Feeding } from '../feedings/feeding.entity';
import { SleepLog } from '../sleep/sleep.entity';
import { User } from '../users/user.entity';
import { NotificationType, UserRole } from '../../common/enums';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    @InjectRepository(BabyGoal)
    private goalRepository: Repository<BabyGoal>,
    @InjectRepository(BabyCaregiver)
    private caregiverRepository: Repository<BabyCaregiver>,
    @InjectRepository(Feeding)
    private feedingRepository: Repository<Feeding>,
    @InjectRepository(SleepLog)
    private sleepRepository: Repository<SleepLog>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async getUserNotifications(userId: string, limit = 50) {
    return this.notificationRepository.find({
      where: { userId },
      relations: ['baby'],
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async markAsRead(notificationId: string, userId: string) {
    const notification = await this.notificationRepository.findOne({
      where: { id: notificationId, userId },
    });

    if (notification) {
      notification.isRead = true;
      await this.notificationRepository.save(notification);
    }

    return { message: 'Notification marked as read' };
  }

  async markAllAsRead(userId: string) {
    await this.notificationRepository
      .createQueryBuilder()
      .update(Notification)
      .set({ isRead: true })
      .where('userId = :userId AND isRead = false', { userId })
      .execute();

    return { message: 'All notifications marked as read' };
  }

  async getUnreadCount(userId: string) {
    const count = await this.notificationRepository.count({
      where: { userId, isRead: false },
    });
    return { unreadCount: count };
  }

  // Check goals every hour
  @Cron(CronExpression.EVERY_HOUR)
  async checkGoals() {
    this.logger.log('Checking daily goals for all babies...');

    try {
      const goals = await this.goalRepository.find({
        relations: ['baby'],
      });

      const now = new Date();
      const currentHour = now.getHours();

      for (const goal of goals) {
        // Parse goalCheckTime (format: "HH:mm")
        const checkHour = goal.goalCheckTime
          ? parseInt(goal.goalCheckTime.split(':')[0], 10)
          : 20;

        // Only check at the configured hour
        if (currentHour !== checkHour) continue;

        const today = now.toISOString().split('T')[0];
        const startOfDay = new Date(today);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(today);
        endOfDay.setHours(23, 59, 59, 999);

        // Check feeding goal
        if (goal.notifyFeedingGoal && goal.dailyFeedingOzGoal) {
          await this.checkFeedingGoal(goal, startOfDay, endOfDay);
        }

        // Check sleep goal
        if (goal.notifySleepGoal && goal.dailySleepHoursGoal) {
          await this.checkSleepGoal(goal, startOfDay, endOfDay);
        }
      }
    } catch (error) {
      this.logger.error('Error checking goals', error);
    }
  }

  private async checkFeedingGoal(goal: BabyGoal, startOfDay: Date, endOfDay: Date) {
    const feedings = await this.feedingRepository.find({
      where: { babyId: goal.babyId, startTime: Between(startOfDay, endOfDay) },
    });

    const totalOz = feedings.reduce((sum, f) => sum + (Number(f.amountOz) || 0), 0);

    if (totalOz < Number(goal.dailyFeedingOzGoal)) {
      const remaining = Number(goal.dailyFeedingOzGoal) - totalOz;
      await this.notifyParents(
        goal.babyId,
        NotificationType.FEEDING_GOAL,
        'Meta de alimentación pendiente',
        `${goal.baby?.firstName || 'Tu bebé'} ha tomado ${totalOz.toFixed(1)} oz hoy. Faltan ${remaining.toFixed(1)} oz para alcanzar la meta de ${goal.dailyFeedingOzGoal} oz.`,
        { totalOz, goalOz: goal.dailyFeedingOzGoal, remaining },
      );
    }
  }

  private async checkSleepGoal(goal: BabyGoal, startOfDay: Date, endOfDay: Date) {
    const sleepLogs = await this.sleepRepository.find({
      where: { babyId: goal.babyId, startTime: Between(startOfDay, endOfDay) },
    });

    const totalMinutes = sleepLogs.reduce(
      (sum, s) => sum + (s.durationMinutes || 0),
      0,
    );
    const totalHours = totalMinutes / 60;

    if (totalHours < Number(goal.dailySleepHoursGoal)) {
      const remaining = Number(goal.dailySleepHoursGoal) - totalHours;
      await this.notifyParents(
        goal.babyId,
        NotificationType.SLEEP_GOAL,
        'Meta de sueño pendiente',
        `${goal.baby?.firstName || 'Tu bebé'} ha dormido ${totalHours.toFixed(1)} horas hoy. Faltan ${remaining.toFixed(1)} horas para alcanzar la meta de ${goal.dailySleepHoursGoal} horas.`,
        { totalHours, goalHours: goal.dailySleepHoursGoal, remaining },
      );
    }
  }

  private async notifyParents(
    babyId: string,
    type: NotificationType,
    title: string,
    message: string,
    data: Record<string, any>,
  ) {
    // Get all parent caregivers
    const caregivers = await this.caregiverRepository.find({
      where: { babyId, role: UserRole.PARENT, isActive: true },
    });

    for (const caregiver of caregivers) {
      // Check if we already sent this type of notification today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const existing = await this.notificationRepository.findOne({
        where: {
          userId: caregiver.userId,
          babyId,
          type,
          createdAt: Between(today, new Date()),
        },
      });

      if (existing) continue;

      const notification = this.notificationRepository.create({
        userId: caregiver.userId,
        babyId,
        type,
        title,
        message,
        data,
      });

      await this.notificationRepository.save(notification);

      // Send push notification if user has FCM token
      await this.sendPushNotification(caregiver.userId, title, message);
    }
  }

  private async sendPushNotification(userId: string, title: string, body: string) {
    try {
      const user = await this.userRepository.findOne({ where: { id: userId } });

      if (!user?.fcmToken) return;

      // Firebase push notification would be sent here
      // In production, use firebase-admin SDK:
      // await admin.messaging().send({
      //   token: user.fcmToken,
      //   notification: { title, body },
      // });

      this.logger.log(`Push notification sent to user ${userId}: ${title}`);
    } catch (error) {
      this.logger.error(`Failed to send push notification to ${userId}`, error);
    }
  }
}
