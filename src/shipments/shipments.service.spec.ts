import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ShipmentEntity } from './entities/shipment.entity';
import { ShipmentRulesService } from './shipment-rules.service';
import { ShipmentStatus } from './shipment-status.enum';
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

  it('returns all shipments', async () => {
    // Arrange
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

    // Act
    const result = await service.findAll();

    // Assert
    expect(result).toEqual(shipments);
    expect(repositoryMock.find).toHaveBeenCalledTimes(1);
  });

  it('returns a shipment when the id exists', async () => {
    // Arrange
    const shipment = { id: 7 } as ShipmentEntity;
    repositoryMock.findOneBy.mockResolvedValue(shipment);

    // Act
    const result = await service.findOne(7);

    // Assert
    expect(result).toEqual(shipment);
    expect(repositoryMock.findOneBy).toHaveBeenCalledWith({ id: 7 });
  });

  it('throws NotFoundException when the id does not exist', async () => {
    // Arrange
    repositoryMock.findOneBy.mockResolvedValue(null);

    // Act
    const result = service.findOne(999);

    // Assert
    await expect(result).rejects.toThrow(NotFoundException);
    expect(repositoryMock.findOneBy).toHaveBeenCalledWith({ id: 999 });
  });

  it('creates and saves a shipment with CREATED status', async () => {
    // Arrange
    const dto = { trackingCode: 'SHIP-100', destination: 'Cali' };
    const created = { ...dto, status: ShipmentStatus.CREATED };
    const saved = { ...created, id: 1 };
    repositoryMock.create.mockReturnValue(created);
    repositoryMock.save.mockResolvedValue(saved);

    // Act
    const result = await service.create(dto);

    // Assert
    expect(repositoryMock.create).toHaveBeenCalledWith({
      trackingCode: 'SHIP-100',
      destination: 'Cali',
      status: ShipmentStatus.CREATED,
    });
    expect(repositoryMock.save).toHaveBeenCalledWith(created);
    expect(result).toEqual(saved);
  });

  it('dispatches and saves a valid shipment', async () => {
    // Arrange
    const shipment = {
      id: 3,
      trackingCode: 'SHIP-001',
      destination: 'Bogota',
      status: ShipmentStatus.CREATED,
    } as ShipmentEntity;
    const dispatched = {
      ...shipment,
      status: ShipmentStatus.DISPATCHED,
    } as ShipmentEntity;
    repositoryMock.findOneBy.mockResolvedValue(shipment);
    repositoryMock.save.mockResolvedValue(dispatched);

    // Act
    const result = await service.dispatch(3);

    // Assert
    expect(shipmentRulesServiceMock.ensureCanBeDispatched).toHaveBeenCalledWith(
      expect.objectContaining({ id: 3 }),
    );
    expect(repositoryMock.save).toHaveBeenCalledWith(
      expect.objectContaining({ id: 3, status: ShipmentStatus.DISPATCHED }),
    );
    expect(result).toEqual(dispatched);
  });
});