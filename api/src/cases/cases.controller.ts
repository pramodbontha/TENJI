import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { CasesService } from './cases.service';
import { FilterCasesQueryDto } from './dto/filter-cases-query.dto';

@Controller('cases')
export class CasesController {
  constructor(private readonly casesService: CasesService) {}

  @Get('top-cited')
  public async fetchTopCitedCases() {
    try {
      const cases = await this.casesService.getTopCitedCases();
      return cases;
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Failed to fetch top cited cases',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('filter')
  public async fetchFilteredCases(@Query() filterDto: FilterCasesQueryDto) {
    try {
      // Use a case-insensitive regex pattern to determine if the query matches the case number format
      const caseNumberPattern = /^\d+\s*,?\s*\d+\s*BVerfGE$/i; // The 'i' flag makes it case-insensitive
      const searchTerm = filterDto.searchTerm || ''; // Use searchTerm from DTO

      if (caseNumberPattern.test(searchTerm)) {
        // If query matches case number format, search by case number
        const cases = await this.casesService.searchCasesByNumber(searchTerm);
        return cases; // Indicate type of search in response
      } else {
        // Otherwise, perform a lemmatized search
        const cases = await this.casesService.searchCases(filterDto);
        return cases;
      }
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Failed to fetch filtered cases',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('decisions-types')
  public async fetchDecisionTypes() {
    try {
      const decisions = await this.casesService.getDecisionTypes();
      return decisions;
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Failed to fetch decisions',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('/search-by-number')
  async searchCaseByNumber(@Query('number') caseNumber: string) {
    return this.casesService.searchCasesByNumber(caseNumber);
  }
}
