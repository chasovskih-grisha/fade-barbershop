/* eslint-disable max-lines -- cohesive module (505 lines vs 100 limit after formatting reflow); decomposition deferred to T-2500f */
import { prisma } from '../index';
import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { WaitlistService } from './waitlist.service';
import {
  type CreateWaitlistEntryInput,
  type HoldSlotInput,
  WaitlistOutput,
  WaitlistEntryOutput,
  ActiveWaitlistOutput,
  ClientWaitlistHistoryOutput,
  type CancelWaitlistInput,
  type CascadeWaitlistInput,
  type CheckJoinInput,
} from './waitlist.dto';
import { AdminCreateWaitlistEntryInput } from './admin-waitlist-entry.dto';
import { WaitlistEntryStatus } from './waitlist.domain';

export const WAITLIST_IO = Symbol('WAITLIST_IO');

export interface WaitlistDeps {
  createWaitlistEntry: (input: CreateWaitlistEntryInput) => Promise<WaitlistOutput>;
  holdSlot: (input: HoldSlotInput) => Promise<WaitlistOutput>;
  getActiveWaitlist: (locationId?: string) => Promise<ActiveWaitlistOutput>;
  getClientHistory: (clientId: string) => Promise<ClientWaitlistHistoryOutput>;
  checkJoin: (input: CheckJoinInput) => Promise<WaitlistOutput>;
  cancelWaitlistEntry: (input: CancelWaitlistInput) => Promise<WaitlistOutput>;
  cascadeWaitlist: (input: CascadeWaitlistInput) => Promise<WaitlistOutput>;
  /** Admin: create a waitlist entry with full validation */
  adminCreateWaitlistEntry: (input: AdminCreateWaitlistEntryInput) => Promise<WaitlistOutput>;
}

export const WAITLIST_CONTROLLER_IO = Symbol('WAITLIST_CONTROLLER_IO');

@Controller('waitlist')
@ApiTags('waitlist')
export class WaitlistController {
  constructor(private readonly waitlistService: WaitlistService) {}

  @Post('enter')
  @ApiOperation({ summary: 'Enter waitlist for a slot' })
  @ApiResponse({
    status: 201,
    type: WaitlistOutput,
    description: 'Client added to waitlist for a slot',
  })
  @HttpCode(HttpStatus.CREATED)
  async enterWaitlist(@Body() body: CreateWaitlistEntryInput): Promise<WaitlistOutput> {
    const result = await this.waitlistService.createWaitlistEntry(
      body.slotId,
      body.clientId,
      body.locationId,
      body.barberId,
      body.serviceId,
      body.agreedPrice
    );

    return {
      success: true,
      data: {
        id: result.id,
        slotId: result.slotId,
        clientId: result.clientId,
        locationId: result.locationId,
        barberId: result.barberId,
        serviceId: result.serviceId,
        agreedPrice: result.agreedPrice,
        holdExpiry: result.holdExpiry,
        status: result.status,
        createdAt: result.createdAt,
        missedCount: result.missedCount,
      },
    };
  }

  @Post('hold')
  @ApiOperation({ summary: 'Hold a slot for a client (15 min, not a booking)' })
  @ApiResponse({
    status: 200,
    type: WaitlistOutput,
    description: 'Slot held for client; invisible to new bookings during hold',
  })
  @HttpCode(HttpStatus.OK)
  async holdSlot(@Body() body: HoldSlotInput): Promise<WaitlistOutput> {
    const hold = await this.waitlistService.holdSlot(body.slotId, body.clientId, body.locationId);

    return {
      success: true,
      data: {
        holdId: hold.id,
        slotId: hold.slotId,
        locationId: hold.locationId,
        holdExpiry: hold.holdExpiry,
        heldBy: hold.holdByClientId,
        status: hold.status,
      },
    };
  }

  @Get('active')
  @ApiOperation({ summary: 'Get active waitlist entries for a location (FIFO)' })
  @ApiQuery({
    name: 'locationId',
    enum: ['LOCATION_ID', 'KYY-01', 'LVI-01', 'ODS-01', 'HRK-01', 'DNP-01'],
    required: false,
    description: 'Filter by location code',
  })
  @ApiResponse({
    status: 200,
    type: ActiveWaitlistOutput,
    description: 'Return active waitlist entries, first is next to be offered',
  })
  @HttpCode(HttpStatus.OK)
  async getActiveWaitlist(@Query('locationId') locationId?: string): Promise<ActiveWaitlistOutput> {
    const entries = await this.waitlistService.getActiveWaitlist(locationId);

    // Return first entry (FIFO - next to be offered) + count
    const nextEntry = entries.length > 0 ? entries[0] : null;

    return {
      success: true,
      data: {
        totalCount: entries.length,
        nextEntry: nextEntry
          ? {
              id: nextEntry.id,
              clientId: nextEntry.clientId,
              locationId: nextEntry.locationId,
              barberId: nextEntry.barberId,
              serviceId: nextEntry.serviceId,
              agreedPrice: nextEntry.agreedPrice,
              holdExpiry: nextEntry.holdExpiry,
              status: nextEntry.status,
              createdAt: nextEntry.createdAt,
              missedCount: nextEntry.missedCount,
            }
          : null,
        entries: entries.map((e) => ({
          id: e.id,
          clientId: e.clientId,
          locationId: e.locationId,
          barberId: e.barberId,
          serviceId: e.serviceId,
          agreedPrice: e.agreedPrice,
          holdExpiry: e.holdExpiry,
          status: e.status,
          createdAt: e.createdAt,
          missedCount: e.missedCount,
        })),
      },
    };
  }

