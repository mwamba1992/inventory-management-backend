import { Column, Entity, JoinTable, ManyToMany } from 'typeorm';
import { BaseEntity } from '../../../utils/base.entity';
import { IsBoolean, IsEmail, IsOptional, IsString } from 'class-validator';
import { Role } from '../../role/entities/role.entity';

@Entity()
export class User extends BaseEntity{

  @Column({ unique: true, name: 'username', nullable: false })
  @IsString()
  username: string;

  @Column({ nullable: true, name: 'check_number' })
  @IsString()
  checkNumber?: string;

  @Column({ length: 1000 })
  @IsString()
  password: string;

  @Column({ length: 100 })
  @IsString()
  address: string;

  @Column({ nullable: false, length: 100 })
  @IsEmail()
  email: string;

  @Column({ nullable: true, name: 'mobile_number' })
  @IsString()
  mobileNumber?: string;

  @Column()
  @IsString()
  name: string;

  @Column({ nullable: true, name: 'created_by' })
  @IsString()
  createdBy?: string;

  @Column({ nullable: false, name: 'new_account', default: true })
  @IsBoolean()
  newAccount: boolean;

  @Column({ nullable: true, name: 'updated_by' })
  @IsString()
  updatedBy?: string;

  @Column({ nullable: true, name: 'deleted_by' })
  @IsString()
  deletedBy?: string;


  @Column({ default: false, name: 'is_logged_in' })
  @IsBoolean()
  isLoggedIn: boolean;

  // Join with Role entity for many-to-many relationship
  @ManyToMany(() => Role, { eager: true })
  @JoinTable({
    name: 'role_user',  // The table name for the relationship
    joinColumns: [{ name: 'user_id', referencedColumnName: 'id' }],
    inverseJoinColumns: [{ name: 'role_id', referencedColumnName: 'id' }],
  })
  rolesList: Role[];

  @Column({ default: false, name: 'account_non_expired' })
  @IsBoolean()
  accountNonExpired: boolean;

  @Column({ default: 0, name: 'login_attempt' })
  @IsOptional()
  loginAttempt: number;

  @Column({ default: false, name: 'account_non_locked' })
  @IsBoolean()
  accountNonLocked: boolean;

  @Column({ default: false, name: 'credentials_non_expired' })
  @IsBoolean()
  credentialsNonExpired: boolean;

  @Column({ default: false, name: 'enabled' })
  @IsBoolean()
  enabled: boolean;

}
