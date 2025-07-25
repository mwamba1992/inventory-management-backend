import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn } from 'typeorm';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

@Entity()
export class BaseEntity {

  @PrimaryGeneratedColumn()// Using UUID for the 'id'
  id: number;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', name: 'created_at' })
  createdAt: Date = new Date(); // Equivalent to LocalDateTime.now()

  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', name: 'updated_at' })
  updatedAt: Date = new Date(); // Equivalent to LocalDateTime.now()

  @DeleteDateColumn({ type: 'timestamp', nullable: true, name: 'deleted_at' })
  deletedAt?: Date;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'created_by' })
  @IsOptional()
  @IsString()
  createdBy?: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'updated_by' })
  @IsOptional()
  @IsString()
  updatedBy?: string;

  @Column({ type: 'boolean', default: false, name: 'deleted' })
  @IsBoolean()
  deleted: boolean = false;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'deleted_by' })
  @IsOptional()
  @IsString()
  deletedBy?: string;

  @Column({ type: 'boolean', default: true, name: 'active' })
  @IsBoolean()
  active: boolean = true;

  @Column({ type: 'text', nullable: true, name: 'action' })
  @IsOptional()
  @IsString()
  action?: string;
}
