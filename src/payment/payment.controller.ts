import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { orderBy } from 'lodash';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { CurrentUser } from '../auth/decorator/current-user.decorator';
import { Permissions } from '../auth/decorator/permission.decorator';
import { Permission } from '../auth/model/permission.enum';
import { User } from '../auth/model/user.model';
import { PaymentSummaryByPlayerDto } from './dto/payment-summary-by-player.dto';
import { PaymentSummaryDto } from './dto/payment-summary.dto';
import { PaymentDto } from './dto/payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { PaymentService } from './payment.service';

@ApiTags('payment')
@Controller('payment')
export class PaymentController {
  constructor(private readonly service: PaymentService) {}

  @Get(':gameId')
  @Permissions([Permission.READ_PAYMENTS])
  @ApiOkResponse({ type: [PaymentDto] })
  getByGameId(@Param('gameId') gameId: string): Observable<PaymentDto[]> {
    return this.service.findByGameId(gameId).pipe(
      map(PaymentDto.fromEntities),
      map(entities => orderBy(entities, ['name'], ['asc'])),
    );
  }

  @Patch(':id')
  @Permissions([Permission.UPDATE_PAYMENTS])
  @ApiOkResponse({ type: PaymentDto })
  update(@Param('id') id: string, @Body() dto: UpdatePaymentDto, @CurrentUser() user: User): Observable<PaymentDto> {
    const updatedDto = { ...dto, confirmedBy: dto.confirmed ? user.userId : null };
    return this.service.update(id, updatedDto).pipe(
      map(PaymentDto.fromEntity)
    );
  }

  @Get('summary/all')
  @Permissions([Permission.READ_PAYMENTS])
  @ApiOkResponse({ type: [PaymentSummaryDto] })
  getPaymentSummary(): Observable<PaymentSummaryDto[]> {
    return this.service.getPaymentSummary();
  }

  @Get('summary/player')
  @ApiOkResponse({ type: [PaymentSummaryByPlayerDto] })
  getPaymentSummaryByPlayer(@CurrentUser() user: User): Observable<PaymentSummaryByPlayerDto[]> {
    return this.service.getPaymentPlayerSummary(user.userId);
  }
}
