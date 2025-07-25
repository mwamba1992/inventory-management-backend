import { IsString } from 'class-validator';


export class RefreshTokenDto {

  @IsString()
  refreshToken: string;

  @IsString()
  userId?: number;
  }