import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AppConfigService } from './config.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('config')
export class ConfigController {
  constructor(private readonly config: AppConfigService) {}

  @Get()
  get() { return this.config.getConfig(); }

  @Post('simulation')
  toggle(@Body() body: { enabled: boolean }) {
    return this.config.toggleSimulation(body.enabled);
  }
}
