import { Injectable, Logger } from '@nestjs/common';
import { Neo4jService } from 'src/neo4j/neo4j.service';

@Injectable()
export class BooksService {
  private readonly logger = new Logger(BooksService.name);

  constructor(private readonly neo4jservice: Neo4jService) {}

  public async getBooks() {
    this.logger.log('Fetching books');

    const query = ` MATCH (n:TOC)-[:PART_OF]->(n)
        RETURN n`;

    try {
      const records = await this.neo4jservice.runQuery(query);

      const books = records.map((record) => {
        const book = record.get('n').properties;
        return { ...book };
      });

      return books;
    } catch (error) {
      this.logger.error('Failed to fetch books', error.stack);
      throw new Error(`Failed to fetch books: ${error.message}`);
    }
  }

  public async getSectionsInToc(bookId: string) {
    this.logger.log(`Fetching sections in TOC for book: ${bookId}`);

    const query = `MATCH (t:TOC)-[:PART_OF]->(section:TOC)
      WHERE toLower(section.id) = toLower($bookId) AND id(t) <> id(section)
      RETURN DISTINCT t, elementId(t) AS elementId`;

    try {
      const records = await this.neo4jservice.runQuery(query, { bookId });

      const sections = records.map((record) => {
        const section = record.get('t').properties;
        const sectionId = record.get('elementId');
        return { ...section, sectionId };
      });
      return sections;
    } catch (error) {
      this.logger.error('Failed to fetch sections in TOC', error.stack);
      throw new Error(`Failed to fetch sections in TOC: ${error.message}`);
    }
  }
}
