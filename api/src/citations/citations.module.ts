import { Module } from '@nestjs/common';
import { CasesCitationsService } from './cases-citations/cases-citations.service';
import { Neo4jModule } from 'src/neo4j/neo4j.module';
import { CitationsController } from './citations.controller';
import { ArticlesCitationsService } from './articles-citations/articles-citations.service';
import { ElasticsearchModule } from '@nestjs/elasticsearch';

@Module({
  imports: [
    Neo4jModule,
    ElasticsearchModule.register({
      node: process.env.ELASTICSEARCH_URL,
    }),
  ],
  providers: [CasesCitationsService, ArticlesCitationsService],
  controllers: [CitationsController],
})
export class CitationsModule {}
