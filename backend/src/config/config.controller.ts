import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AppConfigService, SerialConfig, MqttConfig } from './config.service';
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

  @Post('serial')
  updateSerial(@Body() body: SerialConfig) {
    return this.config.updateSerial(body);
  }

  @Post('mqtt')
  updateMqtt(@Body() body: MqttConfig) {
    return this.config.updateMqtt(body);
  }
}
