// Admin locations CRUD — T-105: Second Location, MNG-ADM-11.
// Location-based pricing, manager roles, franchise/chain mode.
// Endpoints: GET/POST /api/locations, GET/PUT /api/locations/:code,
// GET /api/locations/:code/pricing, POST /api/locations/:code/manager,
// GET /api/locations/:code/bookings, GET /api/locations/:code/no-show-rates

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { LocationService } from './location.service';
import {
  CreateLocationInput,
  type CreateLocationInput,
  UpdateLocationInput,
  type UpdateLocationInput,
  ToggleFranchiseModeInput,
  type ToggleFranchiseModeInput,
  LocationOutput,
  type LocationOutput,
  LocationListOutput,
  type LocationListOutput,
  LocationPricingOutput,
  type LocationPricingOutput,
  ManagerAssignmentOutput,
  type ManagerAssignmentOutput,
  BookingListOutput,
  type BookingListOutput,
  NoShowRatesOutput,
  type NoShowRatesOutput,
} from './location.dto';


export const LOCATIONS_IO = Symbol('LOCATIONS_IO');

export interface LocationDeps {
  getAllLocations: () => Promise<LocationOutput[]>;
  getLocationByCode: (code: string) => Promise<LocationOutput | null>;
  createLocation: (input: CreateLocationInput) => Promise<LocationOutput>;
  updateLocation: (code: string, input: UpdateLocationInput) => Promise<LocationOutput>;
  toggleFranchiseMode: (input: ToggleFranchiseModeInput) => Promise<NoShowRatesOutput>;
  getFranchiseMode: () => Promise<{ enabled: boolean; adminId?: string; timestamp: string } | null>;
  getLocationPricing: (locationId: string) => Promise<LocationPricingOutput>;
  updateLocationPricing: (locationId: string, prices: { serviceId: string; amount: number }[]) => Promise<LocationPricingOutput>;
  assignManagerToLocation: (locationCode: string, userId: string, managerId: string) => Promise<ManagerAssignmentOutput>;
  getLocationManager: (locationCode: string) => Promise<ManagerAssignmentOutput | null>;
  getBookingsByLocation: (locationCode: string, status?: string) => Promise<BookingListOutput>;
  getNoShowRatesByLocation: (locationCode: string, appointments: any[]) => Promise<NoShowRatesOutput>;
  getStaffAssignments: (locationCode: string) => Promise<StaffAssignmentOutput[]>;
}

