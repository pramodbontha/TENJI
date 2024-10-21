import { Module } from '@nestjs/common';
import { ReferencesController } from './references.controller';
import { ReferencesService } from './references.service';
import { Neo4jModule } from 'src/neo4j/neo4j.module';
import { ElasticsearchModule } from '@nestjs/elasticsearch';

@Module({
  imports: [
    Neo4jModule,
    ElasticsearchModule.register({
      node: process.env.ELASTICSEARCH_URL,
    }),
  ],
  controllers: [ReferencesController],
  providers: [ReferencesService],
})
export class ReferencesModule {}
