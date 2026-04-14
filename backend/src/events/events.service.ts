import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EventsService {
  constructor(private readonly prisma: PrismaService) {}

  async findRecent(limit = 100) {
    return this.prisma.event.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        device: { select: { deviceId: true, type: true } },
      },
    });
  }
}
