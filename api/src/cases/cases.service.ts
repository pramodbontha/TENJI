import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Neo4jService } from 'src/neo4j/neo4j.service';
import { FilterCasesQueryDto } from './dto/filter-cases-query.dto';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import axios from 'axios';
import { normalizeCaseNumber } from 'src/utils/helpers';

@Injectable()
export class CasesService implements OnModuleInit {
  private readonly logger = new Logger(CasesService.name);

  constructor(
    private readonly neo4jService: Neo4jService,
    private readonly elasticsearchService: ElasticsearchService,
  ) {}

  async onModuleInit() {
    // Trigger the data sync on module initialization
    await this.syncCasesToElasticSearch();
  }

  async syncCasesToElasticSearch() {
    this.logger.log('Syncing cases to ElasticSearch');

    this.logger.log('Checking index');
    await this.createIndex();

    const { count } = await this.elasticsearchService.count({
      index: 'cases',
    });

    if (count === 0) {
      const query = `
      MATCH (c:Case) 
      OPTIONAL MATCH (c:Case)-[:IS_NAMED]->(n:Name)
      RETURN id(c) AS caseId, c, n.short AS caseName
    `;

      const result = await this.neo4jService.runQuery(query);

      const cases = [];

      for (const record of result) {
        const caseData = record.get('c').properties;
        const caseId = record.get('caseId');

        const caseName = record.get('caseName') ?? '';

        const caseToIndex = {
          ...caseData,
          citing_cases: caseData.citing_cases.low,
          caseName,
        };

        cases.push(caseToIndex);

        await this.elasticsearchService.index({
          index: 'cases',
          id: caseId,
          body: caseToIndex,
        });
      }

      this.logger.log(`${cases.length} cases indexed in Elasticsearch.`);

      this.logger.log('Lemmatizing cases');
      await this.lemmatizeCases();
    }
  }

  private async lemmatizeCases() {
    try {
      await axios.get('http://lemmatizer:5000/lemmatize-cases');
    } catch (error) {
      this.logger.error('Failed to lemmatize cases', error.stack);
    }
  }

