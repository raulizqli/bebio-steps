import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { User } from '../users/user.entity';
import { BabyCaregiver } from '../babies/baby-caregiver.entity';
import { Feeding } from '../feedings/feeding.entity';
import { SleepLog } from '../sleep/sleep.entity';
import { Baby } from '../babies/baby.entity';
import { FeedingType } from '../../common/enums';

@Injectable()
export class AlexaService {
  private readonly logger = new Logger(AlexaService.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(BabyCaregiver)
    private caregiverRepository: Repository<BabyCaregiver>,
    @InjectRepository(Baby)
    private babyRepository: Repository<Baby>,
    @InjectRepository(Feeding)
    private feedingRepository: Repository<Feeding>,
    @InjectRepository(SleepLog)
    private sleepRepository: Repository<SleepLog>,
  ) {}

  async handleRequest(body: any) {
    const requestType = body?.request?.type;
    const alexaUserId = body?.session?.user?.userId;

    switch (requestType) {
      case 'LaunchRequest':
        return this.buildResponse(
          'Bienvenido a BebIO Steps. Puedes preguntarme cuánto ha comido o dormido tu bebé hoy, o registrar una nueva toma. ¿Qué te gustaría hacer?',
          false,
        );

      case 'IntentRequest':
        return this.handleIntent(body.request.intent, alexaUserId);

      case 'SessionEndedRequest':
        return this.buildResponse('¡Hasta luego!', true);

      default:
        return this.buildResponse(
          'No entendí tu solicitud. Intenta preguntar sobre las tomas o el sueño de tu bebé.',
          false,
        );
    }
  }

  private async handleIntent(intent: any, alexaUserId: string) {
    const intentName = intent?.name;

    switch (intentName) {
      case 'GetFeedingSummaryIntent':
        return this.getFeedingSummary(alexaUserId);

      case 'GetSleepSummaryIntent':
        return this.getSleepSummary(alexaUserId);

      case 'LogFeedingIntent':
        return this.logFeeding(alexaUserId, intent.slots);

      case 'LogSleepIntent':
        return this.logSleep(alexaUserId, intent.slots);

      case 'GetBabyStatusIntent':
        return this.getBabyStatus(alexaUserId);

      case 'AMAZON.HelpIntent':
        return this.buildResponse(
          'Puedes decir: cuánto ha comido mi bebé hoy, cuánto ha dormido, registrar una toma de 4 onzas, o cómo está mi bebé. ¿Qué te gustaría saber?',
          false,
        );

      case 'AMAZON.StopIntent':
      case 'AMAZON.CancelIntent':
        return this.buildResponse('¡Hasta luego! Cuida mucho a tu bebé.', true);

      default:
        return this.buildResponse(
          'No reconozco esa acción. Intenta preguntar cuánto ha comido o dormido tu bebé.',
          false,
        );
    }
  }

  private async getUserAndBaby(alexaUserId: string): Promise<{ user: User; baby: Baby } | null> {
    const user = await this.userRepository.findOne({
      where: { alexaUserId },
    });

    if (!user) return null;

    const caregiver = await this.caregiverRepository.findOne({
      where: { userId: user.id, isActive: true },
      relations: ['baby'],
    });

    if (!caregiver?.baby) return null;

    return { user, baby: caregiver.baby };
  }

  private async getFeedingSummary(alexaUserId: string) {
    const data = await this.getUserAndBaby(alexaUserId);

    if (!data) {
      return this.buildResponse(
        'No encontré tu cuenta vinculada. Por favor vincula tu cuenta de BebIO Steps en la aplicación.',
        true,
      );
    }

    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const feedings = await this.feedingRepository.find({
      where: { babyId: data.baby.id, startTime: Between(startOfDay, endOfDay) },
    });

    const totalOz = feedings.reduce((sum, f) => sum + (Number(f.amountOz) || 0), 0);
    const totalFeedings = feedings.length;

    return this.buildResponse(
      `${data.baby.firstName} ha tenido ${totalFeedings} tomas hoy, con un total de ${totalOz.toFixed(1)} onzas.`,
      true,
    );
  }

