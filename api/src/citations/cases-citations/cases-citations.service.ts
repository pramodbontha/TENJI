import { Injectable, Logger } from '@nestjs/common';
import { Neo4jService } from 'src/neo4j/neo4j.service';
import { CasesCitationsFilterDto } from '../dto/cases-citations-filter.dto';
import { ElasticsearchService } from '@nestjs/elasticsearch';

@Injectable()
export class CasesCitationsService {
  private readonly logger = new Logger(CasesCitationsService.name);

  constructor(
    private readonly neo4jService: Neo4jService,
    private readonly elasticsearchService: ElasticsearchService,
  ) {}

  private getSearchCondition(
    searchTerm: string,
    alias: string,
    caseNameAlias: string,
  ) {
    if (!searchTerm) return '';
    const lowerSearch = `toLower($searchTerm)`;
    return `
      WHERE toLower(${caseNameAlias}) CONTAINS ${lowerSearch} 
      OR toLower(${alias}.number) CONTAINS ${lowerSearch}
      OR toLower(${alias}.judgment) CONTAINS ${lowerSearch}
      OR toLower(${alias}.facts) CONTAINS ${lowerSearch}
      OR toLower(${alias}.reasoning) CONTAINS ${lowerSearch}
      OR toLower(${alias}.headnotes) CONTAINS ${lowerSearch}
      OR toLower(${alias}.year) CONTAINS ${lowerSearch}
      OR toLower(${alias}.decision_type) CONTAINS ${lowerSearch}
      `;
  }

  public async getCasesCitingGivenCase(filter: CasesCitationsFilterDto) {
    const { caseId, searchTerm, skip, limit } = filter;

    this.logger.log(`Fetching cases citing case: ${caseId}`);

    // Helper to fetch count query for cases citing other cases
    const getCountQuery = () => `
    MATCH (c:Case)-[:REFERS_TO]->(citedCase:Case {number: $caseId})
    OPTIONAL MATCH (c)-[:IS_NAMED]->(n:Name)
    WITH c, n  
    ${this.getSearchCondition(searchTerm, 'c', 'n.short')}
    RETURN count(c) AS totalCount
    `;

    // Helper to fetch paginated cases query
    const getCasesQuery = () => `
    MATCH (c:Case)-[:REFERS_TO]->(citedCase:Case {number: $caseId})
    OPTIONAL MATCH (c)-[:IS_NAMED]->(n:Name)
    WITH c, n 
    ${this.getSearchCondition(searchTerm, 'c', 'n.short')}
    RETURN DISTINCT c, n.short AS caseName, elementId(c) AS elementId
    ORDER BY c.citing_cases DESC
    SKIP toInteger($skip) LIMIT toInteger($limit)
    `;

    try {
      // Execute the count and paginated queries concurrently using neo4jService
      const [countResult, casesResult] = await Promise.all([
        this.neo4jService.runQuery(getCountQuery(), { caseId, searchTerm }),
        this.neo4jService.runQuery(getCasesQuery(), {
          caseId,
          searchTerm,
          skip,
          limit,
        }),
      ]);

      // Extract the total count of cited cases
      const totalCount = countResult[0]?.get('totalCount').low || 0;

      // Process the cases
      const cases = casesResult.map((record) => {
        const citedCase = record.get('c').properties;
        const citedCaseId = record.get('elementId');
        const caseName = record.get('caseName');
        return { ...citedCase, id: citedCaseId, caseName };
      });

      const elasticSearchResults = await Promise.all(
        cases.map(async (caseData) => {
          const query = {
            index: 'cases',
            body: {
              query: {
                match: {
                  number: caseData.number,
                },
              },
            },
          };
          const result = await this.elasticsearchService.search(query);
          return result.hits.hits.map((hit) => hit._source);
        }),
      );
      const flattenedResults = elasticSearchResults.flat();

      return { cases: flattenedResults, total: totalCount };
    } catch (error) {
      console.error(error);
      this.logger.error(
        `Error fetching citing cases for case ${caseId}: ${error.message}`,
      );
      throw error;
    }
  }

  public async getCasesCitingGivenCaseCount(caseId: string) {
    this.logger.log(`Fetching cases citing case count for case: ${caseId}`);
    let query = `MATCH (c:Case)-[:REFERS_TO]->(citedCase:Case {number: $caseId}) `;
    query += `OPTIONAL MATCH (c:Case)-[:IS_NAMED]->(n:Name)`;
    query += `RETURN count(c) AS count`;

    try {
      const result = await this.neo4jService.runQuery(query, { caseId });
      return result[0].get('count').low;
    } catch (error) {
      this.logger.error(
        `Error fetching citing cases count for case ${caseId}: ${error.message}`,
      );
      throw error;
    }
  }

