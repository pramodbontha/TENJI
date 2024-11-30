import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Neo4jService } from 'src/neo4j/neo4j.service';
import { FilterArticlesQueryDto } from './dto/filter-articles-query.dto';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import axios from 'axios';
import { normalizeCaseNumber } from 'src/utils/helpers';

@Injectable()
export class ArticlesService implements OnModuleInit {
  private readonly logger = new Logger(ArticlesService.name);

  constructor(
    private readonly neo4jService: Neo4jService,
    private readonly elasticsearchService: ElasticsearchService,
  ) {}

  async onModuleInit() {
    // Trigger the data sync on module initialization
    await this.syncArticlesToElasticSearch();
  }

  // Call the Python spaCy service to lemmatize text
  async lemmatizeText(text: string): Promise<string> {
    try {
      const response = await axios.post('http://lemmatizer:5000/lemmatize', {
        text,
      });
      return response.data.lemmatized_text;
    } catch (error) {
      this.logger.error('Failed to lemmatize text', error.stack);
      return text; // Fallback to original text in case of error
    }
  }

  async syncArticlesToElasticSearch() {
    this.logger.log('Syncing articles to ElasticSearch');

    this.logger.log('Checking index');
    await this.createIndex();
    const { count } = await this.elasticsearchService.count({
      index: 'articles',
    });
    if (count === 0) {
      const query = `
      MATCH (a:Article) 
      OPTIONAL MATCH (a:Article)-[:IS_NAMED]->(n:Name)
      RETURN id(a) as articleId, a, n.short AS articleName
    `;

      const result = await this.neo4jService.runQuery(query);

      const articles = [];

      for (const record of result) {
        const articleId = record.get('articleId');
        const articleData = record.get('a').properties;
        const articleName = record.get('articleName');

        // No need to lemmatize fields during indexing.
        // Just index the original fields in Elasticsearch.

        const articleToIndex = {
          ...articleData,
          citing_cases: articleData.citing_cases.low, // Convert Neo4j Integer to number
          name: articleName, // Store original article name and other fields
        };

        articles.push(articleToIndex);

        // Index the articles in Elasticsearch
        await this.elasticsearchService.index({
          index: 'articles',
          id: articleId, // Assuming "number" is a unique identifier
          body: articleToIndex,
        });
      }

      this.logger.log(`Indexed ${articles.length} articles`);

      this.logger.log('Lemmatizing articles');
      await this.lemmatizeArticles();
    }
  }

  private async lemmatizeArticles() {
    try {
      await axios.get('http://lemmatizer:5000/lemmatize-articles');
    } catch (error) {
      this.logger.error('Failed to lemmatize articles', error.stack);
    }
  }

  async createIndex() {
    const indexName = 'articles';
    const indexExists = await this.elasticsearchService.indices.exists({
      index: indexName,
    });

    if (!indexExists) {
      this.logger.log('Creating articles index');
      await this.elasticsearchService.indices.create({
        index: indexName,
        body: {
          mappings: {
            properties: {
              number: { type: 'text' },
              text: { type: 'text' },
              citing_cases: { type: 'integer' },
              name: {
                type: 'text',
                fields: {
                  keyword: { type: 'keyword' }, // For exact matching
                },
              },
              resource: { type: 'text' },
              name_lemma: { type: 'text' }, // Lemmatized field
              text_lemma: { type: 'text' }, // Lemmatized field
            },
          },
        },
      });
      this.logger.log(`Index created: ${indexName}`);
    } else {
      this.logger.log(`Index already exists: ${indexName}`);
    }
  }

