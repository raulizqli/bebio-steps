import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { CurrentUser } from '../../common/decorators';
import { User } from '../users/user.entity';

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('api/v1/notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get user notifications' })
  @ApiQuery({ name: 'limit', required: false, example: 50 })
  getNotifications(
    @CurrentUser() user: User,
    @Query('limit') limit?: string,
  ) {
    return this.notificationsService.getUserNotifications(
      user.id,
      limit ? parseInt(limit, 10) : 50,
    );
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notification count' })
  getUnreadCount(@CurrentUser() user: User) {
    return this.notificationsService.getUnreadCount(user.id);
  }

  @Post(':notificationId/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  markAsRead(
    @Param('notificationId', ParseUUIDPipe) notificationId: string,
    @CurrentUser() user: User,
  ) {
    return this.notificationsService.markAsRead(notificationId, user.id);
  }

  @Post('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  markAllAsRead(@CurrentUser() user: User) {
    return this.notificationsService.markAllAsRead(user.id);
  }
}
