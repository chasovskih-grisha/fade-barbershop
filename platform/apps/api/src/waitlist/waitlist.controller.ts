// Waitlist API — T-170: Waitlist Management.
// Endpoints: POST /api/waitlist/enter, POST /api/waitlist/hold,
// GET /api/waitlist/active, GET /api/waitlist/history,
// POST /api/waitlist/release, POST /api/waitlist/cascade

import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query } from '@nestjs/common';
import { ApiBadRequestResponse, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { IdempotencyKey } from '../../shared/decorators/idempotency-key.decorator';
import { WaitlistService } from './waitlist.service';
import { type CreateWaitlistEntryInput, type HoldSlotInput, WaitlistOutput, ActiveWaitlistOutput, ClientWaitlistHistoryOutput, type CancelWaitlistInput, type CascadeWaitlistInput, type CheckJoinInput } from './waitlist.dto';
import { IdempotencyKey } from '../../shared/decorators/idempotency-key.decorator';

export const WAITLIST_IO = Symbol('WAITLIST_IO');

export interface WaitlistDeps {
  createWaitlistEntry: (input: CreateWaitlistEntryInput) => Promise<WaitlistOutput>;
  holdSlot: (input: HoldSlotInput) => Promise<WaitlistOutput>;
  getActiveWaitlist: (locationId?: string) => Promise<ActiveWaitlistOutput>;
  getClientHistory: (clientId: string) => Promise<ClientWaitlistHistoryOutput>;
  checkJoin: (input: CheckJoinInput) => Promise<WaitlistOutput>;
  cancelWaitlistEntry: (input: CancelWaitlistInput) => Promise<WaitlistOutput>;
  cascadeWaitlist: (input: CascadeWaitlistInput) => Promise<WaitlistOutput>;
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
  async enterWaitlist(
    @Body() body: CreateWaitlistEntryInput,
  ): Promise<WaitlistOutput> {
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
  async holdSlot(
    @Body() body: HoldSlotInput,
  ): Promise<WaitlistOutput> {
    const hold = await this.waitlistService.holdSlot(
      body.slotId,
      body.clientId,
      body.locationId
    );

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
  async getActiveWaitlist(
    @Query('locationId') locationId?: string,
  ): Promise<ActiveWaitlistOutput> {
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
    @Param('clientId') clientId: string,
  ): Promise<ClientWaitlistHistoryOutput> {
    const result = await this.waitlistService.getClientHistory(clientId);

    return {
      success: true,
      data: {
        clientId: result.clientId,
        noShowsOnWaitlist: result.noShowsOnWaitlist,
        missesOnWaitlist: result.missesOnWaitlist,
        isPaused: result.isPaused,
        pauseUntil: result.pauseUntil,
        canJoin: !(result.isPaused && result.pauseUntil && Date.now() < result.pauseUntil.getTime()),
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
  async checkJoin(
    @Body() body: CheckJoinInput,
  ): Promise<WaitlistOutput> {
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
  async releaseHold(
    @Body() body: CancelWaitlistInput,
  ): Promise<WaitlistOutput> {
    const result = await this.waitlistService.releaseHold(
      body.holdId,
      body.source,
      body.releasedBy
    );

    return {
      success: true,
      data: {
        holdId: result.hold?.id,
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
  async cascadeWaitlist(
    @Body() body: CascadeWaitlistInput,
  ): Promise<WaitlistOutput> {
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
}