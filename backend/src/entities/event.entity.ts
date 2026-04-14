import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn,
} from 'typeorm';
import { Device } from './device.entity';

@Entity('Event')
export class Event {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  data: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column()
  deviceId: number;

  @ManyToOne(() => Device, (device) => device.events, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'deviceId' })
  device: Device;
}
