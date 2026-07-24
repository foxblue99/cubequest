
import { IsString, IsOptional, IsInt, MinLength, MaxLength, IsIn } from 'class-validator';

export class RegisterDto {
  @IsIn(['STUDENT', 'PARENT'])
  role: string;

  @IsString()
  @MinLength(11)
  @MaxLength(11)
  phone: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  @MinLength(1)
  @MaxLength(20)
  nickname: string;

  @IsOptional()
  @IsInt()
  birthYear?: number;

  @IsOptional()
  @IsString()
  city?: string;
}
