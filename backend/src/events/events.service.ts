import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event } from '../entities/event.entity';

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event) private readonly eventRepo: Repository<Event>,
  ) {}

  async findRecent(limit = 100) {
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
}
