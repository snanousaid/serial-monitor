import { Module, forwardRef } from '@nestjs/common';
import { SerialService } from './serial.service';
import { GatewayModule } from '../gateway/gateway.module';

@Module({
  imports: [forwardRef(() => GatewayModule)],
  providers: [SerialService],
  exports: [SerialService],
})
export class SerialModule {}
