import {
  IsOptional,
  IsString,
  IsInt,
  Min,
  IsArray,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';

export class FilterCasesQueryDto {
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
  judgment?: boolean;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  facts?: boolean;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  reasoning?: boolean;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  headnotes?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  skip?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  limit?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  startYear?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  endYear?: number;

  @IsOptional()
  @IsArray()
  @Type(() => String)
  decisionType?: string[];
}
