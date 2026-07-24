import { IsString, IsInt, IsOptional, Min, Max, Length, IsIn } from 'class-validator';

export class ChatMessageDto {
  @IsString() @Length(1, 500)
  message!: string;
}

export class SolveTimeDto {
  @IsInt() @Min(0) @Max(600000)
  timeMs!: number;

  @IsOptional() @IsInt() @Min(0) @Max(600000)
  crossMs?: number;

  @IsOptional() @IsInt() @Min(0) @Max(600000)
  f2lMs?: number;

  @IsOptional() @IsInt() @Min(0) @Max(600000)
  ollMs?: number;

  @IsOptional() @IsInt() @Min(0) @Max(600000)
  pllMs?: number;
}

export class ProfileDto {
  @IsOptional() @IsInt() @Min(5) @Max(100)
  age?: number;

  @IsOptional() @IsString() @Length(1, 100)
  experience?: string;

  @IsOptional() @IsString() @Length(1, 100)
  goal?: string;

  @IsOptional() @IsString() @Length(1, 50)
  mainCube?: string;

  @IsOptional() @IsString() @Length(1, 50)
  trainFreq?: string;

  @IsOptional() @IsString() @Length(0, 200)
  bio?: string;
}

export class PersonaDto {
  @IsString() @IsIn(['gentle', 'strict', 'bro'])
  persona!: string;
}

export class DailySubmitDto {
  @IsInt() @Min(0) @Max(600000)
  timeMs!: number;

  @IsOptional() @IsString() @IsIn(['NONE', 'PLUS_TWO', 'DNF'])
  penalty?: string;
}
