import { Module } from '@nestjs/common';
import { AppConfigService } from './config.service';
import { ConfigController } from './config.controller';
import { SimulationModule } from '../simulation/simulation.module';

@Module({
  imports: [SimulationModule],
  providers: [AppConfigService],
  controllers: [ConfigController],
})
export class AppConfigModule {}
