import { Controller, Get, UseGuards } from '@nestjs/common';
import { StatsService } from './stats.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('stats')
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get('summary')
  summary() { return this.statsService.summary(); }

  @Get('hourly')
  hourly() { return this.statsService.hourly(); }

  @Get('top-devices')
  topDevices() { return this.statsService.topDevices(); }
}
