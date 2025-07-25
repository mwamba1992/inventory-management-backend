import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class ItemSupplier {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  supplierName: string;

  @Column()
  location: string;

  @Column({ nullable: true })
  contactEmail: string;

  @Column({ nullable: true })
  contactPhone: string;

  @Column({ nullable: true })
  notes: string;
}