  @Get('history/:clientId')
  @ApiOperation({ summary: 'Get client waitlist history (anti-spam tracking)' })
  @ApiParam({ name: 'clientId', description: 'Client phone or ID' })
  @ApiResponse({
    status: 200,
    type: ClientWaitlistHistoryOutput,
    description: 'Return waitlist history including pause status',
  })
  @HttpCode(HttpStatus.OK)
  async getClientHistory(
    @Param('clientId') clientId: string
  ): Promise<ClientWaitlistHistoryOutput> {
    const result = await this.waitlistService.getClientHistory(clientId);

    return {
      success: true,
      data: {
        clientId: result.clientId,
        noShowsOnWaitlist: result.noShowsOnWaitlist,
        missesOnWaitlist: result.missesOnWaitlist,
        isPaused: result.isPaused,
        ...(result.pauseUntil ? { pauseUntil: result.pauseUntil } : {}),
        canJoin: !(
          result.isPaused &&
          result.pauseUntil &&
          Date.now() < result.pauseUntil.getTime()
        ),
      },
    };
  }

  @Post('check-join')
  @ApiOperation({ summary: 'Check if client can join waitlist (rate limit + pause)' })
  @ApiResponse({
    status: 200,
    type: WaitlistOutput,
    description: 'Return whether client can join waitlist',
  })
  @HttpCode(HttpStatus.OK)
  async checkJoin(@Body() body: CheckJoinInput): Promise<WaitlistOutput> {
    const result = await this.waitlistService.canJoinWaitlist(body.clientId);

    return {
      success: true,
      data: {
        canJoin: result.canJoin,
        reason: result.reason,
      },
    };
  }

  @Post('release')
  @ApiOperation({ summary: 'Release a waitlist hold (cancel/no-show integration)' })
  @ApiResponse({
    status: 200,
    type: WaitlistOutput,
    description: 'Release hold and cascade to next person on waitlist',
  })
  @HttpCode(HttpStatus.OK)
  async releaseHold(@Body() body: CancelWaitlistInput): Promise<WaitlistOutput> {
    const result = await this.waitlistService.releaseHold(
      body.holdId,
      body.source,
      body.releasedBy
    );

    return {
      success: true,
      data: {
        holdId: result.hold.id,
        nextOffer: result.nextOffer
          ? {
              offerId: result.nextOffer.offerId,
              slotId: result.nextOffer.slotId,
              locationId: result.nextOffer.locationId,
              barberId: result.nextOffer.barberId,
              serviceId: result.nextOffer.serviceId,
              agreedPrice: result.nextOffer.agreedPrice,
              holdExpiry: result.nextOffer.holdExpiry,
              offerExpiry: result.nextOffer.offerExpiry,
              source: result.nextOffer.source,
              message: result.nextOffer.message,
            }
          : null,
        newBooking: result.newBooking
          ? {
              id: result.newBooking.id,
              clientId: result.newBooking.clientId,
              barberId: result.newBooking.barberId,
              serviceId: result.newBooking.serviceId,
              status: result.newBooking.status,
              start: result.newBooking.start?.toISOString(),
              end: result.newBooking.end?.toISOString(),
              source: result.newBooking.source,
            }
          : null,
      },
    };
  }

  @Post('cascade')
  @ApiOperation({ summary: 'Cascade waitlist to next person (auto-fulfillment)' })
  @ApiResponse({
    status: 200,
    type: WaitlistOutput,
    description: 'Cascade waitlist; auto-fills next slot; integrates with T-095 no-show',
  })
  @HttpCode(HttpStatus.OK)
  async cascadeWaitlist(@Body() body: CascadeWaitlistInput): Promise<WaitlistOutput> {
    const result = await this.waitlistService.cascadeWaitlist(
      body.slotId,
      body.locationId,
      body.source
    );

    return {
      success: true,
      data: {
        offersSent: result.offersSent,
        bookingsCreated: result.bookingsCreated,
        errors: result.errors,
      },
    };
  }

