import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async getUserNotifications(userId: string) {
    const notifications = await this.prisma.notificationEvent.findMany({
      where: { recipientId: userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const unreadCount = await this.prisma.notificationEvent.count({
      where: { recipientId: userId, readAt: null },
    });

    return {
      notifications,
      unreadCount,
    };
  }

  async markAsRead(notificationId: string, userId: string) {
    return this.prisma.notificationEvent.updateMany({
      where: { id: notificationId, recipientId: userId },
      data: { readAt: new Date() },
    });
  }
}