@Controller('locations')
@ApiTags('locations')
export class LocationController {
  constructor(
    private readonly locationService: LocationService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all active locations' })
  @ApiResponse({
    status: 200,
    type: LocationListOutput,
    description: 'Return list of all active locations with basic info',
  })
  @HttpCode(HttpStatus.OK)
  async getAllLocations(@Query('onlyActive') onlyActive = true): Promise<LocationListOutput> {
    const locations = await this.locationService.getAllLocations();
    return {
      success: true,
      data: locations.map(loc => ({
        id: loc.id,
        code: loc.code,
        name: loc.name,
        address: loc.address,
        phone: loc.phone,
        email: loc.email,
        active: loc.active,
        chairsCount: loc.chairs?.length ?? 0,
        createdAt: loc.createdAt,
      })),
    };
  }

  @Get('by-code/:code')
  @ApiOperation({ summary: 'Get location by code' })
  @ApiParam({ name: 'code', description: 'Location code (e.g. KYY-01)' })
  @ApiResponse({
    status: 200,
    type: LocationOutput,
    description: 'Return location details including pricing, staff, configuration',
  })
  @HttpCode(HttpStatus.OK)
  async getLocationByCode(@Param('code') code: string): Promise<LocationOutput> {
    const loc = await this.locationService.getLocationByCode(code);
    if (!loc) {
      throw new Error(`Location with code ${code} not found`);
    }
    return {
      success: true,
      data: {
        id: loc.id,
        code: loc.code,
        name: loc.name,
        address: loc.address,
        street: loc.street,
        building: loc.building,
        city: loc.city,
        postalCode: loc.postalCode,
        country: loc.country,
        lat: loc.lat,
        lng: loc.lng,
        phone: loc.phone,
        email: loc.email,
        active: loc.active,
        channels: loc.channels?.map(c => ({
          channel: c.channel,
          value: c.value,
          sortOrder: c.sortOrder,
        })) ?? [],
        photos: loc.photos?.map(p => ({
          url: p.url,
          caption: p.caption,
          sortOrder: p.sortOrder,
        })) ?? [],
        chairsCount: loc.chairs?.length ?? 0,
        servicePrices: loc.servicePrices?.map(sp => ({
          serviceId: sp.serviceId,
          amount: sp.amount,
          active: sp.active,
        })) ?? [],
        staffAssignments: loc.staffAssignments?.length ?? 0,
        createdAt: loc.createdAt,
      },
    };
  }

  @Post()
  @ApiOperation({ summary: 'Create new location' })
  @ApiCreatedResponse({
    type: LocationOutput,
    description: 'Create a new location with configuration',
  })
  @HttpCode(HttpStatus.CREATED)
  async createLocation(
    @Body() input: CreateLocationInput,
  ): Promise<LocationOutput> {
    const loc = await this.locationService.createLocation(input);
    return {
      success: true,
      data: {
        id: loc.id,
        code: loc.code,
        name: loc.name,
        address: loc.address,
        phone: loc.phone,
        email: loc.email,
        active: loc.active,
        chairsCount: loc.chairs?.length ?? 0,
        createdAt: loc.createdAt,
      },
    };
  }

  @Put('by-code/:code')
  @ApiOperation({ summary: 'Update location' })
  @ApiParam({ name: 'code', description: 'Location code' })
  @ApiResponse({
    status: 200,
    type: LocationOutput,
    description: 'Update location details',
  })
  @HttpCode(HttpStatus.OK)
  async updateLocation(
    @Param('code') code: string,
    @Body() input: UpdateLocationInput,
  ): Promise<LocationOutput> {
    const loc = await this.locationService.updateLocation(code, input);
    return {
      success: true,
      data: {
        id: loc.id,
        code: loc.code,
        name: loc.name,
        address: loc.address,
        phone: loc.phone,
        email: loc.email,
        active: loc.active,
        chairsCount: loc.chairs?.length ?? 0,
        createdAt: loc.createdAt,
      },
    };
  }

  @Put('by-code/:code/franchise')
  @ApiOperation({ summary: 'Toggle franchise/chain mode' })
  @ApiParam({ name: 'code', description: 'Location code' })
  @ApiResponse({
    status: 200,
    type: NoShowRatesOutput,
    description: 'Enable/disable franchise mode for the location',
  })
  @HttpCode(HttpStatus.OK)
  async toggleFranchiseMode(
    @Param('code') code: string,
    @Body() input: ToggleFranchiseModeInput,
  ): Promise<{ enabled: boolean; adminId?: string; timestamp: string }> {
    const result = await this.locationService.toggleFranchiseMode(input.enabled, input.adminId);
    if (result) {
      return {
        enabled: result.enabled,
        adminId: result.adminId,
        timestamp: result.timestamp,
      };
    }
    return {
      enabled: input.enabled,
      adminId: input.adminId,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('by-code/:code/pricing')
  @ApiOperation({ summary: 'Get per-location pricing' })
  @ApiParam({ name: 'code', description: 'Location code' })
  @ApiResponse({
    status: 200,
    type: LocationPricingOutput,
    description: 'Return per-location service pricing',
  })
  @HttpCode(HttpStatus.OK)
  async getLocationPricing(@Param('code') code: string): Promise<LocationPricingOutput> {
    const pricing = await this.locationService.getLocationPricing(code);
    return {
      success: true,
      data: pricing.map(sp => ({
        serviceId: sp.serviceId,
        serviceName: sp.service?.name,
        amount: sp.amount,
        active: sp.active,
      })),
    };
  }

  @Put('by-code/:code/pricing')
  @ApiOperation({ summary: 'Update per-location pricing' })
  @ApiParam({ name: 'code', description: 'Location code' })
  @ApiResponse({
    status: 200,
    type: LocationPricingOutput,
    description: 'Update per-location service pricing',
  })
  @HttpCode(HttpStatus.OK)
  async updateLocationPricing(
    @Param('code') code: string,
    @Body() prices: { serviceId: string; amount: number }[],
  ): Promise<LocationPricingOutput> {
    const updated = await this.locationService.updateLocationPricing(code, prices);
    return {
      success: true,
      data: updated.map(sp => ({
        serviceId: sp.serviceId,
        serviceName: sp.service?.name,
        amount: sp.amount,
        active: sp.active,
      })),
    };
  }

  @Post('by-code/:code/manager')
  @ApiOperation({ summary: 'Assign manager to location' })
  @ApiParam({ name: 'code', description: 'Location code' })
  @ApiResponse({
    status: 200,
    type: ManagerAssignmentOutput,
    description: 'Assign a manager (barber) to this location',
  })
  @HttpCode(HttpStatus.OK)
  async assignManagerToLocation(
    @Param('code') code: string,
    @Body() body: { userId: string; managerId: string },
  ): Promise<ManagerAssignmentOutput> {
    const result = await this.locationService.assignManagerToLocation(code, body.userId, body.managerId);
    return {
      success: true,
      data: {
        barberId: result.barberId,
        locationId: result.locationId,
        assignedAt: new Date().toISOString(),
      },
    };
  }

  @Get('by-code/:code/manager')
  @ApiOperation({ summary: 'Get location manager' })
  @ApiParam({ name: 'code', description: 'Location code' })
  @ApiResponse({
    status: 200,
    type: ManagerAssignmentOutput,
    description: 'Get the manager assigned to this location',
  })
  @HttpCode(HttpStatus.OK)
  async getLocationManager(@Param('code') code: string): Promise<ManagerAssignmentOutput | null> {
    const result = await this.locationService.getLocationManager(code);
    if (!result) {
      return { success: true, data: null };
    }
    return {
      success: true,
      data: {
        barberId: result.barberId,
        locationId: result.locationId,
        assignedAt: new Date().toISOString(),
      },
    };
  }

  @Get('by-code/:code/bookings')
  @ApiOperation({ summary: 'Get bookings filtered by location' })
  @ApiParam({ name: 'code', description: 'Location code' })
  @ApiQuery({ name: 'status', enum: ['pending', 'confirmed', 'completed', 'cancelled', 'no_show'], required: false, description: 'Filter by booking status' })
  @ApiResponse({
    status: 200,
    type: BookingListOutput,
    description: 'Return bookings filtered by location and optional status',
  })
  @HttpCode(HttpStatus.OK)
  async getBookingsByLocation(
    @Param('code') code: string,
    @Query('status') status?: string,
  ): Promise<BookingListOutput> {
    const bookings = await this.locationService.getBookingsByLocation(code, status);
    return {
      success: true,
      data: bookings.map(b => ({
        id: b.id,
        clientId: b.clientId,
        barberId: b.barberId,
        serviceId: b.serviceId,
        status: b.status,
        start: b.start?.toISOString(),
        end: b.end?.toISOString(),
        source: b.source,
        agreedPrice: b.agreedPrice,
        finalPrice: b.finalPrice,
      })),
    };
  }

  @Get('by-code/:code/no-show-rates')
  @ApiOperation({ summary: 'Get no-show rates by location (NSH-005)' })
  @ApiParam({ name: 'code', description: 'Location code' })
  @ApiResponse({
    status: 200,
    type: NoShowRatesOutput,
    description: 'Return no-show rates sliced by booking channel',
  })
  @HttpCode(HttpStatus.OK)
  async getNoShowRatesByLocation(
    @Param('code') code: string,
    @Query('appointments') appointmentsStr?: string,
  ): Promise<NoShowRatesOutput> {
    const appointments = appointmentsStr
      ? JSON.parse(appointmentsStr)
      : [];
    const rates = await this.locationService.getNoShowRatesByLocation(code, appointments);
    return {
      success: true,
      data: rates,
    };
  }

  @Get('by-code/:code/staff')
  @ApiOperation({ summary: 'Get staff assignments for location' })
  @ApiParam({ name: 'code', description: 'Location code' })
  @ApiResponse({
    status: 200,
    type: [ManagerAssignmentOutput],
    description: 'Return staff assignments for this location',
  })
  @HttpCode(HttpStatus.OK)
  async getStaffAssignments(@Param('code') code: string): Promise<StaffAssignmentOutput[]> {
    const assignments = await this.locationService.getStaffAssignments(code);
    return {
      success: true,
      data: assignments.map(a => ({
        barberId: a.barber?.id,
        barberName: a.barber?.user?.name,
        barberPhone: a.barber?.user?.phone,
        locationId: a.locationId,
        assignedAt: new Date().toISOString(),
      })),
    };
  }
}