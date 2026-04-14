import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DevicesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.device.findMany({
      include: {
        _count: { select: { events: true } },
      },
      orderBy: { id: 'asc' },
    });
  }

  async findOne(id: number) {
    return this.prisma.device.findUnique({
      where: { id },
      include: { _count: { select: { events: true } } },
    });
  }

  async findEvents(deviceId: number, page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const [events, total] = await Promise.all([
      this.prisma.event.findMany({
        where: { deviceId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.event.count({ where: { deviceId } }),
    ]);

    return { events, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
}
