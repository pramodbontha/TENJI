import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { FilterReferencesQueryDto } from './dto/filter-references-query.dto';
import { Neo4jService } from 'src/neo4j/neo4j.service';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import axios from 'axios';
import { getSearchTerms, normalizeCaseNumber } from 'src/utils/helpers';

@Injectable()
export class ReferencesService implements OnModuleInit {
  private readonly logger = new Logger(ReferencesService.name);

  constructor(
    private readonly neo4jService: Neo4jService,
    private readonly elasticsearchService: ElasticsearchService,
  ) {}

  async onModuleInit() {
    // Trigger the data sync on module initialization
    await this.syncReferencesToElasticSearch();
  }

  // Call the Python spaCy service to lemmatize text
  private async lemmatizeText(text: string): Promise<string> {
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

  private async syncReferencesToElasticSearch() {
    this.logger.log('Syncing references to ElasticSearch');

    this.logger.log('Checking index');
    await this.createIndex();
    const { count } = await this.elasticsearchService.count({
      index: 'references',
    });
    if (count === 0) {
      const query = `
      MATCH (r:Reference) 
      OPTIONAL MATCH (r)-[:MENTIONS]->(a:Article) 
      OPTIONAL MATCH (r)-[:MENTIONS]->(c:Case)
      RETURN r, id(r) AS referenceId
    `;

      const result = await this.neo4jService.runQuery(query);

      const references = [];

      for (const record of result) {
        const referenceData = record.get('r').properties;
        const referenceId = record.get('referenceId');

        // No need to lemmatize fields during indexing.
        // Just index the original fields in Elasticsearch.

        const referenceToIndex = {
          ...referenceData, // Store original reference name and other fields
          referenceId,
        };

        references.push(referenceToIndex);
        await this.elasticsearchService.index({
          index: 'references',
          id: referenceToIndex.referenceId,
          body: referenceToIndex,
        });
      }

      this.logger.log(
        `${references.length} references indexed in Elasticsearch.`,
      );
      this.logger.log('Lemmatizing references');
      await this.lemmatizeReferences();
    }
  }

  private async lemmatizeReferences() {
    try {
      await axios.get('http://lemmatizer:5000/lemmatize-references');
    } catch (error) {
      this.logger.error('Failed to lemmatize references', error.stack);
    }
  }

  async createIndex() {
    const indexName = 'references';
    const indexExists = await this.elasticsearchService.indices.exists({
      index: indexName,
    });

    if (!indexExists) {
      this.logger.log('Creating index');
      await this.elasticsearchService.indices.create({
        index: indexName,
        body: {
          mappings: {
            properties: {
              context: {
                type: 'text',
                fields: {
                  keyword: { type: 'keyword' }, // For exact matching
                },
              },
              text: {
                type: 'text',
                fields: {
                  keyword: { type: 'keyword' }, // For exact matching
                },
              },
              next_toc: { type: 'text' }, // Used for the 'next_toc' logic
              id: { type: 'keyword' },
              resource: { type: 'keyword' },
              context_lemma: {
                type: 'text',
                fields: {
                  keyword: { type: 'keyword' }, // For exact matching
                },
              }, // Lemmatized field
              text_lemma: {
                type: 'text',
                fields: {
                  keyword: { type: 'keyword' }, // For exact matching
                },
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

  private checkAndFormateCaseNumber(searchTerm: string) {
    const caseNumberPattern =
      /^(?:\d+\s*,?\s*\d+\s*BVerfGE|BVerfGE\s*\d+\s*,?\s*\d+)$/i;
    if (caseNumberPattern.test(searchTerm.trim())) {
      const normalizedCaseNumber = normalizeCaseNumber(searchTerm);
      return normalizedCaseNumber.replace(
        /BVerfGE(\d+),(\d+)/,
        'BVerfGE $1, $2',
      );
    } else {
      return searchTerm;
    }
  }

  public async searchReferences(filter: FilterReferencesQueryDto) {
    let lemmatizedSearchTerm = filter.searchTerm;

    if (filter.searchTerm) {
      lemmatizedSearchTerm = await this.lemmatizeText(filter.searchTerm);
    }

    const query: any = {
      bool: {
        must: [],
        filter: [],
      },
    };
    const searchFields = [];

    if (filter.context) searchFields.push('context');
    if (filter.text) searchFields.push('text');

    if (
      filter.searchTerm &&
      lemmatizedSearchTerm &&
      lemmatizedSearchTerm.trim() !== ''
    ) {
      const searchTerms = getSearchTerms(filter.searchTerm);
      const filteredTerms = searchTerms.filter(
        (term) => !term.startsWith('BVerfGE') && !term.startsWith('Art.'),
      );
      this.logger.log(`Search terms: ${searchTerms}`);
      query.bool = {
        should: [
          {
            multi_match: {
              query: this.checkAndFormateCaseNumber(searchTerms[0]),
              fields: ['text'],
              type: 'phrase',
              boost: 6,
            },
          },
          {
            multi_match: {
              query: this.checkAndFormateCaseNumber(searchTerms[0]),
              fields: ['text', 'context'],
              type: 'phrase',
              boost: 3,
            },
          },
          {
            multi_match: {
              query: filteredTerms.join(' '),
              fields: ['text', 'context'],
              boost: 2,
            },
          },
          {
            multi_match: {
              query: lemmatizedSearchTerm.trim(),
              fields: ['context', 'context_lemma', 'text', 'text_lemma'],
            },
          },
        ],
      };
    } else {
      query.bool.must.push({
        match_all: {},
      });
    }

    if (filter.resources) {
      query.bool.filter.push({
        terms: {
          resource: filter.resources,
        },
      });
    }

    const from = filter.skip || 0;
    const size = filter.limit || 10;

    this.logger.log(
      `Searching references with query: ${JSON.stringify(query)}`,
    );

    // Perform search with built query
    const result = await this.elasticsearchService.search({
      index: 'references', // Adjust to your index name
      body: {
        query,
      },
      from,
      size,
    });

    return {
      references: result.hits.hits.map((hit) => hit._source),
      total: result.hits.total['value'], // Use value for total hits
    };
  }

  public async getResources() {
    this.logger.log('Fetching resources');

    const query = `MATCH (n:Reference) RETURN DISTINCT n.resource AS resource`;

    try {
      const records = await this.neo4jService.runQuery(query);

      const resources = records.map((record) => {
        return record.get('resource');
      });

      return resources;
    } catch (error) {
      this.logger.error('Failed to fetch resources', error.stack);
      throw new Error(`Failed to fetch resources: ${error.message}`);
    }
  }

  public async getSectionReferences(sectionId: string) {
    this.logger.log(sectionId);
    const splitString = sectionId.split(' > ');

    // Remove the last element
    splitString.pop();

    // Join the remaining parts back together
    const nextToc = splitString.join(' > ');
    this.logger.log(nextToc);

    const query = `MATCH (n:Reference)
         
         where n.id contains $sectionId
          
         RETURN n`;

    const params = { sectionId, nextToc };
    const result = await this.neo4jService.runQuery(query, params);

    return result.map((record) => record.get('n').properties);
    // const query = {
    //   index: 'references',
    //   body: {
    //     query: {
    //       bool: {
    //         should: [
    //           {
    //             match: {
    //               context: {
    //                 query: sectionId,
    //                 operator: 'and', // Ensure all terms match
    //               },
    //             },
    //           },
    //           {
    //             term: { id: sectionId }, // Exact match for the id field
    //           },
    //           {
    //             match: {
    //               next_toc: {
    //                 query: nextToc,
    //                 operator: 'and', // Ensure all terms match
    //               },
    //             },
    //           },
    //         ],
    //       },
    //     },
    //   },
    // };

    // // Execute the query
    // const result = await this.elasticsearchService.search(query);

    // // Map the results to return the document properties
    // return result.hits.hits.map((hit) => hit._source);
  }
}
