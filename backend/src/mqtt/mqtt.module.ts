import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MqttService } from './mqtt.service';
import { GatewayModule } from '../gateway/gateway.module';
import { Device } from '../entities/device.entity';
import { Event } from '../entities/event.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Device, Event]),
    forwardRef(() => GatewayModule),
  ],
  providers: [MqttService],
  exports: [MqttService],
})
export class MqttModule {}
