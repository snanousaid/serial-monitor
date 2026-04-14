import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SerialService } from './serial.service';
import { GatewayModule } from '../gateway/gateway.module';
import { Device } from '../entities/device.entity';
import { Event } from '../entities/event.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Device, Event]),
    forwardRef(() => GatewayModule),
  ],
  providers: [SerialService],
  exports: [SerialService],
})
export class SerialModule {}
