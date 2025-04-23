import { PrimaryGeneratedColumn } from "typeorm";

export abstract class AbstractEntity<T> {
    @PrimaryGeneratedColumn()
    id: number;

    // constructor(entity: Partial<T>) {
    //     console.log('constructor', entity);
    //     Object.assign(this, entity);
    //     console.log('this abs', this);
    // }
}