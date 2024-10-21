import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { CasesCitationsService } from './cases-citations/cases-citations.service';

import { CasesCitationsFilterDto } from './dto/cases-citations-filter.dto';
import { ArticlesCitationsFilterDto } from './dto/articles-citations-filter.dto';
import { ArticlesCitationsService } from './articles-citations/articles-citations.service';

@Controller('citations')
export class CitationsController {
  constructor(
    private readonly casesCitationsService: CasesCitationsService,
    private readonly articlesCitationsService: ArticlesCitationsService,
  ) {}

  // Citation endpoints for cases
  @Get('cited-by-cases')
  public async fetchCasesCitingGivenCase(
    @Query() filterDto: CasesCitationsFilterDto,
  ) {
    try {
      const cases =
        await this.casesCitationsService.getCasesCitingGivenCase(filterDto);
      return cases;
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Failed to fetch cases citing given case',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('cited-by-cases-count')
  public async fetchCasesCitingGivenCaseCount(@Query('caseId') caseId: string) {
    try {
      const count =
        await this.casesCitationsService.getCasesCitingGivenCaseCount(caseId);
      return count;
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Failed to fetch cases citing given case count',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('citing-cases')
  public async fetchCaseCitingOtherCases(
    @Query() filterDto: CasesCitationsFilterDto,
  ) {
    try {
      const cases =
        await this.casesCitationsService.getCaseCitingOtherCases(filterDto);
      return cases;
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Failed to fetch case citing other cases',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('citing-cases-count')
  public async fetchCaseCitingOtherCasesCount(@Query('caseId') caseId: string) {
    try {
      const count =
        await this.casesCitationsService.getCaseCitingOtherCasesCount(caseId);
      return count;
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Failed to fetch case citing other cases count',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('articles-citing-case')
  public async fetchArticlesCitingCase(
    @Query() filterDto: CasesCitationsFilterDto,
  ) {
    try {
      const articles =
        await this.casesCitationsService.getArticlesCitingCase(filterDto);
      return articles;
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Failed to fetch case citing articles',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('articles-citing-case-count')
  public async fetchArticlesCitingCaseCount(@Query('caseId') caseId: string) {
    try {
      const count =
        await this.casesCitationsService.getArticlesCitingCaseCount(caseId);
      return count;
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Failed to fetch case citing articles count',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('references-with-case')
  public async fetchReferencesCitingCase(
    @Query() filterDto: CasesCitationsFilterDto,
  ) {
    try {
      const references =
        await this.casesCitationsService.getReferencesWithGivenCase(filterDto);
      return references;
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Failed to fetch case citing references',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('references-with-case-count')
  public async fetchReferencesCitingCaseCount(@Query('caseId') caseId: string) {
    try {
      const count =
        await this.casesCitationsService.getReferencesWithGivenCaseCount(
          caseId,
        );
      return count;
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Failed to fetch case citing references count',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Citation endpoints for articles
  @Get('cited-by-articles')
  public async fetchCitedByArticles(
    @Query() filterDto: ArticlesCitationsFilterDto,
  ) {
    try {
      const articles =
        await this.articlesCitationsService.getCitedByArticles(filterDto);
      return articles;
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Failed to fetch articles cited by given article',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('cited-by-articles-count')
  public async fetchCitedByArticlesCount(
    @Query('articleId') articleId: string,
  ) {
    try {
      const count =
        await this.articlesCitationsService.getCitedByArticlesCount(articleId);
      return count;
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Failed to fetch articles cited by given article count',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('citing-articles')
  public async fetchArticlesCitingArticle(
    @Query() filterDto: ArticlesCitationsFilterDto,
  ) {
    try {
      const articles =
        await this.articlesCitationsService.getArticleCitingOtherArticles(
          filterDto,
        );
      return articles;
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Failed to fetch articles citing given article',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('citing-articles-count')
  public async fetchArticlesCitingArticleCount(
    @Query('articleId') articleId: string,
  ) {
    try {
      const count =
        await this.articlesCitationsService.getArticleCitingOtherArticlesCount(
          articleId,
        );
      return count;
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Failed to fetch articles citing given article count',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('cases-citing-article')
  public async fetchCasesCitingArticle(
    @Query() filterDto: ArticlesCitationsFilterDto,
  ) {
    try {
      const cases =
        await this.articlesCitationsService.getCasesCitingArticle(filterDto);
      return cases;
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Failed to fetch cases citing given article',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('cases-citing-article-count')
  public async fetchCasesCitingArticleCount(
    @Query('articleId') articleId: string,
  ) {
    try {
      const count =
        await this.articlesCitationsService.getCasesCitingArticleCount(
          articleId,
        );
      return count;
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Failed to fetch cases citing given article count',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('references-citing-article')
  public async fetchReferencesCitingArticle(
    @Query() filterDto: ArticlesCitationsFilterDto,
  ) {
    try {
      const references =
        await this.articlesCitationsService.getReferencesWithArticle(filterDto);
      return references;
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Failed to fetch references citing given article',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('references-citing-article-count')
  public async fetchReferencesCitingArticleCount(
    @Query('articleId') articleId: string,
  ) {
    try {
      const count =
        await this.articlesCitationsService.getReferencesWithArticleCount(
          articleId,
        );
      return count;
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Failed to fetch references citing given article count',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
