import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Neo4jService } from 'src/neo4j/neo4j.service';
import { FilterCasesQueryDto } from './dto/filter-cases-query.dto';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import axios from 'axios';

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

  async searchCasesByNumber(caseNumber: string, skip = 0, limit = 10) {
    const result = await this.elasticsearchService.search({
      index: 'cases',
      body: {
        query: {
          match: { number: caseNumber },
        },
        from: skip,
        size: limit,
      },
    });
    return {
      cases: result.hits.hits.map((hit) => hit._source),
      total: result.hits.total['value'],
    };
  }

  async searchCases(filter: FilterCasesQueryDto) {
    const { searchTerm, startYear, endYear, decisionType } = filter;

    const searchFieldsFirstPass = ['caseName', 'name_lemma']; // First search in caseName and name_lemma
    const searchFieldsSecondPass = [];

    // Build search fields based on selected boolean filters
    if (filter.number) searchFieldsSecondPass.push('number');
    if (filter.judgment)
      searchFieldsSecondPass.push('judgment', 'judgment_lemma');
    if (filter.facts) searchFieldsSecondPass.push('facts', 'facts_lemma');
    if (filter.reasoning)
      searchFieldsSecondPass.push('reasoning', 'reasoning_lemma');
    if (filter.headnotes)
      searchFieldsSecondPass.push('headnotes', 'headnotes_lemma');

    const sort: any = [{ citing_cases: { order: 'desc' } }];

    const lemmatizedSearchTerm = await this.lemmatizeText(searchTerm);

    // If no specific fields are selected, search across all fields in the second pass
    if (searchFieldsSecondPass.length === 0) {
      searchFieldsSecondPass.push(
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
    }

    let firstPassResults = [];
    let secondPassResults = [];

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

    // If searchTerm exists, perform search in the appropriate fields
    if (searchTerm) {
      // First pass: Search only in caseName and name_lemma fields
      const firstPassQuery: any = {
        bool: {
          must: [
            {
              multi_match: {
                query: lemmatizedSearchTerm,
                fields: searchFieldsFirstPass,
                fuzziness: 'AUTO',
              },
            },
          ],
          filter: [],
        },
      };

      // Add year and decision type filters if applicable
      if (yearRangeFilter) firstPassQuery.bool.filter.push(yearRangeFilter);
      if (decisionTypeFilter)
        firstPassQuery.bool.filter.push(decisionTypeFilter);

      this.logger.log(`First pass query: ${JSON.stringify(firstPassQuery)}`);

      // Execute the first pass search
      const firstPassResult = await this.elasticsearchService.search({
        index: 'cases',
        body: {
          query: firstPassQuery,
          sort: sort,
        },
        from: 0, // Fetch all results in the first pass
        size: 1000, // Large batch to cover most cases
      });

      firstPassResults = firstPassResult.hits.hits.map((hit) => hit._source);

      // Second pass: Search in other fields
      const secondPassQuery: any = {
        bool: {
          must: [
            {
              multi_match: {
                query: lemmatizedSearchTerm,
                fields: searchFieldsSecondPass,
                fuzziness: 'AUTO',
              },
            },
          ],
          filter: [],
        },
      };

      // Add year and decision type filters to the second pass as well
      if (yearRangeFilter) secondPassQuery.bool.filter.push(yearRangeFilter);
      if (decisionTypeFilter)
        secondPassQuery.bool.filter.push(decisionTypeFilter);

      this.logger.log(`Second pass query: ${JSON.stringify(secondPassQuery)}`);

      // Execute the second pass search
      const secondPassResult = await this.elasticsearchService.search({
        index: 'cases',
        body: {
          query: secondPassQuery,
          sort: sort,
        },
        from: 0, // Fetch all results in the second pass
        size: 1000, // Large batch to cover most cases
      });

      secondPassResults = secondPassResult.hits.hits.map((hit) => hit._source);
      const combinedResults = [
        ...new Map(
          [...firstPassResults, ...secondPassResults].map((item) => [
            item.id,
            item,
          ]),
        ).values(),
      ];

      // Pagination logic applied after deduplication
      const total = combinedResults.length;
      const from = filter.skip || 0;
      const size = filter.limit || 10;
      const paginatedResults = combinedResults.slice(from, from + size); // Apply pagination after deduplication

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

      secondPassResults = filterResult.hits.hits.map((hit) => hit._source);
      return {
        cases: secondPassResults,
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
