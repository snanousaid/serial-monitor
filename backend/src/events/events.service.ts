import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event } from '../entities/event.entity';

export interface EventsQuery {
  page?: number;
  limit?: number;
  deviceId?: string;     // filtre par deviceId (string)
  type?: string;         // filtre par type (Serial / MQTT / Simulation)
  search?: string;       // recherche dans data
  from?: string;         // ISO date min
  to?: string;           // ISO date max
}

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event) private readonly eventRepo: Repository<Event>,
  ) {}

  async findRecent(limit = 50) {
    const events = await this.eventRepo.find({
      order: { createdAt: 'DESC' },
      take: limit,
      relations: ['device'],
    });
    return events.map((e) => ({
      id: e.id,
      data: e.data,
      createdAt: e.createdAt,
      device: e.device ? { deviceId: e.device.deviceId, type: e.device.type } : null,
    }));
  }

  async findPaginated(q: EventsQuery) {
    const page  = Math.max(1, Number(q.page)  || 1);
    const limit = Math.min(200, Math.max(1, Number(q.limit) || 25));

    const qb = this.eventRepo.createQueryBuilder('e')
      .leftJoinAndSelect('e.device', 'd')
      .orderBy('e.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (q.deviceId) qb.andWhere('d.deviceId = :deviceId', { deviceId: q.deviceId });
    if (q.type)     qb.andWhere('d.type = :type',         { type: q.type });
    if (q.search)   qb.andWhere('e.data LIKE :search',    { search: `%${q.search}%` });
    if (q.from)     qb.andWhere('e.createdAt >= :from',   { from: q.from });
    if (q.to)       qb.andWhere('e.createdAt <= :to',     { to: q.to });

    const [events, total] = await qb.getManyAndCount();

    return {
      events: events.map((e) => ({
        id: e.id,
        data: e.data,
        createdAt: e.createdAt,
        device: e.device ? { deviceId: e.device.deviceId, type: e.device.type } : null,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