  async createIndex() {
    const indexName = 'cases';

    const indexExists = await this.elasticsearchService.indices.exists({
      index: indexName,
    });

    if (!indexExists) {
      this.logger.log(`Creating index: ${indexName}`);
      await this.elasticsearchService.indices.create({
        index: indexName,
        body: {
          mappings: {
            properties: {
              caseName: { type: 'text' },
              number: { type: 'text' },
              judgment: { type: 'text' },
              facts: { type: 'text' },
              reasoning: { type: 'text' },
              headnotes: { type: 'text' },
              year: { type: 'integer' },
              decision_type: { type: 'text' },
              citing_cases: {
                type: 'integer',
              },
            },
          },
        },
      });
      this.logger.log(`Index created: ${indexName}`);
    } else {
      this.logger.log(`Index already exists: ${indexName}`);
    }
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

  async searchCasesByNumber(filter: FilterCasesQueryDto) {
    const { searchTerm: caseNumber, startYear, endYear, decisionType } = filter;
    const searchFieldsPass = [];
    let isFiltersEmpty = true;
    const normalizedCaseNumber = normalizeCaseNumber(caseNumber);
    if (filter.judgment) searchFieldsPass.push('judgment', 'judgment_lemma');
    if (filter.facts) searchFieldsPass.push('facts', 'facts_lemma');
    if (filter.reasoning) searchFieldsPass.push('reasoning', 'reasoning_lemma');
    if (filter.headnotes) searchFieldsPass.push('headnotes', 'headnotes_lemma');
    const sort: any = [{ citing_cases: { order: 'desc' } }];
    this.logger.log(`normalizedCaseNumber: ${normalizedCaseNumber}`);

    if (searchFieldsPass.length === 0) {
      searchFieldsPass.push(
        'judgment',
        'judgment_lemma',
        'facts',
        'facts_lemma',
        'reasoning',
        'reasoning_lemma',
        'headnotes',
        'headnotes_lemma',
      );
    } else if (searchFieldsPass.length > 0) {
      isFiltersEmpty = false;
    }

    // Year range filter
    const yearRangeFilter =
      startYear || endYear
        ? {
            range: {
              year: {
                ...(startYear && { gte: startYear }),
                ...(endYear && { lte: endYear }),
              },
            },
          }
        : null;

    // Decision type filter
    const decisionTypeFilter =
      decisionType && decisionType.length > 0
        ? {
            terms: {
              decision_type: decisionType,
            },
          }
        : null;

    const firstQuery: any = {
      bool: {
        must: {
          multi_match: {
            query: normalizedCaseNumber,
            fields: ['number'],
            boost: 2,
          },
        },
        filter: [yearRangeFilter, decisionTypeFilter].filter(Boolean),
      },
    };

    const firstQueryResult = await this.elasticsearchService.search({
      index: 'cases',
      body: {
        query: firstQuery,
        sort,
        from: 0,
        size: 1000,
      },
    });

    const firstQueryHits = firstQueryResult.hits.hits.map((hit) => hit._source);

    const secondQuery: any = {
      bool: {
        must: {
          multi_match: {
            query: normalizedCaseNumber.replace(
              /BVerfGE(\d+),(\d+)/,
              'BVerfGE $1, $2',
            ),
            fields: searchFieldsPass,
            type: 'phrase',
          },
        },
        filter: [yearRangeFilter, decisionTypeFilter].filter(Boolean),
      },
    };

    const secondQueryResult = await this.elasticsearchService.search({
      index: 'cases',
      body: {
        query: secondQuery,
        sort,
        from: 0,
        size: 4000,
      },
    });

    const secondQueryHits = secondQueryResult.hits.hits
      .map((hit) => hit._source)
      .sort((a, b) => {
        const aHasName = a['caseName'] ? 1 : 0;
        const bHasName = b['caseName'] ? 1 : 0;
        return bHasName - aHasName;
      });

    let combinedResults = [];
    if (isFiltersEmpty) {
      combinedResults = [
        ...new Map(
          [...firstQueryHits, ...secondQueryHits].map((item) => [
            item['number'],
            item,
          ]),
        ).values(),
      ];
    } else {
      combinedResults = [
        ...new Map(
          [...secondQueryHits, ...firstQueryHits].map((item) => [
            item['number'],
            item,
          ]),
        ).values(),
      ];
    }

    const total = combinedResults.length;
    const from = filter.skip || 0;
    const size = filter.limit || 10;
    const paginatedResults = combinedResults.slice(from, from + size);

    return {
      cases: paginatedResults,
      total,
    };
  }

  async searchCases(filter: FilterCasesQueryDto) {
    const { searchTerm, startYear, endYear, decisionType } = filter;
    let isFiltersEmpty = true;
    const caseNumberPattern =
      /^(?:\d+\s*,?\s*\d+\s*BVerfGE|BVerfGE\s*\d+\s*,?\s*\d+)$/i;

    const searchFieldsPass = [];
    let updatedSearchTerm = searchTerm;
    if (searchTerm && caseNumberPattern.test(searchTerm.trim())) {
      updatedSearchTerm = normalizeCaseNumber(searchTerm).replace(
        /BVerfGE(\d+),(\d+)/,
        'BVerfGE $1, $2',
      );
    }

    // Build search fields based on selected boolean filters
    if (filter.judgment) searchFieldsPass.push('judgment', 'judgment_lemma');
    if (filter.facts) searchFieldsPass.push('facts', 'facts_lemma');
    if (filter.reasoning) searchFieldsPass.push('reasoning', 'reasoning_lemma');
    if (filter.headnotes) searchFieldsPass.push('headnotes', 'headnotes_lemma');

    const sort: any = [{ citing_cases: { order: 'desc' } }];

    const lemmatizedSearchTerm = await this.lemmatizeText(updatedSearchTerm);

    // If no specific fields are selected, search across all fields in the second pass
    if (searchFieldsPass.length === 0) {
      searchFieldsPass.push(
        'number',
        'judgment',
        'judgment_lemma',
        'facts',
        'facts_lemma',
        'reasoning',
        'reasoning_lemma',
        'headnotes',
        'headnotes_lemma',
      );
    } else if (searchFieldsPass.length > 0) {
      isFiltersEmpty = false;
    }

    let searchResults = [];

    // Year range filter
    const yearRangeFilter =
      startYear || endYear
        ? {
            range: {
              year: {
                ...(startYear && { gte: startYear }),
                ...(endYear && { lte: endYear }),
              },
            },
          }
        : null;

    // Decision type filter
    const decisionTypeFilter =
      decisionType && decisionType.length > 0
        ? {
            terms: {
              decision_type: decisionType,
            },
          }
        : null;

    if (searchTerm) {
      const baseFilter = {
        bool: {
          filter: [] as any[],
        },
      };
      if (yearRangeFilter) baseFilter.bool.filter.push(yearRangeFilter);
      if (decisionTypeFilter) baseFilter.bool.filter.push(decisionTypeFilter);
      const firstQuery: any = {
        ...baseFilter,
        bool: {
          ...baseFilter.bool,
          should: [
            {
              multi_match: {
                query: updatedSearchTerm.trim(),
                fields: ['caseName', 'name_lemma'],
                type: 'phrase',
                boost: 10,
              },
            },
            {
              multi_match: {
                query: lemmatizedSearchTerm,
                fields: ['caseName', 'name_lemma'],
                type: 'phrase',
              },
            },
          ],
        },
      };

      const firstQueryResult = await this.elasticsearchService.search({
        index: 'cases',
        body: {
          query: firstQuery,
          sort: sort,
        },
        from: 0,
        size: 4000,
      });

      const firstQueryHits = firstQueryResult.hits.hits
        .map((hit) => hit._source)
        .sort((a, b) => {
          const aHasName = a['caseName'] ? 1 : 0;
          const bHasName = b['caseName'] ? 1 : 0;
          return bHasName - aHasName;
        });
      const secondQuery: any = {
        ...baseFilter,
        bool: {
          ...baseFilter.bool,
          should: [
            {
              multi_match: {
                query: updatedSearchTerm.trim(),
                fields: searchFieldsPass,
                type: 'phrase',
                boost: 10,
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
        },
      };

      const secondQueryResult = await this.elasticsearchService.search({
        index: 'cases',
        body: {
          query: secondQuery,
          sort: sort,
        },
        from: 0,
        size: 4000,
      });

      const secondQueryHits = secondQueryResult.hits.hits
        .map((hit) => hit._source)
        .sort((a, b) => {
          const aHasName = a['caseName'] ? 1 : 0;
          const bHasName = b['caseName'] ? 1 : 0;
          return bHasName - aHasName;
        });

      let combinedResults = [];
      if (isFiltersEmpty) {
        combinedResults = [
          ...firstQueryHits,
          ...secondQueryHits.filter(
            (item) =>
              !firstQueryHits.some((hit) => hit['number'] === item['number']),
          ),
        ];
      } else {
        combinedResults = [
          ...secondQueryHits,
          ...firstQueryHits.filter(
            (item) =>
              !firstQueryHits.some((hit) => hit['number'] === item['number']),
          ),
        ];
      }

      const total = combinedResults.length;
      const from = filter.skip || 0;
      const size = filter.limit || 10;
      const paginatedResults = combinedResults.slice(from, from + size);

      // Return the final results with proper pagination
      return {
        cases: paginatedResults,
        total, // Total number of combined results
      };
    } else {
      // If no searchTerm is provided, we should still return results based on filters
      const filterQuery: any = {
        bool: {
          must: [],
          filter: [],
        },
      };

      // Apply filters if available
      if (yearRangeFilter) filterQuery.bool.filter.push(yearRangeFilter);
      if (decisionTypeFilter) filterQuery.bool.filter.push(decisionTypeFilter);

      // If no searchTerm, we fallback to match_all
      filterQuery.bool.must.push({
        match_all: {},
      });

      const from = filter.skip || 0;
      const size = filter.limit || 10;

      this.logger.log(
        `Filter query (no search term): ${JSON.stringify(filterQuery)}`,
      );

      // Execute search when no searchTerm is provided, but filters are used
      const filterResult = await this.elasticsearchService.search({
        index: 'cases',
        body: {
          query: filterQuery,
        },
        from,
        size,
      });

      searchResults = filterResult.hits.hits.map((hit) => hit._source);
      return {
        cases: searchResults,
        total: filterResult.hits.total['value'], // Use value for total hits, // Total number of combined results
      };
    }

    // Combine and deduplicate results based on IDs
  }

  public async getTopCitedCases() {
    this.logger.log('Fetching top-cited cases');

    const query = `
            MATCH (c:Case)-[:IS_NAMED]->(n:Name)
            RETURN c, n.short AS caseName, elementId(c) AS elementId
            ORDER BY c.citing_cases DESC
            LIMIT 10
        `;

    try {
      const records = await this.neo4jService.runQuery(query);

      const cases = records.map((record) => {
        const caseData = record.get('c').properties; // Changed from 'case' to 'caseData'
        const caseId = record.get('elementId');
        const caseName = record.get('caseName');
        return { ...caseData, caseName, id: caseId };
      });

      return cases;
    } catch (error) {
      this.logger.error('Failed to fetch top-cited cases', error.stack);
      throw new Error(`Failed to fetch top-cited cases: ${error.message}`);
    }
  }

  public async getDecisionTypes() {
    this.logger.log('Fetching decision types');

    const query = `
            MATCH (c:Case)
            RETURN DISTINCT c.decision_type AS decisionType
        `;

    try {
      const records = await this.neo4jService.runQuery(query);

      const decisionTypes = records.map((record) => {
        return record.get('decisionType');
      });

      return decisionTypes;
    } catch (error) {
      this.logger.error('Failed to fetch decision types', error.stack);
      throw new Error(`Failed to fetch decision types: ${error.message}`);
    }
  }
}
