import { IsString, IsOptional, IsBoolean, Length } from 'class-validator';

export class GenerateMissionsDto {
  @IsOptional() @IsString() @Length(1, 100)
  focus?: string; // optional user focus hint
}

export class CompleteMissionDto {
  @IsBoolean()
  done!: boolean;
}
