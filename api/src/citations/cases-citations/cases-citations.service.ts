import { Injectable, Logger } from '@nestjs/common';
import { Neo4jService } from 'src/neo4j/neo4j.service';
import { CasesCitationsFilterDto } from '../dto/cases-citations-filter.dto';

@Injectable()
export class CasesCitationsService {
  private readonly logger = new Logger(CasesCitationsService.name);

  constructor(private readonly neo4jService: Neo4jService) {}

  public async getCasesCitingGivenCase(filter: CasesCitationsFilterDto) {
    const { caseId, searchTerm, skip, limit } = filter;

    this.logger.log(`Fetching cases citing case: ${caseId}`);

    // Helper function to construct the search condition for cited cases
    const getSearchCondition = (alias: string, caseNameAlias: string) => {
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
    };

    // Helper to fetch count query for cases citing other cases
    const getCountQuery = () => `
    MATCH (c:Case)-[:REFERS_TO]->(citedCase:Case {number: $caseId})
    OPTIONAL MATCH (c)-[:IS_NAMED]->(n:Name)
    WITH c, n  // Pass along both case and name for filtering
    ${getSearchCondition('c', 'n.short')}
    RETURN count(c) AS totalCount
    `;

    // Helper to fetch paginated cases query
    const getCasesQuery = () => `
    MATCH (c:Case)-[:REFERS_TO]->(citedCase:Case {number: $caseId})
    OPTIONAL MATCH (c)-[:IS_NAMED]->(n:Name)
    WITH c, n  // Pass along both case and name for filtering
    ${getSearchCondition('c', 'n.short')}
    RETURN DISTINCT c, n.short AS caseName, elementId(c) AS elementId
    ORDER BY c.citing_cases DESC
    SKIP toInteger($skip) LIMIT toInteger($limit)
    `;

    console.log('getCasesQuery', getCountQuery());
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

      return { cases, total: totalCount };
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

    // Helper function to construct the search condition
    const getSearchCondition = (alias: string) => {
      if (!searchTerm) return '';
      const lowerSearch = `toLower($searchTerm)`;
      return `
      toLower(${alias}.number) CONTAINS ${lowerSearch}
      OR toLower(${alias}.judgment) CONTAINS ${lowerSearch}
      OR toLower(${alias}.facts) CONTAINS ${lowerSearch}
      OR toLower(${alias}.reasoning) CONTAINS ${lowerSearch}
      OR toLower(${alias}.headnotes) CONTAINS ${lowerSearch}
      OR toLower(${alias}.year) CONTAINS ${lowerSearch}
      OR toLower(${alias}.decision_type) CONTAINS ${lowerSearch}
    `;
    };

    // Helper to fetch count query
    const getCountQuery = (named: boolean) => `
    MATCH (c:Case {number: $caseId})-[:REFERS_TO]->(citedCase:Case)
    ${named ? 'MATCH (citedCase)-[:IS_NAMED]->(n:Name) WHERE ' : 'WHERE NOT (citedCase)-[:IS_NAMED]->() AND '}
    ${named ? '' + getSearchCondition('citedCase') : '(' + getSearchCondition('citedCase') + ')'}
    RETURN count(citedCase) AS totalCount
  `;

    // Helper to fetch paginated query
    const getCasesQuery = (named: boolean) => `
    MATCH (c:Case {number: $caseId})-[:REFERS_TO]->(citedCase:Case)
    ${named ? 'MATCH (citedCase)-[:IS_NAMED]->(n:Name)' : 'WHERE NOT (citedCase)-[:IS_NAMED]->()'}
    ${named ? 'toLower(n.short) CONTAINS toLower($searchTerm) OR ' + getSearchCondition('citedCase') : '(' + getSearchCondition('citedCase') + ')'}
    RETURN citedCase, ${named ? 'n.short AS caseName' : 'null AS caseName'}, elementId(citedCase) AS elementId
    ORDER BY citedCase.citing_cases DESC
    SKIP toInteger($skip) LIMIT toInteger($limit)
  `;

    try {
      // Execute the count and paginated queries concurrently using the neo4jService
      const [
        countWithNameResult,
        countWithoutNameResult,
        resultWithName,
        resultWithoutName,
      ] = await Promise.all([
        this.neo4jService.runQuery(getCountQuery(true), { caseId, searchTerm }),
        this.neo4jService.runQuery(getCountQuery(false), {
          caseId,
          searchTerm,
        }),
        this.neo4jService.runQuery(getCasesQuery(true), {
          caseId,
          searchTerm,
          skip,
          limit,
        }),
        this.neo4jService.runQuery(getCasesQuery(false), {
          caseId,
          searchTerm,
          skip,
          limit,
        }),
      ]);

      // Extract the total counts
      const totalCountWithName =
        countWithNameResult[0]?.get('totalCount').low || 0;
      const totalCountWithoutName =
        countWithoutNameResult[0]?.get('totalCount').low || 0;

      // Process cases with and without names
      const processCases = (result) =>
        result.map((record) => ({
          ...record.get('citedCase').properties,
          id: record.get('elementId'),
          caseName: record.get('caseName'),
        }));

      const casesWithName = processCases(resultWithName);
      const casesWithoutName = processCases(resultWithoutName);

      // Combine the cases and total counts
      const combinedCases = [...casesWithName, ...casesWithoutName];
      const totalCount = totalCountWithName + totalCountWithoutName;

      return { cases: combinedCases, total: totalCount };
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
    const getSearchCondition = (alias: string) => {
      if (!searchTerm) return '';
      const lowerSearch = `toLower($searchTerm)`;
      return `
          WHERE toLower(${alias}.number) CONTAINS ${lowerSearch}
          OR toLower(${alias}.text) CONTAINS ${lowerSearch}
        `;
    };

    // Helper to fetch count query
    const getCountQuery = () => `
        MATCH (c:Case {number: $caseId})-[:REFERS_TO]->(a:Article)
        ${getSearchCondition('a')}
        RETURN count(a) AS totalCount
      `;

    // Helper to fetch paginated articles query
    const getArticlesQuery = () => `
        MATCH (c:Case {number: $caseId})-[:REFERS_TO]->(a:Article)
        ${getSearchCondition('a')}
        OPTIONAL MATCH (a)-[:IS_NAMED]->(n:Name)
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
        const articleName = record.get('articleName');
        return { ...article, id: articleId, articleName };
      });

      return { articles, total: totalCount };
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
        return { ...reference, id: referenceId };
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
