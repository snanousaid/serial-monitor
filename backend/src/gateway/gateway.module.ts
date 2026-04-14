import { Module } from '@nestjs/common';
import { SerialGateway } from './serial.gateway';

@Module({
  providers: [SerialGateway],
  exports: [SerialGateway],
})
export class GatewayModule {}
