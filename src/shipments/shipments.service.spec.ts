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

  it('creates and saves a shipment with CREATED status', async () => {
    const dto = { trackingCode: 'SHIP-100', destination: 'Cali' };
    const created = { ...dto, status: ShipmentStatus.CREATED };
    const saved = { ...created, id: 1 };
    repositoryMock.create.mockReturnValue(created);
    repositoryMock.save.mockResolvedValue(saved);

    const result = await service.create(dto);

    expect(repositoryMock.create).toHaveBeenCalledWith({
      trackingCode: 'SHIP-100',
      destination: 'Cali',
      status: ShipmentStatus.CREATED,
    });
    expect(repositoryMock.save).toHaveBeenCalledWith(created);
    expect(result).toEqual(saved);
  });

  it('dispatches and saves a valid shipment', async () => {
    const shipment = {
      id: 1,
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

    const result = await service.dispatch(1);

    expect(shipmentRulesServiceMock.ensureCanBeDispatched).toHaveBeenCalledWith(
      expect.objectContaining({ id: 1 }),
    );
    expect(repositoryMock.save).toHaveBeenCalledWith(
      expect.objectContaining({ id: 1, status: ShipmentStatus.DISPATCHED }),
    );
    expect(result).toEqual(dispatched);
  });

  it('does not save when the shipment cannot be dispatched', async () => {
    const shipment = { id: 1, status: ShipmentStatus.DISPATCHED } as ShipmentEntity;
    repositoryMock.findOneBy.mockResolvedValue(shipment);
    shipmentRulesServiceMock.ensureCanBeDispatched.mockImplementationOnce(() => {
      throw new Error('cannot dispatch');
    });

    const result = service.dispatch(1);

    await expect(result).rejects.toThrow('cannot dispatch');
    expect(repositoryMock.save).not.toHaveBeenCalled();
  });
});