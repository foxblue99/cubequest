import { IsOptional, IsString, Length } from 'class-validator';

export class UpdateAccountDto {
  @IsOptional() @IsString() @Length(1, 30)
  nickname?: string;

  @IsOptional() @IsString() @Length(0, 50)
  city?: string;
}
