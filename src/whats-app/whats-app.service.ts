import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Chat, Client, LocalAuth, MessageId, WAState } from 'whatsapp-web.js';
import { Logger } from 'winston';
import { resolve } from 'path';
import { WhatsAppClientInitializationException } from './exception/whats-app-client-initialization.exception';
import { WhatsAppClientNotReadyException } from './exception/whats-app-client-not-ready.exception';
import { WhatsAppMessageNotSentException } from './exception/whats-app-message-not-sent.exception';

@Injectable()
export class WhatsAppService {

  private client: Client = null;

  isInitialized: boolean =  false;
  isAuthenticated: boolean = false;
  isReady: boolean = false;

  latestQrCode: { datetime: Date, qr: string } = null;

  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    private configService: ConfigService
  ) {
    this.logger.defaultMeta = { context: WhatsAppService.name };
    this.initialize();
  }

  public async initialize(): Promise<void> {
    if (!!this.client) {
      this.reset();
      await this.client.destroy();
      this.logger.info(`EXISTING CLIENT DESTROYED`);
    }

    this.client = new Client({
      puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      },
      authStrategy: new LocalAuth({
        clientId: this.configService.get<string>('WHATSAPP_CLIENT_ID'),
        dataPath: resolve(__dirname, '..', '..', 'whatsapp-auth-data'),
      }),
    });

    this.setupListeners();
    return this.client.initialize()
      .then(() => {
        this.logger.info(`CLIENT INITIALIZED`);
        this.isInitialized = true;
      })
      .catch(error => {
        this.logger.error(`Error during client initialization`, { error });
        throw new WhatsAppClientInitializationException(error);
      });
  }
  
  private setupListeners(): void {
    this.client.on('ready', () => {
      this.logger.info('CLIENT IS READY');
      this.isReady = true;
      this.latestQrCode = null;
    });

    this.client.on('authenticated', () => {
      this.logger.info('AUTHENTICATED');
      this.isAuthenticated = true;
    });

    this.client.on('auth_failure', msg => {
      this.logger.error(`AUTHENTICATION FAILURE: ${msg}`);
      this.isAuthenticated = false;
    });

    this.client.on('disconnected', reason => {
      this.logger.error(`DISCONNECTED: ${reason.toString()}`);
      this.reset();
    });

    this.client.on('qr', qr => {
      this.logger.info('QR CODE GENERATED');
      this.latestQrCode = { datetime: new Date(), qr };
    });
  }

  private reset(): void {
    this.isInitialized = false;
    this.isAuthenticated = false;
    this.isReady = false;
    this.latestQrCode = null;
  }

  getState(): Promise<WAState> {
    return this.client.getState();
  }

  getChats(): Promise<Chat[]> {
    if (!this.isReady) {
      this.logger.info('Tried to get chats, but client was not ready yet!');
      throw new WhatsAppClientNotReadyException();
    }

    try {
      this.logger.info('Successfully got chats');
      return this.client.getChats();
    } catch (error: unknown) {
      this.logger.error(`Error during getting chats: ${error}`);
    }
  }
  
  async send(message: string): Promise<MessageId> {
    if (!this.isReady) {
      this.logger.info('Tried to send a message, but client was not ready yet!');
      throw new WhatsAppClientNotReadyException();
    }

    const chatId = this.configService.get<string>('WHATSAPP_CHAT_ID');

    try {
      this.logger.info('About to send message...', { chatId, message });
      const messageResponse = await this.client.sendMessage(chatId, message, { linkPreview: false });
      await messageResponse.pin(7 * 24 * 60 * 60);
      this.logger.info('Message sent successfully', { id: messageResponse.id });
      return messageResponse.id;
    } catch (error: unknown) {
      this.logger.error(`Error during sending message`, { error });
      throw new WhatsAppMessageNotSentException(error);
    }
  }

}
