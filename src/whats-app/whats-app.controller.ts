import { Controller, Get, Post } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { catchError, from, Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { Chat } from 'whatsapp-web.js';
import { Roles } from '../auth/decorator/role.decorator';
import { Role } from '../auth/model/role.enum';
import { QrCodeDto } from './dto/qr-code.dto';
import { WhatsAppService } from './whats-app.service';
import * as QRCode from 'qrcode';

@ApiTags('whatsapp')
@Controller('whatsapp')
export class WhatsAppController {
  constructor(
    private readonly service: WhatsAppService,
  ) {}

  @Get('chats')
  @Roles([Role.ADMIN])
  getChats(): Promise<Chat[]> {
    return this.service.getChats();
  }

  @Post('send')
  @Roles([Role.ADMIN])
  send(): void {
    this.service.send('Default Message');
  }

  @Get('qr')
  @Roles([Role.ADMIN])
  @ApiOkResponse({ type: QrCodeDto })
  latestQrCode(): Observable<QrCodeDto> {
    const latestQrCode = this.service.latestQrCode;
    if (!!latestQrCode) {
      return from(QRCode.toDataURL(latestQrCode.qr)).pipe(
        map(url => ({
          createDateTime: latestQrCode.datetime.toISOString(),
          qrImage: url,
        })),
        catchError(err => {
          console.error(`Error while encoding QR code to image url`, err);
          return of(null);
        }),
      );
    }
  }
}
