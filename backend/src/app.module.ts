import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { AuthModule } from './auth/auth.module';
import { DevicesModule } from './devices/devices.module';
import { EventsModule } from './events/events.module';
import { SerialModule } from './serial/serial.module';
import { GatewayModule } from './gateway/gateway.module';
import { MqttModule } from './mqtt/mqtt.module';
import { SimulationModule } from './simulation/simulation.module';
import { StatsModule } from './stats/stats.module';
import { AppConfigModule } from './config/config.module';
import { Device } from './entities/device.entity';
import { Event } from './entities/event.entity';

const dbPath = process.env.DATABASE_PATH || 'data/dev.db';
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'better-sqlite3',
      database: dbPath,
      entities: [Device, Event],
      synchronize: true,
      logging: false,
    }),
    AuthModule,
    DevicesModule,
    EventsModule,
    SerialModule,
    GatewayModule,
    MqttModule,
    SimulationModule,
    StatsModule,
    AppConfigModule,
  ],
})
export class AppModule {}
