import { Module } from '@nestjs/common';
import { BooksController } from './books.controller';
import { BooksService } from './books.service';
import { Neo4jModule } from 'src/neo4j/neo4j.module';

@Module({
  imports: [Neo4jModule],
  controllers: [BooksController],
  providers: [BooksService],
})
export class BooksModule {}
