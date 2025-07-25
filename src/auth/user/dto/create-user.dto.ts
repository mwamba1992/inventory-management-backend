import { IsArray, IsBoolean, IsEmail, IsOptional, IsString } from 'class-validator';

export class CreateUserDto {

  @IsString()
  username: string;

  @IsString()
  @IsOptional()
  checkNumber?: string;


  @IsString()
  address: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsOptional()
  mobileNumber?: string;

  @IsString()
  name: string;

  @IsArray()
  roleIds: number[];
}
