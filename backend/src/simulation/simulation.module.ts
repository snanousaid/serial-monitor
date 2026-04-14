import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SimulationService } from './simulation.service';
import { GatewayModule } from '../gateway/gateway.module';
import { Device } from '../entities/device.entity';
import { Event } from '../entities/event.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Device, Event]),
    forwardRef(() => GatewayModule),
  ],
  providers: [SimulationService],
  exports: [SimulationService],
})
export class SimulationModule {}
