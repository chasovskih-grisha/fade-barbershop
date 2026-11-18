// GET /admin/bookings/:id — деталі візиту для картки (§5.2 admin-screens).
// Read-контролер окремо від команд життєвого циклу (LOC-гейт, ADR 0019).

import { Controller, Get, HttpException, HttpStatus, Param } from '@nestjs/common';
import { ApiNotFoundResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminBookingDetail, type BookingDetail } from '../application/admin-booking-detail';

export type { BookingDetail } from '../application/admin-booking-detail';

@ApiTags('admin-bookings')
@Controller('admin/bookings')
export class AdminBookingDetailController {
  constructor(private readonly readModel: AdminBookingDetail) {}

  @Get(':id')
  @ApiOperation({ summary: 'Booking details with client, barber, service and history' })
  @ApiNotFoundResponse({ description: 'Booking not found' })
  async detail(@Param('id') id: string): Promise<BookingDetail> {
    const detail = await this.readModel.handle(id);
    if (!detail) throw new HttpException('Booking not found', HttpStatus.NOT_FOUND);
    return detail;
  }
}
