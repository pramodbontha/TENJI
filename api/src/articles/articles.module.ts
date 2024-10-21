import { Module } from '@nestjs/common';
import { ArticlesController } from './articles.controller';
import { ArticlesService } from './articles.service';
import { Neo4jModule } from 'src/neo4j/neo4j.module';
import { ElasticsearchModule } from '@nestjs/elasticsearch';

@Module({
  imports: [
    Neo4jModule,
    ElasticsearchModule.register({
      node: process.env.ELASTICSEARCH_URL,
    }),
  ],
  controllers: [ArticlesController],
  providers: [ArticlesService],
})
export class ArticlesModule {}
