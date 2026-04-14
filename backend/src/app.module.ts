import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { DevicesModule } from './devices/devices.module';
import { EventsModule } from './events/events.module';
import { SerialModule } from './serial/serial.module';
import { GatewayModule } from './gateway/gateway.module';
import { MqttModule } from './mqtt/mqtt.module';
import { Device } from './entities/device.entity';
import { Event } from './entities/event.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'better-sqlite3',
      database: process.env.DATABASE_PATH || 'dev.db',
      entities: [Device, Event],
      synchronize: true,   // crée les tables automatiquement (dev uniquement)
      logging: false,
    }),
    AuthModule,
    DevicesModule,
    EventsModule,
    SerialModule,
    GatewayModule,
    MqttModule,
  ],
})
export class AppModule {}
