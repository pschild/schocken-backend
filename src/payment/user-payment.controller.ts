import { Controller, Get, HttpException, HttpStatus } from '@nestjs/common';
import { ApiOkResponse, ApiProduces, ApiTags } from '@nestjs/swagger';
import { Observable, throwIfEmpty } from 'rxjs';
import { CurrentUser } from '../auth/decorator/current-user.decorator';
import { User } from '../auth/model/user.model';
import { UserPaymentDto } from './dto/user-payment.dto';
import { OutstandingPenaltyDto } from './dto/outstanding-penalty.dto';
import { PaymentService } from './payment.service';

@ApiTags('user-payment')
@Controller('user-payment')
export class UserPaymentController {
  constructor(private readonly service: PaymentService) {}

  @Get()
  @ApiOkResponse({ type: [UserPaymentDto] })
  getByUserId(@CurrentUser() user: User): Observable<UserPaymentDto[]> {
    return this.service.getByUserId(user.userId);
  }

  @Get('outstanding-penalties')
  @ApiOkResponse({ type: [OutstandingPenaltyDto] })
  getOutstandingPenaltiesByUserId(@CurrentUser() user: User): Observable<OutstandingPenaltyDto[]> {
    return this.service.getOutstandingPenaltiesByUserId(user.userId);
  }

  @Get('qr')
  @ApiOkResponse({ type: String })
  @ApiProduces('text/plain')
  getQrCodeByUserId(@CurrentUser() user: User): Observable<string> {
    return this.service.generateQrCode(user.userId).pipe(
      throwIfEmpty(() => new HttpException('QR Code was not generated', HttpStatus.NO_CONTENT))
    );
  }
}