  public async searchArticlesByNumber(filter: FilterArticlesQueryDto) {
    const { searchTerm } = filter;
    const extractedSearchTerm = searchTerm?.match(/(\d+[a-zA-Z]?)/)?.[0];
    const sort: any = [{ citing_cases: { order: 'desc' } }];
    this.logger.log(`Searching articles by number: ${extractedSearchTerm}`);
    const firstQuery: any = {
      bool: {
        must: [
          {
            multi_match: {
              query: extractedSearchTerm,
              fields: ['number'],
            },
          },
        ],
      },
    };
    const firstQueryResult = await this.elasticsearchService.search({
      index: 'articles',
      body: {
        query: firstQuery,
        sort,
        from: 0,
        size: 1000,
      },
    });

    const firstQueryHits = firstQueryResult.hits.hits.map((hit) => hit._source);

    let lemmatizedSearchTerm = '';

    if (firstQueryHits.length > 0 && firstQueryHits[0]['name']) {
      lemmatizedSearchTerm = await this.lemmatizeText(
        firstQueryHits[0]['name'],
      );
    }

    const secondQuery: any = {
      bool: {
        must: [
          {
            multi_match: {
              query: lemmatizedSearchTerm || extractedSearchTerm,
              fields: ['name', 'name_lemma', 'name.keyword'],
              type: 'phrase',
            },
          },
        ],
      },
    };
    const secondQueryResult = await this.elasticsearchService.search({
      index: 'articles',
      body: {
        query: secondQuery,
        sort,
        from: 0,
        size: 4000,
      },
    });

    const secondQueryHits = secondQueryResult.hits.hits.map(
      (hit) => hit._source,
    );

    const thirdQuery: any = {
      bool: {
        must: [
          {
            multi_match: {
              query: `Artikel ${extractedSearchTerm}`,
              fields: ['text', 'text_lemma'],
              type: 'phrase',
            },
          },
        ],
      },
    };

    const thirdQueryResult = await this.elasticsearchService.search({
      index: 'articles',
      body: {
        query: thirdQuery,
        sort,
        from: 0,
        size: 1000,
      },
    });

    const thirdQueryHits = thirdQueryResult.hits.hits
      .map((hit) => hit._source)
      .sort((a, b) => {
        const aHasName = a['name'] ? 1 : 0;
        const bHasName = b['name'] ? 1 : 0;
        return bHasName - aHasName;
      });

    const combinedResults = [
      ...new Map(
        [...firstQueryHits, ...secondQueryHits, ...thirdQueryHits].map(
          (item) => [item['number'], item],
        ),
      ).values(),
    ];

    const total = combinedResults.length;
    const from = filter.skip || 0;
    const size = filter.limit || 10;
    const paginatedResults = combinedResults.slice(from, from + size);

    return {
      articles: paginatedResults,
      total,
    };
  }

  async searchArticles(filter: FilterArticlesQueryDto) {
    // Trim the search term
    let trimmedSearchTerm = filter.searchTerm?.trim();

    let searchFieldsPass = [];

    const caseNumberPattern =
      /^(?:\d+\s*,?\s*\d+\s*BVerfGE|BVerfGE\s*\d+\s*,?\s*\d+)$/i;

    if (caseNumberPattern.test(trimmedSearchTerm)) {
      trimmedSearchTerm = normalizeCaseNumber(trimmedSearchTerm);
    }

    if (filter.name)
      searchFieldsPass.push('name', 'name_lemma', 'name.keyword');
    if (filter.text) searchFieldsPass.push('text', 'text_lemma');

    this.logger.log(`Search fields: ${searchFieldsPass}`);

    if (searchFieldsPass.length === 0) {
      searchFieldsPass = [
        'name',
        'name_lemma',
        'name.keyword',
        'text',
        'text_lemma',
      ];
    }

    const textFieldsQuery: any = {
      bool: {
        must: [],
      },
    };

    // If not an article number, perform lemmatized search
    if (trimmedSearchTerm) {
      const lemmatizedSearchTerm = await this.lemmatizeText(trimmedSearchTerm);

      textFieldsQuery.bool = {
        should: [
          {
            multi_match: {
              query: trimmedSearchTerm,
              fields: searchFieldsPass,
              boost: 2,
              type: 'phrase',
            },
          },
          {
            multi_match: {
              query: lemmatizedSearchTerm,
              fields: searchFieldsPass,
              type: 'phrase',
            },
          },
        ],
      };
    }

    // Apply sorting (e.g., by citing_cases in descending order)
    const sort: any = [{ citing_cases: { order: 'desc' } }];

    // Pagination: skip and limit
    const from = filter.skip || 0;
    const size = filter.limit || 10;

    const result = await this.elasticsearchService.search({
      index: 'articles',
      body: {
        query: textFieldsQuery,
        sort,
        _source: {
          excludes: ['name_lemma', 'text_lemma'], // Exclude these fields from the response
        },
      },
      from,
      size,
    });

    // Return the paginated results and total count
    return {
      articles: result.hits.hits.map((hit) => hit._source),
      total: result.hits.total['value'], // Use value for total hits
    };
  }

