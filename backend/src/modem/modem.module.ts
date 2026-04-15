import { Module } from '@nestjs/common';
import { ModemService } from './modem.service';
import { ModemController } from './modem.controller';

@Module({
  providers: [ModemService],
  controllers: [ModemController],
})
export class ModemModule {}
