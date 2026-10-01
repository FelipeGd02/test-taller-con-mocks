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
    const shipments = [
      {
        id: 1,
        trackingCode: 'SHIP-001',
        destination: 'Bogota',
        status: ShipmentStatus.CREATED,
      },
      {
        id: 2,
        trackingCode: 'SHIP-002',
        destination: 'Cali',
        status: ShipmentStatus.CREATED,
      },
    ] as ShipmentEntity[];
    repositoryMock.find.mockResolvedValue(shipments);
     const result = await service.findAll();
     expect(result).toEqual(shipments);
    expect(repositoryMock.find).toHaveBeenCalledTimes(1);
  });
 
  it('returns a shipment when the id exists', async () => {
    const shipment = { id: 7 } as ShipmentEntity;
    repositoryMock.findOneBy.mockResolvedValue(shipment);
     const result = await service.findOne(7);
     expect(result).toEqual(shipment);
    expect(repositoryMock.findOneBy).toHaveBeenCalledWith({ id: 7 });
  });
 
  it('throws NotFoundException when the id does not exist', async () => {
    repositoryMock.findOneBy.mockResolvedValue(null);
    const result = service.findOne(999);
    await expect(result).rejects.toThrow(NotFoundException);
    expect(repositoryMock.findOneBy).toHaveBeenCalledWith({ id: 999 });
  });
});


 


