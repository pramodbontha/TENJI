import { Module } from '@nestjs/common';
import { CasesCitationsService } from './cases-citations/cases-citations.service';
import { Neo4jModule } from 'src/neo4j/neo4j.module';
import { CitationsController } from './citations.controller';
import { ArticlesCitationsService } from './articles-citations/articles-citations.service';

@Module({
  imports: [Neo4jModule],
  providers: [CasesCitationsService, ArticlesCitationsService],
  controllers: [CitationsController],
})
export class CitationsModule {}
