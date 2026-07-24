
import { IsString, MinLength, MaxLength } from 'class-validator';

export class LoginDto {
  @IsString()
  @MinLength(11)
  @MaxLength(11)
  phone: string;

  @IsString()
  @MinLength(6)
  password: string;
}