  public async getCaseCitingOtherCases(filter: CasesCitationsFilterDto) {
    const { caseId, searchTerm, skip, limit } = filter;
    this.logger.log(`Fetching cases citing case: ${caseId}`);

    // Helper to fetch count query
    const getCountQuery = () => `
    MATCH (c:Case {number: $caseId})-[:REFERS_TO]->(citedCase:Case)
    OPTIONAL MATCH (citedCase)-[:IS_NAMED]->(n:Name)
    WITH citedCase, n  
    ${this.getSearchCondition(searchTerm, 'citedCase', 'n.short')}
    RETURN count(citedCase) AS totalCount
    `;

    // Helper to fetch paginated query
    const getCasesQuery = () => `
    MATCH (c:Case {number: $caseId})-[:REFERS_TO]->(citedCase:Case)
    OPTIONAL MATCH (citedCase)-[:IS_NAMED]->(n:Name)
    WITH citedCase, n 
    ${this.getSearchCondition(searchTerm, 'citedCase', 'n.short')}
    RETURN DISTINCT citedCase, n.short AS caseName, elementId(citedCase) AS elementId
    ORDER BY citedCase.citing_cases DESC
    SKIP toInteger($skip) LIMIT toInteger($limit)
    `;

    try {
      // Execute the count and paginated queries concurrently using the neo4jService
      const [countResult, casesResult] = await Promise.all([
        this.neo4jService.runQuery(getCountQuery(), { caseId, searchTerm }),
        this.neo4jService.runQuery(getCasesQuery(), {
          caseId,
          searchTerm,
          skip,
          limit,
        }),
      ]);

      // Extract the total count of cited cases
      const totalCount = countResult[0]?.get('totalCount').low || 0;

      // Process the cases
      const cases = casesResult.map((record) => {
        const citedCase = record.get('citedCase').properties;
        const citedCaseId = record.get('elementId');
        const caseName = record.get('caseName');
        return { ...citedCase, id: citedCaseId, caseName };
      });

      const elasticSearchResults = await Promise.all(
        cases.map(async (caseData) => {
          const query = {
            index: 'cases',
            body: {
              query: {
                match: {
                  number: caseData.number,
                },
              },
            },
          };
          const result = await this.elasticsearchService.search(query);
          return result.hits.hits.map((hit) => hit._source);
        }),
      );

      const flattenedResults = elasticSearchResults.flat();

      return { cases: flattenedResults, total: totalCount };
    } catch (error) {
      this.logger.error(
        `Error fetching citing cases for case ${caseId}: ${error.message}`,
      );
      throw error;
    }
  }

  public async getCaseCitingOtherCasesCount(caseId: string) {
    this.logger.log(`Fetching cases citing case count for case: ${caseId}`);

    let query = `MATCH (c:Case {number: $caseId})-[:REFERS_TO]->(citedCase:Case) `;

    query += `OPTIONAL MATCH (citedCase)-[:IS_NAMED]->(n:Name) `;

    query += `RETURN count(citedCase) AS count`;

    try {
      const result = await this.neo4jService.runQuery(query, { caseId });
      return result[0].get('count').low;
    } catch (error) {
      this.logger.error(
        `Error fetching citing cases count for case ${caseId}: ${error.message}`,
      );
      throw error;
    }
  }

