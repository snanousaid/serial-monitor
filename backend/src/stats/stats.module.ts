import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StatsService } from './stats.service';
import { StatsController } from './stats.controller';
import { Device } from '../entities/device.entity';
import { Event } from '../entities/event.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Device, Event])],
  providers: [StatsService],
  controllers: [StatsController],
})
export class StatsModule {}
