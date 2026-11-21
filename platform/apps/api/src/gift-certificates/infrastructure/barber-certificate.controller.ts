/* eslint-disable max-lines -- cohesive module (106 lines vs 100 limit after formatting reflow); decomposition deferred to T-2500f */
// T-4456: HTTP-поверхня погашення сертифіката барбером.
// Скан/ввід коду → перевірка балансу/терміну → списання частини або повної
// суми → чек із джерелом `gift_certificate`. Подвійний скан захищений
// `idempotencyKey`; історія погашень доступна адмінці.
import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  BarberCertificateRedemptionService,
  type CertificateBalanceView,
  type RedemptionView,
} from '../application/barber-certificate-redemption.service';
import {
  CertificateRedemptionConflictError,
  CertificateRedemptionError,
  CertificateRedemptionForbiddenError,
  type CertificateRedemptionRecord,
} from '../domain/certificate-redemption';

function mapError(error: unknown): never {
  if (error instanceof CertificateRedemptionForbiddenError) {
    throw new ForbiddenException(error.message);
  }
  if (error instanceof CertificateRedemptionConflictError) {
    throw new ConflictException(error.message);
  }
  if (error instanceof CertificateRedemptionError) {
    if (error.message.includes('not found')) throw new NotFoundException(error.message);
    throw new BadRequestException(error.message);
  }
  throw new BadRequestException(error instanceof Error ? error.message : String(error));
}

function parseAt(value?: string): Date | undefined {
  if (value === undefined || value.trim() === '') return undefined;
  const at = new Date(value);
  if (Number.isNaN(at.getTime())) throw new BadRequestException(`Invalid at: ${value}`);
  return at;
}

@ApiTags('barber-certificates')
@Controller('barber/certificates')
export class BarberCertificateController {
  constructor(private readonly certificates: BarberCertificateRedemptionService) {}

  @Post('redeem')
  @ApiOperation({ summary: 'Погасити сертифікат: часткове або повне покриття з чеком' })
  async redeem(
    @Body()
    body: {
      actorId: string;
      actorRole?: string;
      code: string;
      amount: number;
      appointmentTotal: number;
      appointmentId?: string;
      idempotencyKey: string;
      at?: string;
    }
  ): Promise<RedemptionView> {
    try {
      return await this.certificates.redeem({
        actorId: body.actorId,
        actorRole: body.actorRole ?? 'barber',
        code: body.code,
        amount: body.amount,
        appointmentTotal: body.appointmentTotal,
        ...(body.appointmentId ? { appointmentId: body.appointmentId } : {}),
        idempotencyKey: body.idempotencyKey,
        ...(parseAt(body.at) ? { at: parseAt(body.at) as Date } : {}),
      });
    } catch (error) {
      mapError(error);
    }
  }

  @Get(':code/balance')
  @ApiOperation({ summary: 'Баланс і термін сертифіката перед погашенням' })
  async balance(
    @Param('code') code: string,
    @Query('at') at?: string
  ): Promise<CertificateBalanceView> {
    try {
      return await this.certificates.balance(code, parseAt(at));
    } catch (error) {
      mapError(error);
    }
  }
}

@ApiTags('admin-certificates')
@Controller('admin/certificates')
export class AdminCertificateController {
  constructor(private readonly certificates: BarberCertificateRedemptionService) {}

  @Get(':certificateId/redemptions')
  @ApiOperation({ summary: 'Історія погашень сертифіката' })
  async redemptions(
    @Param('certificateId') certificateId: string
  ): Promise<CertificateRedemptionRecord[]> {
    try {
      return await this.certificates.history({ certificateId });
    } catch (error) {
      mapError(error);
    }
  }
}
