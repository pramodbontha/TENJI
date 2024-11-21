import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ArticlesModule } from './articles/articles.module';
import { CasesModule } from './cases/cases.module';
import { CitationsModule } from './citations/citations.module';
import { ReferencesModule } from './references/references.module';
import { Neo4jModule } from './neo4j/neo4j.module';
import { BooksModule } from './books/books.module';
// import { ElasticSearchModule } from './elastic-search/elastic-search.module';
// import { ElasticsearchModule } from '@nestjs/elasticsearch';
import { SharedModule } from './shared/shared.module';

@Module({
  imports: [
    Neo4jModule,
    ArticlesModule,
    CasesModule,
    CitationsModule,
    ReferencesModule,
    BooksModule,
    SharedModule,
  ],
  controllers: [AppController],
  providers: [AppService],
  exports: [Neo4jModule],
})
export class AppModule {}
