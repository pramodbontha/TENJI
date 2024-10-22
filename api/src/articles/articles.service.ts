import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Neo4jService } from 'src/neo4j/neo4j.service';
import { FilterArticlesQueryDto } from './dto/filter-articles-query.dto';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import axios from 'axios';

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
          articleName, // Store original article name and other fields
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
              articleName: {
                type: 'text',
                fields: {
                  keyword: { type: 'keyword' }, // For exact matching
                },
              },
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

  async searchArticles(filter: FilterArticlesQueryDto) {
    // Trim the search term
    const trimmedSearchTerm = filter.searchTerm?.trim();

    // Extract the part of the search term that matches the number pattern
    const extractedSearchTerm = trimmedSearchTerm?.match(/(\d+[a-zA-Z]?)/)?.[0];

    const searchFields = [];

    const query: any = {
      bool: {
        must: [],
      },
    };

    // First, prioritize searching by name fields
    if (filter.name || (!filter.name && !filter.text && !extractedSearchTerm)) {
      // If `name` filter is provided or no filters are selected, search by name-related fields
      searchFields.push('articleName', 'name_lemma', 'articleName.keyword');
      if (trimmedSearchTerm) {
        const lemmatizedSearchTerm =
          await this.lemmatizeText(trimmedSearchTerm);
        console.log('Lemmatized search term:', lemmatizedSearchTerm);

        query.bool.must.push({
          multi_match: {
            query: lemmatizedSearchTerm || trimmedSearchTerm,
            fields: searchFields,
            fuzziness: 'AUTO',
            minimum_should_match: '70%',
          },
        });
      }
    }

    // Next, if a number-related search term is found and no name fields are searched
    if (extractedSearchTerm && !filter.name && !filter.text) {
      query.bool.must.push({
        match: { number: { query: extractedSearchTerm, fuzziness: 'AUTO' } },
      });
    }

    // If `text` filter is selected, add text fields for searching
    if (filter.text) {
      searchFields.push('text', 'text_lemma');
      if (trimmedSearchTerm) {
        query.bool.must.push({
          multi_match: {
            query: trimmedSearchTerm,
            fields: searchFields,
            fuzziness: 'AUTO',
            minimum_should_match: '70%',
          },
        });
      }
    }

    // Apply sorting (e.g., by citing_cases in descending order)
    const sort: any = [{ citing_cases: { order: 'desc' } }];

    // Pagination: skip and limit
    const from = filter.skip || 0;
    const size = filter.limit || 10;

    // Execute the search query with sorting and pagination
    this.logger.log(`Searching articles with query: ${JSON.stringify(query)}`);

    const result = await this.elasticsearchService.search({
      index: 'articles',
      body: {
        query,
        sort,
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
    const conditions: string[] = [];

    if (!trimmedSearchTerm && !name && !number && !text) {
      if (isCountQuery) {
        return { query: `${query} RETURN COUNT(a) AS count`, params: {} };
      }
      if (!name) {
        query += 'OPTIONAL MATCH (a)-[:IS_NAMED]->(n:Name) ';
      }
      return {
        query: `${query} RETURN a, n.short AS name, elementId(a) AS elementId ORDER BY a.citing_cases DESC SKIP $skip LIMIT $limit`,
        params: { skip, limit },
      };
    }

    if (trimmedSearchTerm && !name && !number && !text) {
      conditions.push(
        `a.number CONTAINS $extractedSearchTerm OR toLower(a.text) CONTAINS $trimmedSearchTerm`,
      );
    }

    if (number) {
      conditions.push(
        extractedSearchTerm
          ? `a.number CONTAINS $extractedSearchTerm`
          : `a.number CONTAINS $trimmedSearchTerm`,
      );
    }

    if (text) {
      conditions.push(`toLower(a.text) CONTAINS $trimmedSearchTerm`);
    }

    if (conditions.length > 0) {
      query += `WHERE ${conditions.join(' OR ')} `;
    }

    if (!name) {
      query += 'OPTIONAL MATCH (a)-[:IS_NAMED]->(n:Name) ';
    }

    if (name && trimmedSearchTerm) {
      query +=
        conditions.length === 0
          ? `WHERE toLower(n.short) CONTAINS $trimmedSearchTerm `
          : `OR toLower(n.short) CONTAINS $trimmedSearchTerm `;
    }

    if (isCountQuery) {
      query += 'RETURN COUNT(a) AS count';
    } else {
      query +=
        'RETURN a, n.short AS name, elementId(a) AS elementId SKIP $skip LIMIT $limit';
    }

    return {
      query,
      params: {
        searchTerm: trimmedSearchTerm,
        skip,
        limit,
        extractedSearchTerm,
      },
    };
  }
}
