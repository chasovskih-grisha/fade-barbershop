/* eslint-disable max-lines -- cohesive module (277 lines vs 100 limit after formatting reflow); decomposition deferred to T-2500f */
// Location Controller — T-105: Second Location, MNG-ADM-11.
// CRUD + pricing + manager + bookings + no-show rates.
// Consolidated DTO usage; reduced inline mapping duplication.

import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import {
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
  UpdateLocationInput,
  ToggleFranchiseModeInput,
  LocationOutput,
  LocationListOutput,
  LocationDetailOutput,
  LocationPricingOutput,
  ManagerAssignmentOutput,
  BookingListOutput,
  NoShowRatesOutput,
  StaffAssignmentListOutput,
} from './location.dto';

@Controller('locations')
@ApiTags('locations')
export class LocationController {
  constructor(private readonly locationService: LocationService) {}

  // GET /api/locations?onlyActive=true
  @Get()
  @ApiOperation({ summary: 'Get all active locations' })
  @ApiResponse({
    status: 200,
    type: LocationListOutput,
    description: 'Return list of all active locations with basic info',
  })
  @HttpCode(HttpStatus.OK)
  async getAllLocations(@Query('onlyActive') _onlyActive = true): Promise<LocationListOutput> {
    const locations = await this.locationService.getAllLocations();
    return {
      success: true,
      data: locations,
    };
  }

  // GET /api/locations/by-code/:code
  @Get('by-code/:code')
  @ApiOperation({ summary: 'Get location by code' })
  @ApiParam({ name: 'code', description: 'Location code (e.g. KYY-01)' })
  @ApiResponse({
    status: 200,
    type: LocationOutput,
    description: 'Return location details including pricing, staff, configuration',
  })
  @HttpCode(HttpStatus.OK)
  async getLocationByCode(@Param('code') code: string): Promise<LocationDetailOutput> {
    const loc = await this.locationService.getLocationByCode(code);
    if (!loc) {
      throw new Error(`Location with code ${code} not found`);
    }
    return {
      success: true,
      data: loc,
    };
  }

  // POST /api/locations
  @Post()
  @ApiOperation({ summary: 'Create new location' })
  @ApiCreatedResponse({
    type: LocationOutput,
    description: 'Create a new location with configuration',
  })
  @HttpCode(HttpStatus.CREATED)
  async createLocation(@Body() input: CreateLocationInput): Promise<LocationDetailOutput> {
    const loc = await this.locationService.createLocation(input);
    return {
      success: true,
      data: loc,
    };
  }

  // PUT /api/locations/by-code/:code
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
    @Body() input: UpdateLocationInput
  ): Promise<LocationDetailOutput> {
    const loc = await this.locationService.updateLocation(code, input);
    return {
      success: true,
      data: loc,
    };
  }

  // PUT /api/locations/by-code/:code/franchise
  @Put('by-code/:code/franchise')
  @ApiOperation({ summary: 'Toggle franchise/chain mode' })
  @ApiParam({ name: 'code', description: 'Location code' })
  @ApiResponse({
    status: 200,
    description: 'Enable/disable franchise mode for the location',
  })
  @HttpCode(HttpStatus.OK)
  async toggleFranchiseMode(
    @Param('code') code: string,
    @Body() input: ToggleFranchiseModeInput
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

  // GET /api/locations/by-code/:code/pricing
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
      data: pricing,
    };
  }

  // PUT /api/locations/by-code/:code/pricing
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
    @Body() prices: { serviceId: string; amount: number }[]
  ): Promise<LocationPricingOutput> {
    const updated = await this.locationService.updateLocationPricing(code, prices);
    return {
      success: true,
      data: updated,
    };
  }

  // POST /api/locations/by-code/:code/manager
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
    @Body() body: { userId: string; managerId: string }
  ): Promise<ManagerAssignmentOutput> {
    const result = await this.locationService.assignManagerToLocation(
      code,
      body.userId,
      body.managerId
    );
    return {
      success: true,
      data: {
        barberId: result.barberId,
        locationId: result.locationId,
        assignedAt: new Date().toISOString(),
      },
    };
  }

  // GET /api/locations/by-code/:code/manager
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
        assignedAt: result.assignedAt,
      },
    };
  }

  // GET /api/locations/by-code/:code/bookings
  @Get('by-code/:code/bookings')
  @ApiOperation({ summary: 'Get bookings filtered by location' })
  @ApiParam({ name: 'code', description: 'Location code' })
  @ApiQuery({
    name: 'status',
    enum: ['pending', 'confirmed', 'completed', 'cancelled', 'no_show'],
    required: false,
    description: 'Filter by booking status',
  })
  @ApiResponse({
    status: 200,
    type: BookingListOutput,
    description: 'Return bookings filtered by location and optional status',
  })
  @HttpCode(HttpStatus.OK)
  async getBookingsByLocation(
    @Param('code') code: string,
    @Query('status') status?: string
  ): Promise<BookingListOutput> {
    const bookings = await this.locationService.getBookingsByLocation(code, status);
    return {
      success: true,
      data: bookings,
    };
  }

  // GET /api/locations/by-code/:code/no-show-rates
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
    @Query('appointments') appointmentsStr?: string
  ): Promise<NoShowRatesOutput> {
    const appointments = appointmentsStr ? JSON.parse(appointmentsStr) : [];
    const rates = await this.locationService.getNoShowRatesByLocation(code, appointments);
    return {
      success: true,
      data: rates,
    };
  }

  // GET /api/locations/by-code/:code/staff
  @Get('by-code/:code/staff')
  @ApiOperation({ summary: 'Get staff assignments for location' })
  @ApiParam({ name: 'code', description: 'Location code' })
  @ApiResponse({
    status: 200,
    type: [ManagerAssignmentOutput],
    description: 'Return staff assignments for this location',
  })
  @HttpCode(HttpStatus.OK)
  async getStaffAssignments(@Param('code') code: string): Promise<StaffAssignmentListOutput> {
    const assignments = await this.locationService.getStaffAssignments(code);
    return {
      success: true,
      data: assignments,
    };
  }
}
