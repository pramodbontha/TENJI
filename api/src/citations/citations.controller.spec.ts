import { Test, TestingModule } from '@nestjs/testing';
import { CitationsController } from './citations.controller';

describe('CitationsController', () => {
  let controller: CitationsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CitationsController],
    }).compile();

    controller = module.get<CitationsController>(CitationsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
