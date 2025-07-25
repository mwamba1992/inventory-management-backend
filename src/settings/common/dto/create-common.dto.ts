import { IsNotEmpty, IsString, Length } from 'class-validator';

export class CreateCommonDto {

  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  readonly code: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  readonly description: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  readonly type: string;
}
