import { Entity, PrimaryGeneratedColumn, Column, OneToMany, Index } from 'typeorm';
import { Event } from './event.entity';

@Entity('Device')
export class Device {
  @PrimaryGeneratedColumn()
  id: number;

  @Index({ unique: true })
  @Column({ type: 'varchar' })
  deviceId: string;

  @Column({ type: 'varchar', default: 'Serial' })
  type: string;

  @OneToMany(() => Event, (event) => event.device)
  events: Event[];
}
