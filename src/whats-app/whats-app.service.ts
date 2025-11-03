import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Chat, Client, LocalAuth, MessageId, WAState } from 'whatsapp-web.js';
import { Logger } from 'winston';
import { resolve } from 'path';
import { rm } from 'fs/promises';
import { WhatsAppClientInitializationException } from './exception/whats-app-client-initialization.exception';
import { WhatsAppClientNotReadyException } from './exception/whats-app-client-not-ready.exception';
import { WhatsAppMessageNotSentException } from './exception/whats-app-message-not-sent.exception';
import { v4 } from 'uuid';

@Injectable()
export class WhatsAppService {

  private client: Client = null;

  private logHistory: { id: string; message: string; type: 'info' | 'error'; datetime: string }[] = [];

  isInitialized: boolean =  false;
  isAuthenticated: boolean = false;
  isReady: boolean = false;
  isDestroyed: boolean = false;

  latestQrCode: { datetime: Date, qr: string } = null;

  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    private configService: ConfigService
  ) {
    this.logger.defaultMeta = { context: WhatsAppService.name };

    this.initialize().catch((error: unknown) => {
      this.logger.error(error);
      this.log(error.toString(), 'error');
    });

    process.on('uncaughtException', (error) => {
      this.logger.error('uncaughtException', { error });
      this.log(error.toString(), 'error');
    });

    process.on('unhandledRejection', (error) => {
      this.logger.error('unhandledRejection', { error });
      this.log(error.toString(), 'error');
    });
  }

  public async initialize(): Promise<void> {
    await this.destroy();

    this.client = new Client({
      puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      },
      authStrategy: new LocalAuth({
        clientId: this.configService.get<string>('WHATSAPP_CLIENT_ID'),
        dataPath: resolve(__dirname, '..', '..', 'whatsapp-auth-data'),
        rmMaxRetries: 10,
      }),
    });

    this.setupListeners();
    return this.client.initialize()
      .then(() => {
        this.logger.info(`CLIENT INITIALIZED`);
        this.log('CLIENT INITIALIZED');
        this.isInitialized = true;
        this.isDestroyed = false;
      })
      .catch(error => {
        this.logger.error(`Error during client initialization`, { error });
        this.log(`Error during client initialization`, 'error');
        throw new WhatsAppClientInitializationException(error);
      });
  }

  public async purge(): Promise<void> {
    await this.destroy();
    await rm(resolve(__dirname, '..', '..', 'whatsapp-auth-data'), { recursive: true, force: true });
  }

  private async destroy(): Promise<void> {
    if (!!this.client) {
      this.reset();
      await this.client.destroy();
      this.isDestroyed = true;
      this.logger.info(`EXISTING CLIENT DESTROYED`);
      this.log('EXISTING CLIENT DESTROYED');
    }
  }
  
  private setupListeners(): void {
    this.client.on('ready', () => {
      this.logger.info('CLIENT IS READY');
      this.log('CLIENT IS READY');
      this.isReady = true;
      this.latestQrCode = null;
    });

    this.client.on('authenticated', () => {
      this.logger.info('AUTHENTICATED');
      this.log('AUTHENTICATED');
      this.isAuthenticated = true;
    });

    this.client.on('auth_failure', msg => {
      this.logger.error(`AUTHENTICATION FAILURE: ${msg}`);
      this.log(`AUTHENTICATION FAILURE: ${msg}`, 'error');
      this.isAuthenticated = false;
    });

    this.client.on('disconnected', reason => {
      this.logger.error(`DISCONNECTED: ${reason.toString()}`);
      this.log(`DISCONNECTED: ${reason.toString()}`, 'error');
      this.reset();
    });

    this.client.on('qr', qr => {
      this.logger.info('QR CODE GENERATED');
      this.log('QR CODE GENERATED');
      this.latestQrCode = { datetime: new Date(), qr };
    });
  }

  private reset(): void {
    this.isInitialized = false;
    this.isAuthenticated = false;
    this.isReady = false;
    this.isDestroyed = false;
    this.latestQrCode = null;
  }

  private log(message: string, type: 'info' | 'error' = 'info'): void {
    this.logHistory.push({ id: v4(), type, message, datetime: new Date().toISOString() });
  }

  getLogHistory(): { id: string; message: string; type: 'info' | 'error'; datetime: string }[] {
    return this.logHistory;
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
      this.log('Tried to send a message, but client was not ready yet!');
      throw new WhatsAppClientNotReadyException();
    }

    const chatId = this.configService.get<string>('WHATSAPP_CHAT_ID');

    try {
      this.logger.info('About to send message...', { chatId, message });
      const messageResponse = await this.client.sendMessage(chatId, message, { linkPreview: false });
      await messageResponse.pin(7 * 24 * 60 * 60);
      this.logger.info('Message sent successfully', { id: messageResponse.id });
      this.log('Message sent successfully, id=' + messageResponse.id);
      return messageResponse.id;
    } catch (error: unknown) {
      this.logger.error(`Error during sending message`, { error });
      this.log(`Error during sending message: ${error.toString()}`, 'error');
      throw new WhatsAppMessageNotSentException(error);
    }
  }

}
