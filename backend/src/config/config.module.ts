import { Module } from '@nestjs/common';
import { AppConfigService } from './config.service';
import { ConfigController } from './config.controller';
import { SimulationModule } from '../simulation/simulation.module';
import { SerialModule } from '../serial/serial.module';
import { MqttModule } from '../mqtt/mqtt.module';

@Module({
  imports: [SimulationModule, SerialModule, MqttModule],
  providers: [AppConfigService],
  controllers: [ConfigController],
})
export class AppConfigModule {}
