import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Device } from '../entities/device.entity';
import { Event } from '../entities/event.entity';

@Injectable()
export class DevicesService {
  constructor(
    @InjectRepository(Device) private readonly deviceRepo: Repository<Device>,
    @InjectRepository(Event)  private readonly eventRepo:  Repository<Event>,
  ) {}

  async findAll() {
    const devices = await this.deviceRepo
      .createQueryBuilder('d')
      .loadRelationCountAndMap('d._count_events', 'd.events')
      .orderBy('d.id', 'ASC')
      .getMany();

    return devices.map((d: any) => ({
      id: d.id,
      deviceId: d.deviceId,
      type: d.type,
      _count: { events: d._count_events ?? 0 },
    }));
  }

  async findOne(id: number) {
    const d: any = await this.deviceRepo
      .createQueryBuilder('d')
      .loadRelationCountAndMap('d._count_events', 'd.events')
      .where('d.id = :id', { id })
      .getOne();

    if (!d) return null;
    return {
      id: d.id,
      deviceId: d.deviceId,
      type: d.type,
      _count: { events: d._count_events ?? 0 },
    };
  }

  async findEvents(deviceId: number, page = 1, limit = 50) {
    const [events, total] = await this.eventRepo.findAndCount({
      where: { deviceId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { events, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
}