  /** POST /client/waitlist/join - Client joins waitlist for a slot */
  @Post('client/join')
  @ApiOperation({ summary: 'Join waitlist for a slot (client endpoint)' })
  @ApiResponse({
    status: 201,
    type: WaitlistOutput,
    description: 'Client added to waitlist; push notification sent on slot acceptance',
  })
  @HttpCode(HttpStatus.CREATED)
  async clientJoinWaitlist(
    @Body() body: { slotId: string; clientId: string; locationId: string }
  ): Promise<WaitlistOutput> {
    const result = await this.waitlistService.createWaitlistEntry(
      body.slotId,
      body.clientId,
      body.locationId,
      '', // barberId - optional for client flow
      'any', // serviceId - optional for client flow
      0 // agreedPrice - optional for client flow
    );

    return {
      success: true,
      data: {
        id: result.id,
        slotId: result.slotId,
        clientId: result.clientId,
        locationId: result.locationId,
        barberId: result.barberId,
        serviceId: result.serviceId,
        agreedPrice: result.agreedPrice,
        holdExpiry: result.holdExpiry,
        status: result.status,
        createdAt: result.createdAt,
        missedCount: result.missedCount,
      },
    };
  }

  /** GET /client/waitlist/status - Get client waitlist status */
  @Get('client/status')
  @ApiOperation({ summary: 'Get client waitlist status' })
  @ApiResponse({
    status: 200,
    type: ActiveWaitlistOutput,
    description: 'Active waitlist entry with hold timer for client display',
  })
  async getClientWaitlistStatus(
    @Query('locationId') locationId?: string
  ): Promise<ActiveWaitlistOutput> {
    const entries = await this.waitlistService.getActiveWaitlist(locationId);

    // Return first entry (FIFO - next to be offered) + count
    const nextEntry = entries.length > 0 ? entries[0] : null;

    // Calculate remaining hold time
    const holdExpiry = nextEntry ? new Date(nextEntry.holdExpiry) : null;
    const now = new Date();
    let remainingSeconds = 0;
    if (holdExpiry && now < holdExpiry) {
      remainingSeconds = Math.ceil((holdExpiry.getTime() - now.getTime()) / 1000);
    }

    return {
      success: true,
      data: {
        totalCount: entries.length,
        nextEntry: nextEntry
          ? {
              id: nextEntry.id,
              clientId: nextEntry.clientId,
              locationId: nextEntry.locationId,
              barberId: nextEntry.barberId,
              serviceId: nextEntry.serviceId,
              agreedPrice: nextEntry.agreedPrice,
              holdExpiry: nextEntry.holdExpiry,
              status: nextEntry.status,
              createdAt: nextEntry.createdAt,
              missedCount: nextEntry.missedCount,
              remainingHoldSeconds: Math.max(0, remainingSeconds),
            }
          : null,
        entries: entries.map((e) => ({
          id: e.id,
          clientId: e.clientId,
          locationId: e.locationId,
          barberId: e.barberId,
          serviceId: e.serviceId,
          agreedPrice: e.agreedPrice,
          holdExpiry: e.holdExpiry,
          status: e.status,
          createdAt: e.createdAt,
          missedCount: e.missedCount,
        })),
      },
    };
  }

  /** POST /client/waitlist/accept-offer - Client accepts waitlist offer */
  @Post('client/accept-offer')
  @ApiOperation({ summary: 'Accept waitlist offer (client endpoint)' })
  @ApiResponse({
    status: 200,
    type: WaitlistOutput,
    description: 'Waitlist offer accepted; triggers booking flow and push notification',
  })
  @HttpCode(HttpStatus.OK)
  async clientAcceptOffer(
    @Body() body: { offerId: string; holdId: string; clientId: string }
  ): Promise<{ success: boolean; message: string }> {
    // Validate inputs
    if (!body.offerId || !body.holdId || !body.clientId) {
      return { success: false, message: 'offerId, holdId and clientId are required' };
    }

    // Accept the waitlist offer
    const result = await this.waitlistService.clientAcceptOffer(
      body.offerId,
      body.holdId,
      body.clientId
    );

    return {
      success: result.success,
      message: result.message || 'Waitlist offer accepted. Proceeding to booking flow...',
    };
  }

