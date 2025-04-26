import { PrimaryGeneratedColumn } from 'typeorm';

export abstract class AbstractEntity<T> {
  @PrimaryGeneratedColumn()
  id: number;
}
