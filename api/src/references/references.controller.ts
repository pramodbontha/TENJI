import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { ReferencesService } from './references.service';
import { FilterReferencesQueryDto } from './dto/filter-references-query.dto';

@Controller('references')
export class ReferencesController {
  constructor(private readonly referencesService: ReferencesService) {}

  @Get('search')
  public async fetchFilteredReferences(
    @Query() filterDto: FilterReferencesQueryDto,
  ) {
    try {
      const references =
        await this.referencesService.searchReferences(filterDto);
      return references;
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Failed to fetch filtered references',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('resources')
  public async fetchResources() {
    try {
      const resources = await this.referencesService.getResources();
      return resources;
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Failed to fetch resources',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('section-references')
  public async fetchSectionReferences(@Query('searchTerm') searchTerm: string) {
    try {
      const sectionReferences =
        await this.referencesService.getSectionReferences(searchTerm);
      return sectionReferences;
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Failed to fetch section references',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