  /** POST /admin/waitlist/entries - Create a waitlist entry with full admin validation. */
  @Post('admin/entries')
  @ApiOperation({ summary: 'Admin create waitlist entry with validation' })
  @ApiBadRequestResponse({
    description: 'Validation failed - see error details',
  })
  @HttpCode(HttpStatus.OK)
  async adminCreateWaitlistEntry(
    @Body() body: AdminCreateWaitlistEntryInput
  ): Promise<WaitlistOutput> {
    const result = await this.waitlistService.adminCreateWaitlistEntry(
      body.slotId,
      body.clientId,
      body.locationId,
      body.barberId,
      body.serviceId,
      body.agreedPrice,
      body.start,
      body.end,
      body.precision,
      body.status
    );

    return {
      success: true,
      data: {
        id: result.id,
        slotId: result.slotId,
        clientId: result.clientId,
        locationId: result.locationId,
        barberId: result.barberId,
        serviceId: result.serviceId,
        agreedPrice: result.agreedPrice,
        holdExpiry: result.holdExpiry,
        status: result.status,
        createdAt: result.createdAt,
        missedCount: result.missedCount,
      },
    };
  }

  /** GET /admin/waitlist/entries - List all waitlist entries with pagination and filters. */
  @Get('admin/entries')
  @ApiOperation({ summary: 'Admin list waitlist entries' })
  @ApiQuery({
    name: 'status',
    enum: ['active', 'on_hold', 'expired', 'fulfilled', 'paused'],
    required: false,
    description: 'Filter by status',
  })
  @ApiQuery({ name: 'locationId', required: false, description: 'Filter by location ID' })
  @ApiQuery({ name: 'clientId', required: false, description: 'Filter by client ID' })
  @ApiResponse({ status: 200, type: [WaitlistOutput], description: 'List of waitlist entries' })
  async adminListWaitlistEntries(
    @Query('status') status?: string,
    @Query('locationId') locationId?: string,
    @Query('clientId') clientId?: string
  ): Promise<{ success: boolean; data: WaitlistEntryOutput[]; total: number }> {
    const where: any = {};
    if (status) where.status = status;
    if (locationId) where.locationId = locationId;
    if (clientId) where.clientId = clientId;

    const entries = await this.waitlistService.getActiveWaitlist(locationId);
    const filteredEntries = entries.filter((entry) => {
      const matchesStatus = !status || entry.status === status;
      const matchesLocation = !locationId || entry.locationId === locationId;
      const matchesClient = !clientId || entry.clientId === clientId;
      return matchesStatus && matchesLocation && matchesClient;
    });

    return {
      success: true,
      data: filteredEntries.map((entry) => ({
        id: entry.id,
        slotId: entry.slotId,
        clientId: entry.clientId,
        locationId: entry.locationId,
        barberId: entry.barberId,
        serviceId: entry.serviceId,
        agreedPrice: entry.agreedPrice,
        holdExpiry: entry.holdExpiry,
        status: entry.status,
        createdAt: entry.createdAt,
        missedCount: entry.missedCount,
      })),
      total: filteredEntries.length,
    };
  }

  /** POST /admin/waitlist/entries/:id/cancel - Admin cancel a waitlist entry */
  @Post('admin/entries/:id/cancel')
  @ApiOperation({ summary: 'Admin cancel a waitlist entry' })
  @ApiBadRequestResponse({ description: 'Cancellation failed - see error details' })
  @HttpCode(HttpStatus.OK)
  async adminCancelWaitlistEntry(@Param('id') id: string): Promise<WaitlistOutput> {
    return this.waitlistService.cancelWaitlistEntry(id, 'admin');
  }
  /** POST /admin/waitlist/entries/:id/accept - Admin force-accept a waitlist offer */
  @Post('admin/entries/:id/accept')
  @ApiOperation({ summary: 'Admin force-accept a waitlist offer' })
  @ApiResponse({
    status: 200,
    type: WaitlistOutput,
    description: 'Waitlist offer accepted by admin',
  })
  @HttpCode(HttpStatus.OK)
  async adminForceAcceptOffer(
    @Param('id') id: string
  ): Promise<{ success: boolean; data: WaitlistEntryOutput; message: string }> {
    const entry = await prisma.waitlistEntry.findUnique({
      where: { id },
    });

    if (!entry) {
      throw new Error('Waitlist entry not found');
    }

    // Mark entry as fulfilled and create booking
    await this.waitlistService.fulfillWaitlistEntry(
      `admin_offer_${id}_${Date.now()}`,
      entry.clientId
    );

    return {
      success: true,
      data: {
        id: entry.id,
        slotId: entry.slotId,
        clientId: entry.clientId,
        locationId: entry.locationId,
        barberId: entry.barberId,
        serviceId: entry.serviceId,
        agreedPrice: entry.agreedPrice,
        holdExpiry: entry.holdExpiry,
        status: WaitlistEntryStatus.FULFILLED,
        createdAt: entry.createdAt,
        missedCount: entry.missedCount,
      },
      message: 'Waitlist offer force-accepted by admin; booking created.',
    };
  }
}
