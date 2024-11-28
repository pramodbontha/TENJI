import { IsOptional, IsBoolean, IsInt, Min, IsString } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class FilterArticlesQueryDto {
  @IsOptional()
  @IsString()
  searchTerm?: string;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  name?: boolean;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  number?: boolean;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  text?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number) // Ensures query params are transformed to integers
  skip?: number;

  @IsOptional()
  @IsInt()
  @Min(10)
  @Type(() => Number)
  limit?: number;
}
