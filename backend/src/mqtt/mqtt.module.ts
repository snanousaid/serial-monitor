import { Module, forwardRef } from '@nestjs/common';
import { MqttService } from './mqtt.service';
import { GatewayModule } from '../gateway/gateway.module';

@Module({
  imports: [forwardRef(() => GatewayModule)],
  providers: [MqttService],
  exports: [MqttService],
})
export class MqttModule {}
