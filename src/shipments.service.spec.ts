import { beforeEach, describe, expect, it, jest} from '@jest/globals';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ShipmentEntity } from './entities/shipment.entity';
import { ShipmentRulesService } from './shipment-rules.service';
import { ShipmentsService } from './shipments.service';

describe('ShipmentsService', () => {
  let service: ShipmentsService;

  const repositoryMock = {
    create: jest.fn<any>(),
    find: jest.fn<any>(),
    findOneBy: jest.fn<any>(),
    save: jest.fn<any>(),
  };

  const shipmentRulesServiceMock = {
    ensureCanBeDispatched: jest.fn<any>(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        ShipmentsService,
        {
          provide: getRepositoryToken(ShipmentEntity),
          useValue: repositoryMock,
        },
        {
          provide: ShipmentRulesService,
          useValue: shipmentRulesServiceMock,
        },
      ],
    }).compile();

    service = moduleRef.get(ShipmentsService);
  });

  it('is defined', () => {
    expect(service).toBeDefined();
  });
});

it('returns all shipments', async () => {