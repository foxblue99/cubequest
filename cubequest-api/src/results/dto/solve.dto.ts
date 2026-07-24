import { IsString, IsInt, IsOptional, Min, Max, Length, IsIn } from 'class-validator';

/** Create a new solve result (used by timer submission) */
export class CreateSolveDto {
  @IsString() @IsIn(['333', '222', '444', '555', 'pyram', 'skewb', 'mirror', 'maple', 'sq1', 'cross', 'f2l', 'oll', 'pll'])
  eventType!: string;

  @IsString() @Length(1, 500)
  scramble!: string;

  @IsInt() @Min(0) @Max(600000)
  timeMs!: number;

  @IsString() @IsIn(['NONE', 'PLUS_TWO', 'DNF'])
  penalty!: string;

  @IsOptional() @IsInt() @Min(0) @Max(600000)
  crossMs?: number;

  @IsOptional() @IsInt() @Min(0) @Max(600000)
  f2lMs?: number;

  @IsOptional() @IsInt() @Min(0) @Max(600000)
  ollMs?: number;

  @IsOptional() @IsInt() @Min(0) @Max(600000)
  pllMs?: number;

  @IsOptional() @IsString() @Length(0, 500)
  note?: string;
}

/** Update penalty or note after solve */
export class UpdateSolveDto {
  @IsOptional() @IsString() @IsIn(['NONE', 'PLUS_TWO', 'DNF'])
  penalty?: string;

  @IsOptional() @IsString() @Length(0, 500)
  note?: string;
}
