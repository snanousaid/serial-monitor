import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { Device } from '../entities/device.entity';
import { Event } from '../entities/event.entity';

@Injectable()
export class StatsService {
  constructor(
    @InjectRepository(Device) private readonly deviceRepo: Repository<Device>,
    @InjectRepository(Event)  private readonly eventRepo:  Repository<Event>,
  ) {}

  async summary() {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [devicesCount, eventsCount, todayCount, lastEvent] = await Promise.all([
      this.deviceRepo.count(),
      this.eventRepo.count(),
      this.eventRepo.count({ where: { createdAt: MoreThanOrEqual(startOfDay) } }),
      this.eventRepo.findOne({
        where: {},
        order: { createdAt: 'DESC' },
        relations: ['device'],
      }),
    ]);

    return {
      devicesCount,
      eventsCount,
      todayCount,
      lastEvent: lastEvent ? {
        id: lastEvent.id,
        data: lastEvent.data,
        createdAt: lastEvent.createdAt,
        deviceId: lastEvent.device?.deviceId ?? null,
      } : null,
    };
  }

  async hourly() {
    // Events des 24 dernières heures groupés par heure
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const rows = await this.eventRepo
      .createQueryBuilder('e')
      .select(`strftime('%Y-%m-%d %H:00', e.createdAt)`, 'hour')
      .addSelect('COUNT(*)', 'count')
      .where('e.createdAt >= :since', { since: since.toISOString() })
      .groupBy('hour')
      .orderBy('hour', 'ASC')
      .getRawMany();

    return rows.map((r) => ({
      hour: r.hour,
      count: Number(r.count),
    }));
  }

  async topDevices(limit = 5) {
    const rows = await this.deviceRepo
      .createQueryBuilder('d')
      .leftJoin('d.events', 'e')
      .select('d.id', 'id')
      .addSelect('d.deviceId', 'deviceId')
      .addSelect('d.type', 'type')
      .addSelect('COUNT(e.id)', 'eventCount')
      .groupBy('d.id')
      .orderBy('eventCount', 'DESC')
      .limit(limit)
      .getRawMany();

    return rows.map((r) => ({
      id: Number(r.id),
      deviceId: r.deviceId,
      type: r.type,
      eventCount: Number(r.eventCount),
    }));
  }
}
