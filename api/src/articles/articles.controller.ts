import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Logger,
  Query,
} from '@nestjs/common';
import { ArticlesService } from './articles.service';
import { FilterArticlesQueryDto } from './dto/filter-articles-query.dto';

@Controller('articles')
export class ArticlesController {
  private readonly logger = new Logger(ArticlesController.name);
  constructor(private readonly articlesService: ArticlesService) {}

  @Get('top-cited')
  public async fetchTopCitedArticles() {
    try {
      const articles = await this.articlesService.getTopCitedArticles();
      return articles;
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Failed to fetch top cited articles',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('filter')
  public async fetchFilteredArticles(
    @Query() filterDto: FilterArticlesQueryDto,
  ) {
    try {
      this.logger.log(
        `Filtering articles with query: ${JSON.stringify(filterDto)}`,
      );
      const articleNumberPattern =
        /^(Art\.\s*)?\d+(\s*\(?[A-Za-z0-9]+\.\)?)*\s*GG$/i;

      const isArticleNumber = filterDto.searchTerm
        ? articleNumberPattern.test(filterDto.searchTerm.trim())
        : false;

      if (isArticleNumber) {
        console.log('Searching by article number');
        const articles =
          await this.articlesService.searchArticlesByNumber(filterDto);
        return articles;
      } else {
        const articles = await this.articlesService.searchArticles(filterDto);
        return articles;
      }
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Failed to fetch filtered articles',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('filter/count')
  public async fetchFilteredArticlesCount(
    @Query() filterDto: FilterArticlesQueryDto,
  ) {
    try {
      const count =
        await this.articlesService.getFilteredArticlesCount(filterDto);
      return count;
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Failed to fetch filtered articles count',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