  public async getTopCitedArticles() {
    this.logger.log('Fetching top cited articles');

    const query = `MATCH (a:Article)-[:IS_NAMED]->(n:Name) RETURN a, n.short AS articleName, elementId(a) AS elementId
       ORDER BY a.citing_cases DESC LIMIT 10`;

    try {
      const records = await this.neo4jService.runQuery(query);
      const articles = records.map((record) => {
        const article = record.get('a').properties;
        const articleId = record.get('elementId');
        const name = record.get('articleName');
        return { ...article, name, id: articleId };
      });

      return articles;
    } catch (error) {
      this.logger.error('Failed to fetch top-cited articles', error.stack);
      throw new Error(`Failed to fetch top-cited articles: ${error.message}`);
    }
  }

  // Function to get filtered articles
  public async getFilteredArticles(filter: FilterArticlesQueryDto) {
    const { query, params } = this.prepareFilterQuery(filter, false);

    try {
      const result = await this.neo4jService.runQuery(query, params); // Use runQuery from neo4jService
      const articles = result.map((record) => {
        const article = record.get('a').properties;
        const name = record.get('name');
        const articleId = record.get('elementId');
        return { ...article, name, id: articleId };
      });
      return articles;
    } catch (error) {
      this.logger.error('Failed to fetch articles', error.stack);
      throw new Error(`Failed to fetch articles: ${error.message}`);
    }
  }

  // Function to get filtered articles count
  async getFilteredArticlesCount(
    filter: FilterArticlesQueryDto,
  ): Promise<number> {
    const { query, params } = this.prepareFilterQuery(filter, true);

    try {
      const result = await this.neo4jService.runQuery(query, params); // Use runQuery from neo4jService
      return result[0].get('count').low;
    } catch (error) {
      throw new Error(`Failed to fetch article count: ${error.message}`);
    }
  }

  private prepareFilterQuery(
    filter: FilterArticlesQueryDto,
    isCountQuery: boolean,
  ): { query: string; params: Record<string, any> } {
    const { searchTerm, skip = 0, limit = 10, name, number, text } = filter;
    const trimmedSearchTerm = searchTerm?.trim().toLowerCase();
    const extractedSearchTerm = trimmedSearchTerm?.match(/(\d+[a-zA-Z]?)/)?.[0];

    let query = name
      ? 'MATCH (a:Article)-[:IS_NAMED]->(n:Name) '
      : 'MATCH (a:Article) ';

    if (isCountQuery) {
      query += 'RETURN count(a) AS count';
    } else {
      query += 'RETURN a, n.short AS name';
      if (limit > 0) {
        query += ` SKIP ${skip} LIMIT ${limit}`;
      }
    }

    const params: Record<string, any> = {};

    // Build additional filtering conditions
    if (name) {
      query += ' WHERE n.short = $name';
      params.name = name;
    }
    if (number) {
      query += ' AND a.number = $number';
      params.number = number;
    }
    if (text) {
      query += ' AND a.text CONTAINS $text';
      params.text = text;
    }
    if (trimmedSearchTerm) {
      query += ` AND (toLower(a.number) = "${extractedSearchTerm}" OR toLower(n.short) CONTAINS $searchTerm OR toLower(a.text) CONTAINS $searchTerm)`;
    }

    return { query, params };
  }
}
