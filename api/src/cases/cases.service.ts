import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Neo4jService } from 'src/neo4j/neo4j.service';
import { FilterCasesQueryDto } from './dto/filter-cases-query.dto';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import axios from 'axios';
import { getSearchTerms, normalizeCaseNumber } from 'src/utils/helpers';

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
              caseName: {
                type: 'text',
                fields: {
                  keyword: { type: 'keyword' }, // For exact matching
                },
              },
              number: { type: 'text' },
              judgment: {
                type: 'search_as_you_type',
              },
              facts: {
                type: 'search_as_you_type',
              },
              reasoning: {
                type: 'search_as_you_type',
              },
              headnotes: {
                type: 'search_as_you_type',
              },
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
    const { searchTerm, startYear, endYear, decisionType } = filter;
    const searchFieldsPass = [];
    const searchTerms = getSearchTerms(searchTerm);
    let isFiltersEmpty = true;
    const normalizedCaseNumber = normalizeCaseNumber(searchTerms[0]);
    if (filter.judgment)
      searchFieldsPass.push('judgment', 'judgment_lemma', 'judgment.keyword');
    if (filter.facts)
      searchFieldsPass.push('facts', 'facts_lemma', 'facts.keyword');
    if (filter.reasoning)
      searchFieldsPass.push(
        'reasoning',
        'reasoning_lemma',
        'reasoning.keyword',
      );
    if (filter.headnotes)
      searchFieldsPass.push(
        'headnotes',
        'headnotes_lemma',
        'headnotes.keyword',
      );
    const sort: any = [{ citing_cases: { order: 'desc' } }];
    this.logger.log(`normalizedCaseNumber: ${normalizedCaseNumber}`);

    const secondSearchTerm = searchTerms
      .filter((element) => !element.startsWith('BVerfGE'))
      .join(' ');

    if (searchFieldsPass.length === 0) {
      searchFieldsPass.push(
        'name',
        'name_lemma',
        'judgment',
        'judgment_lemma',
        'facts',
        'facts_lemma',
        'reasoning',
        'reasoning_lemma',
        'headnotes',
        'headnotes_lemma',
        'judgment.keyword',
        'facts.keyword',
        'reasoning.keyword',
        'headnotes.keyword',
        'name.keyword',
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

    const thirdQuery: any = {
      bool: {
        must: {
          multi_match: {
            query: secondSearchTerm,
            fields: searchFieldsPass,
          },
        },
        filter: [yearRangeFilter, decisionTypeFilter].filter(Boolean),
      },
    };
    const thirdQueryResult = await this.elasticsearchService.search({
      index: 'cases',
      body: {
        query: thirdQuery,
        sort,
        from: 0,
        size: 4000,
      },
    });

    const thirdQueryHits = thirdQueryResult.hits.hits
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
          [...firstQueryHits, ...secondQueryHits, ...thirdQueryHits].map(
            (item) => [item['number'], item],
          ),
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
    if (filter.judgment)
      searchFieldsPass.push('judgment', 'judgment_lemma', 'judgment.keyword');
    if (filter.facts)
      searchFieldsPass.push('facts', 'facts_lemma', 'facts.keyword');
    if (filter.reasoning)
      searchFieldsPass.push(
        'reasoning',
        'reasoning_lemma',
        'reasoning.keyword',
      );
    if (filter.headnotes)
      searchFieldsPass.push(
        'headnotes',
        'headnotes_lemma',
        'headnotes.keyword',
      );

    const sort: any = [{ citing_cases: { order: 'desc' } }];

    const lemmatizedSearchTerm = await this.lemmatizeText(updatedSearchTerm);

    // If no specific fields are selected, search across all fields in the second pass
    if (searchFieldsPass.length === 0) {
      searchFieldsPass.push(
        'number',
        'caseName',
        'judgment',
        'judgment_lemma',
        'facts',
        'facts_lemma',
        'reasoning',
        'reasoning_lemma',
        'headnotes',
        'headnotes_lemma',
        'name.keyword',
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
                fields: ['caseName', 'caseName.keyword'],
                type: 'phrase',
                boost: 10,
              },
            },
            {
              multi_match: {
                query: lemmatizedSearchTerm,
                fields: ['caseName.keyword'],
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
      this.logger.log(`First query: ${JSON.stringify(firstQuery)}`);
      const firstQueryHits = firstQueryResult.hits.hits
        .map((hit) => hit._source)
        .sort((a, b) => {
          const aHasName = a['caseName'] ? 1 : 0;
          const bHasName = b['caseName'] ? 1 : 0;
          return bHasName - aHasName;
        });
      this.logger.log(
        `First query hits: ${JSON.stringify(firstQueryHits.length)}`,
      );
      this.logger.log(getSearchTerms(updatedSearchTerm.trim()));
      const secondQuery: any = {
        ...baseFilter,
        bool: {
          ...baseFilter.bool,
          should: getSearchTerms(updatedSearchTerm.trim()) // Ignore terms with less than 3 words
            .map((term) => {
              const isLongPhrase = term.split(' ').length > 3;
              return {
                multi_match: {
                  query: term, // No need to wrap in quotes
                  fields: searchFieldsPass,
                  type: 'bool_prefix', // Enables search-as-you-type behavior
                  boost: isLongPhrase ? 100 : 1, // Higher boost for longer phrases
                },
              };
            }),
          minimum_should_match: 1, // At least one term must match
        },
      };

      this.logger.log(`Second query: ${JSON.stringify(secondQuery)}`);

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

      const exactMatchQuery: any = {
        query: {
          bool: {
            should: [
              {
                multi_match: {
                  query: updatedSearchTerm.trim(),
                  fields: ['judgment', 'headnotes'],
                  type: 'bool_prefix', // For partial matches in these fields
                },
              },
              {
                match_phrase: {
                  reasoning: updatedSearchTerm.trim(), // Exact phrase match for reasoning
                },
              },
              {
                match_phrase: {
                  facts: updatedSearchTerm.trim(), // Exact phrase match for headnotes
                },
              },
            ],
          },
        },
      };

      const exactMatchResults = await this.elasticsearchService.search({
        index: 'cases',
        body: exactMatchQuery,
      });
      const exactMatchHits = exactMatchResults.hits.hits.map(
        (hit) => hit._source,
      );

      this.logger.log(
        `Exact match hits: ${JSON.stringify(exactMatchHits.length)}`,
      );
      exactMatchHits.forEach((hit) => {
        this.logger.log(hit['caseName']);
      });
      let combinedResults = [];
      if (isFiltersEmpty) {
        if (updatedSearchTerm.split(' ').length > 3) {
          combinedResults = [
            ...new Map(
              [...exactMatchHits, ...firstQueryHits, ...secondQueryHits].map(
                (item) => [item['number'], item],
              ),
            ).values(),
          ];
        } else {
          combinedResults = [
            ...new Map(
              [...firstQueryHits, ...exactMatchHits, ...secondQueryHits].map(
                (item) => [item['number'], item],
              ),
            ).values(),
          ];
        }
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