  public async getArticlesCitingCase(filter: CasesCitationsFilterDto) {
    const { caseId, searchTerm, skip, limit } = filter;
    this.logger.log(`Fetching articles citing case: ${caseId}`);
    const getSearchCondition = (alias: string, nameAlias: string) => {
      if (!searchTerm) return '';
      const lowerSearch = `toLower($searchTerm)`;
      return `
      WHERE toLower(${nameAlias}) CONTAINS ${lowerSearch}
      OR toLower(${alias}.number) CONTAINS ${lowerSearch}
      OR toLower(${alias}.text) CONTAINS ${lowerSearch}
    `;
    };

    // Helper to fetch count query
    const getCountQuery = () => `
        MATCH (c:Case {number: $caseId})-[:REFERS_TO]->(a:Article)
        OPTIONAL MATCH (a)-[:IS_NAMED]->(n:Name)
        with a, n
        ${getSearchCondition('a', 'n.short')}
        RETURN count(a) AS totalCount
      `;

    // Helper to fetch paginated articles query
    const getArticlesQuery = () => `
        MATCH (c:Case {number: $caseId})-[:REFERS_TO]->(a:Article)
        OPTIONAL MATCH (a)-[:IS_NAMED]->(n:Name)
        with a, n
        ${getSearchCondition('a', 'n.short')}
        RETURN a, n.short AS articleName, elementId(a) AS elementId
        ORDER BY a.citing_cases DESC
        SKIP toInteger($skip) LIMIT toInteger($limit)
      `;

    try {
      // Execute the count and paginated queries concurrently
      const [countResult, articlesResult] = await Promise.all([
        this.neo4jService.runQuery(getCountQuery(), { caseId, searchTerm }),
        this.neo4jService.runQuery(getArticlesQuery(), {
          caseId,
          searchTerm,
          skip,
          limit,
        }),
      ]);

      // Extract total count of articles
      const totalCount = countResult[0]?.get('totalCount').low || 0;

      // Process articles
      const articles = articlesResult.map((record) => {
        const article = record.get('a').properties;
        const articleId = record.get('elementId');
        const name = record.get('articleName');
        return { ...article, id: articleId, name };
      });

      const elasticSearchResults = await Promise.all(
        articles.map(async (articleData) => {
          const query = {
            index: 'articles',
            body: {
              query: {
                match: {
                  number: articleData.number,
                },
              },
            },
          };
          this.logger.log(`Elasticsearch query: ${JSON.stringify(query)}`);
          const result = await this.elasticsearchService.search(query);
          return result.hits.hits.map((hit) => hit._source);
        }),
      );

      const flattenedResults = elasticSearchResults.flat();
      return { articles: flattenedResults, total: totalCount };
    } catch (error) {
      this.logger.error(
        `Error fetching articles for case ${caseId}: ${error.message}`,
      );
      throw error;
    }
  }

  public async getArticlesCitingCaseCount(caseId: string) {
    this.logger.log(`Fetching articles citing case count for case: ${caseId}`);

    let query = `MATCH (c:Case {number: $caseId})-[:REFERS_TO]->(a:Article) 
     OPTIONAL MATCH (a)-[:IS_NAMED]->(n:Name)`;
    query += `RETURN count(a) AS count`;

    try {
      const result = await this.neo4jService.runQuery(query, { caseId });
      return result[0].get('count').low;
    } catch (error) {
      this.logger.error(
        `Error fetching articles count for case ${caseId}: ${error.message}`,
      );
      throw error;
    }
  }

  public async getReferencesWithGivenCase(filter: CasesCitationsFilterDto) {
    const { caseId, searchTerm, skip, limit } = filter;
    this.logger.log(`Fetching references with case: ${caseId}`);

    // Helper function to construct the search condition for references
    const getSearchCondition = (alias: string) => {
      if (!searchTerm) return '';
      const lowerSearch = `toLower($searchTerm)`;
      return `
        WHERE toLower(${alias}.context) CONTAINS ${lowerSearch}
        OR toLower(${alias}.text) CONTAINS ${lowerSearch}
      `;
    };

    // Helper to fetch count of references
    const getCountQuery = () => `
      MATCH (r:Reference)-[:MENTIONS]->(c:Case {number: $caseId})
      ${getSearchCondition('r')}
      RETURN count(r) AS totalCount
    `;

    // Helper to fetch paginated references
    const getReferencesQuery = () => `
      MATCH (r:Reference)-[:MENTIONS]->(c:Case {number: $caseId})
      ${getSearchCondition('r')}
      RETURN r, elementId(r) AS elementId
      SKIP toInteger($skip) LIMIT toInteger($limit)
    `;

    try {
      // Execute the count and paginated queries concurrently using neo4jService
      const [countResult, referencesResult] = await Promise.all([
        this.neo4jService.runQuery(getCountQuery(), { caseId, searchTerm }),
        this.neo4jService.runQuery(getReferencesQuery(), {
          caseId,
          searchTerm,
          skip,
          limit,
        }),
      ]);

      // Extract the total count of references
      const totalCount = countResult[0]?.get('totalCount').low || 0;

      // Process the references
      const references = referencesResult.map((record) => {
        const reference = record.get('r').properties;
        const referenceId = record.get('elementId');
        return { ...reference, referenceId };
      });

      return { references, total: totalCount };
    } catch (error) {
      this.logger.error(
        `Error fetching references for case ${caseId}: ${error.message}`,
      );
      throw error;
    }
  }

  public async getReferencesWithGivenCaseCount(caseId: string) {
    this.logger.log(`Fetching references count for case: ${caseId}`);

    let query = `MATCH (r:Reference)-[:MENTIONS]->(c:Case {number: $caseId})`;
    query += `RETURN count(r) AS count`;

    try {
      const result = await this.neo4jService.runQuery(query, { caseId });
      return result[0].get('count').low;
    } catch (error) {
      this.logger.error(
        `Error fetching references count for case ${caseId}: ${error.message}`,
      );
      throw error;
    }
  }
}
