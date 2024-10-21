import { Injectable } from '@nestjs/common';
import * as neo4j from 'neo4j-driver';

@Injectable()
export class Neo4jService {
  private driver: neo4j.Driver;
  private readonly neo4jUrl = process.env.NEO4J_URL;
  private readonly neo4jUser = process.env.NEO4J_USER;
  private readonly neo4jPassword = process.env.NEO4J_PASSWORD;

  onModuleInit() {
    console.log('Neo4j driver connecting');
    this.driver = neo4j.driver(
      this.neo4jUrl,
      neo4j.auth.basic(this.neo4jUser, this.neo4jPassword),
      { encrypted: 'ENCRYPTION_OFF' },
    );
    console.log('Neo4j driver connected');
  }

  onModuleDestroy() {
    this.driver.close();
    console.log('Neo4j driver disconnected');
  }

  async runQuery(query: string, params: Record<string, any> = {}) {
    const session = this.driver.session();
    try {
      const result = await session.run(query, params);
      return result.records;
    } finally {
      await session.close();
    }
  }
}
