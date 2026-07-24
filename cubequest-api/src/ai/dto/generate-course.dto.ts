import { IsString, IsOptional, IsInt, Min, Max, Length } from 'class-validator';

export class GenerateCourseDto {
  @IsString() @Length(1, 200)
  topic!: string;

  @IsOptional() @IsString() @Length(1, 50)
  mainCategory?: string;

  @IsOptional() @IsString() @Length(1, 50)
  subCategory?: string;

  @IsOptional() @IsInt() @Min(1) @Max(20)
  lessonCount?: number;
}
