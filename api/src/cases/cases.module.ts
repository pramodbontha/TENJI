import { Module } from '@nestjs/common';
import { CasesController } from './cases.controller';
import { CasesService } from './cases.service';
import { Neo4jModule } from 'src/neo4j/neo4j.module';
import { ElasticsearchModule } from '@nestjs/elasticsearch';

@Module({
  imports: [
    Neo4jModule,
    ElasticsearchModule.register({
      node: process.env.ELASTICSEARCH_URL,
    }),
  ],
  controllers: [CasesController],
  providers: [CasesService],
})
export class CasesModule {}
