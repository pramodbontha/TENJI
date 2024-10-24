import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { FilterReferencesQueryDto } from './dto/filter-references-query.dto';
import { Neo4jService } from 'src/neo4j/neo4j.service';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import axios from 'axios';

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
      RETURN r
    `;

      const result = await this.neo4jService.runQuery(query);

      const references = [];

      for (const record of result) {
        const referenceData = record.get('r').properties;

        // No need to lemmatize fields during indexing.
        // Just index the original fields in Elasticsearch.

        const referenceToIndex = {
          ...referenceData, // Store original reference name and other fields
          // Add more fields to index here
        };

        references.push(referenceToIndex);
        await this.elasticsearchService.index({
          index: 'references',
          id: referenceToIndex.id,
          body: referenceToIndex,
        });
      }

      this.logger.log(
        `${references.length} references indexed in Elasticsearch.`,
      );
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
              context: { type: 'text' },
              text: { type: 'text' },
              resource: { type: 'keyword' },
            },
          },
        },
      });
      this.logger.log(`Index created: ${indexName}`);
    } else {
      this.logger.log(`Index already exists: ${indexName}`);
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

    if (lemmatizedSearchTerm && lemmatizedSearchTerm.trim() !== '') {
      query.bool.must.push({
        multi_match: {
          query: lemmatizedSearchTerm,
          fields: ['context', 'text'],
          fuzziness: 'AUTO',
        },
      });
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

  public async getSectionReferences(searchTerm: string) {
    const splitString = searchTerm.split(' > ');

    // Remove the last element
    splitString.pop();

    // Join the remaining parts back together
    const nextToc = splitString.join(' > ');

    const query = `MATCH (n:Reference) 
         WHERE toLower(n.context) CONTAINS toLower($searchTerm)
         OR n.id = $searchTerm
          OR toLower(n.next_toc) CONTAINS toLower($nextToc)
         RETURN n`;

    const params = { searchTerm, nextToc };
    const result = await this.neo4jService.runQuery(query, params);

    return result.map((record) => record.get('n').properties);
  }
}
