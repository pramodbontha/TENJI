import {
  IsOptional,
  IsString,
  IsInt,
  IsBoolean,
  IsArray,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class FilterReferencesQueryDto {
  @IsOptional()
  @IsString()
  searchTerm?: string;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  context?: boolean;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  text?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Type(() => String)
  resources?: string[];

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
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