  private async getSleepSummary(alexaUserId: string) {
    const data = await this.getUserAndBaby(alexaUserId);

    if (!data) {
      return this.buildResponse(
        'No encontré tu cuenta vinculada. Por favor vincula tu cuenta en la aplicación.',
        true,
      );
    }

    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const sleepLogs = await this.sleepRepository.find({
      where: { babyId: data.baby.id, startTime: Between(startOfDay, endOfDay) },
    });

    const totalMinutes = sleepLogs.reduce(
      (sum, s) => sum + (s.durationMinutes || 0),
      0,
    );
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    return this.buildResponse(
      `${data.baby.firstName} ha dormido ${hours} horas y ${minutes} minutos hoy, en ${sleepLogs.length} sesiones.`,
      true,
    );
  }

  private async logFeeding(alexaUserId: string, slots: any) {
    const data = await this.getUserAndBaby(alexaUserId);

    if (!data) {
      return this.buildResponse(
        'No encontré tu cuenta vinculada. Por favor vincula tu cuenta en la aplicación.',
        true,
      );
    }

    const amountOz = slots?.amount?.value ? parseFloat(slots.amount.value) : undefined;

    const feeding = this.feedingRepository.create({
      babyId: data.baby.id,
      loggedByUserId: data.user.id,
      type: FeedingType.BOTTLE,
      startTime: new Date(),
      amountOz,
    });

    await this.feedingRepository.save(feeding);

    const amountText = amountOz ? ` de ${amountOz} onzas` : '';
    return this.buildResponse(
      `Listo, registré una toma${amountText} para ${data.baby.firstName}.`,
      true,
    );
  }

  private async logSleep(alexaUserId: string, slots: any) {
    const data = await this.getUserAndBaby(alexaUserId);

    if (!data) {
      return this.buildResponse(
        'No encontré tu cuenta vinculada. Por favor vincula tu cuenta en la aplicación.',
        true,
      );
    }

    const durationMinutes = slots?.duration?.value
      ? parseInt(slots.duration.value, 10)
      : undefined;

    const now = new Date();
    const startTime = durationMinutes
      ? new Date(now.getTime() - durationMinutes * 60 * 1000)
      : now;

    const sleepLog = this.sleepRepository.create({
      babyId: data.baby.id,
      loggedByUserId: data.user.id,
      type: 'nap' as any,
      startTime,
      endTime: durationMinutes ? now : undefined,
      durationMinutes,
    });

    await this.sleepRepository.save(sleepLog);

    const durationText = durationMinutes ? ` de ${durationMinutes} minutos` : '';
    return this.buildResponse(
      `Listo, registré una siesta${durationText} para ${data.baby.firstName}.`,
      true,
    );
  }

  private async getBabyStatus(alexaUserId: string) {
    const data = await this.getUserAndBaby(alexaUserId);

    if (!data) {
      return this.buildResponse(
        'No encontré tu cuenta vinculada. Por favor vincula tu cuenta en la aplicación.',
        true,
      );
    }

    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

    const [feedings, sleepLogs] = await Promise.all([
      this.feedingRepository.find({
        where: { babyId: data.baby.id, startTime: Between(startOfDay, endOfDay) },
      }),
      this.sleepRepository.find({
        where: { babyId: data.baby.id, startTime: Between(startOfDay, endOfDay) },
      }),
    ]);

    const totalOz = feedings.reduce((sum, f) => sum + (Number(f.amountOz) || 0), 0);
    const totalSleepMinutes = sleepLogs.reduce(
      (sum, s) => sum + (s.durationMinutes || 0),
      0,
    );
    const sleepHours = Math.floor(totalSleepMinutes / 60);
    const sleepMinutes = totalSleepMinutes % 60;

    return this.buildResponse(
      `Resumen del día para ${data.baby.firstName}: Ha tenido ${feedings.length} tomas con ${totalOz.toFixed(1)} onzas en total, y ha dormido ${sleepHours} horas y ${sleepMinutes} minutos.`,
      true,
    );
  }

  private buildResponse(speechText: string, shouldEndSession: boolean) {
    return {
      version: '1.0',
      response: {
        outputSpeech: {
          type: 'PlainText',
          text: speechText,
        },
        shouldEndSession,
      },
    };
  }
}
