import {
  IsOptional,
  IsString,
  IsInt,
  IsBoolean,
  IsArray,
  Min,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class FilterReferencesQueryDto {
  @IsOptional()
  @IsString()
  searchTerm?: string;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  context?: boolean;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  text?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Type(() => String)
  resources?: string[];

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  refCasesArticles?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  skip?: number;

  @IsOptional()
  @IsInt()
  @Min(10)
  @Type(() => Number)
  limit?: number;
}
