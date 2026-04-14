import { Injectable } from '@nestjs/common';
import { SimulationService } from '../simulation/simulation.service';

@Injectable()
export class AppConfigService {
  constructor(private readonly simulation: SimulationService) {}

  getConfig() {
    return {
      serial: {
        port:     process.env.SERIAL_PORT       || 'COM3',
        baudRate: Number(process.env.SERIAL_BAUD_RATE || 9600),
      },
      mqtt: {
        broker:   process.env.MQTT_BROKER       || 'mqtt://localhost:1883',
        topic:    process.env.MQTT_TOPIC        || 'devices/data',
        clientId: process.env.MQTT_CLIENT_ID    || '',
        hasAuth:  Boolean(process.env.MQTT_USERNAME),
      },
      simulation: {
        enabled: this.simulation.isRunning(),
      },
      database: {
        path: process.env.DATABASE_PATH || 'data/dev.db',
      },
    };
  }

  async toggleSimulation(enabled: boolean) {
    if (enabled) this.simulation.start();
    else         this.simulation.stop();
    return { enabled: this.simulation.isRunning() };
  }
}
