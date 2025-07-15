import { Controller, Get, GoneException, Post } from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import * as QRCode from 'qrcode';
import { catchError, from, Observable, throwError } from 'rxjs';
import { map } from 'rxjs/operators';
import { Roles } from '../auth/decorator/role.decorator';
import { Role } from '../auth/model/role.enum';
import { QrCodeDto } from './dto/qr-code.dto';
import { WhatsAppChatInfoDto } from './dto/whats-app-chat-info.dto';
import { WhatsAppClientStatusDto } from './dto/whats-app-client-status.dto';
import { WhatsAppSentMessageDto } from './dto/whats-app-sent-message.dto';
import { QrCodeEncodingException } from './exception/qr-code-encoding.exception';
import { WhatsAppService } from './whats-app.service';

@ApiTags('whatsapp')
@Controller('whatsapp')
export class WhatsAppController {
  constructor(
    private readonly service: WhatsAppService,
  ) {}

  @Get('client-status')
  @Roles([Role.ADMIN])
  @ApiCreatedResponse({ type: WhatsAppClientStatusDto })
  getClientStatus(): Observable<WhatsAppClientStatusDto> {
    return from(this.service.getState()).pipe(
      map(waState => ({
        isInitialized: this.service.isInitialized,
        isAuthenticated: this.service.isAuthenticated,
        isReady: this.service.isReady,
        waState: waState ? waState.toString() : 'N/A',
      }))
    );
  }

  @Post('initialize')
  @Roles([Role.ADMIN])
  initialize(): Observable<void> {
    return from(this.service.initialize());
  }

  @Get('chats')
  @Roles([Role.ADMIN])
  @ApiCreatedResponse({ type: [WhatsAppChatInfoDto] })
  getChats(): Observable<WhatsAppChatInfoDto[]> {
    return from(this.service.getChats()).pipe(
      map(chats => chats.map(chat => ({
        id: chat.id._serialized,
        name: chat.name,
        isGroup: chat.isGroup,
      })))
    );
  }

  @Post('send')
  @Roles([Role.ADMIN])
  @ApiCreatedResponse({ type: WhatsAppSentMessageDto })
  sendTestMessage(): Observable<WhatsAppSentMessageDto> {
    return from(this.service.send('Default Message')).pipe(
      map(messageId => ({ messageId: messageId._serialized }))
    );
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
        catchError((error: unknown) => {
          console.error(`Error while encoding QR code to image url`, error);
          return throwError(() => new QrCodeEncodingException(error));
        }),
      );
    }
    throw new GoneException();
  }
}
