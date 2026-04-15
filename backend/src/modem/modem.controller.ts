import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ModemService } from './modem.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('modem')
export class ModemController {
  constructor(private readonly modem: ModemService) {}

  @Get('platform')
  platform() {
    return { linux: this.modem.isLinux() };
  }

  @Get('connections')
  connections() {
    return this.modem.listConnections();
  }

  @Get('status')
  status() {
    return this.modem.status();
  }

  @Post('unlock')
  unlock(@Body() body: { pin: string }) {
    return this.modem.unlockPin(body.pin);
  }

  @Post('restart-modem')
  restartModem() {
    return this.modem.restartModem();
  }

  @Post('restart-pppd')
  restartPppd() {
    return this.modem.restartPppd();
  }
}
