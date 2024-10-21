import { IsOptional, IsBoolean, IsInt, Min, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class FilterArticlesQueryDto {
  @IsOptional()
  @IsString()
  searchTerm?: string;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  name?: boolean;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  number?: boolean;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
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
