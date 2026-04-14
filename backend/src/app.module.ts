import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { DevicesModule } from './devices/devices.module';
import { EventsModule } from './events/events.module';
import { SerialModule } from './serial/serial.module';
import { GatewayModule } from './gateway/gateway.module';
import { MqttModule } from './mqtt/mqtt.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    DevicesModule,
    EventsModule,
    SerialModule,
    GatewayModule,
    MqttModule,
  ],
})
export class AppModule {}
