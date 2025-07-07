import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Chat, Client, LocalAuth } from 'whatsapp-web.js';
import { Logger } from 'winston';
import { resolve } from 'path';

@Injectable()
export class WhatsAppService {

  private client: Client = null;

  isReady: boolean = false;
  latestQrCode: { datetime: Date, qr: string } = null;

  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    private configService: ConfigService
  ) {
    this.logger.defaultMeta = { context: WhatsAppService.name };
    this.initialize();
  }
  
  private initialize(): void {
    // TODO: remove as soon as LocalAuth is stable
    // mongoose.connect(this.buildConnectionUri(), { authSource: 'admin' })
    //   .catch((error: Error) => this.logger.error(`Error during connection to mongodb: ${error.message}`))
    //   .then(() => {
    //     this.logger.info(`Successfully connected to mongodb`);
    //     const store = new MongoStore({ mongoose });
    //     this.client = new Client({
    //       puppeteer: {
    //         // headless: true, // necessary for docker?
    //         // executablePath: '/usr/bin/chromium', // necessary for docker?
    //         args: ['--no-sandbox', '--disable-setuid-sandbox'],
    //       },
    //       authStrategy: new RemoteAuth({
    //         store,
    //         clientId: this.configService.get<string>('WHATSAPP_CLIENT_ID'),
    //         backupSyncIntervalMs: 300_000
    //       }),
    //     });
    //
    //     this.setupListeners();
    //     this.client.initialize();
    //   })
    //   .catch((error: Error) => this.logger.error(`Error during initializing the client: ${error.message}`));

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
    this.client.initialize()
      .then(() => this.logger.info(`CLIENT INITIALIZED`))
      .catch(error => this.logger.error(`Error during client initialization`, error));
  }
  
  private setupListeners(): void {
    this.client.on('ready', async () => {
      this.logger.info('CLIENT IS READY');
      this.isReady = true;
      this.latestQrCode = null;
    });

    // TODO: remove as soon as LocalAuth is stable
    // this.client.on('remote_session_saved', () => {
    //   this.logger.info('SESSION SAVED SUCCESSFULLY');
    // });

    this.client.on('authenticated', () => {
      this.logger.info('AUTHENTICATED');
    });

    this.client.on('auth_failure', msg => {
      this.logger.error(`AUTHENTICATION FAILURE: ${msg}`);
    });

    this.client.on('disconnected', reason => {
      this.logger.error(`DISCONNECTED: ${reason.toString()}`);
    });

    this.client.on('qr', qr => {
      this.logger.info('QR CODE GENERATED');
      this.latestQrCode = { datetime: new Date(), qr };
    });

    // TODO: remove as soon as LocalAuth is stable
    // this.client.on('remote_session_saved', () => {
    //   this.logger.info('REMOTE SESSION SAVED');
    // });
  }

  // TODO: remove as soon as LocalAuth is stable
  // private buildConnectionUri(): string {
  //   return `mongodb://${this.configService.get<string>('MONGO_USER')}:${this.configService.get<string>('MONGO_PASSWORD')}@${this.configService.get<string>('MONGO_HOST')}:${this.configService.get<string>('MONGO_PORT')}/schocken`;
  // }

  async getChats(): Promise<Chat[]> {
    if (!this.isReady) {
      this.logger.info('Tried to get chats, but client was not ready yet!');
      return;
    }

    try {
      this.logger.info('Successfully got chats');
      return this.client.getChats();
    } catch (error: unknown) {
      this.logger.error(`Error during getting chats: ${error}`);
    }
  }
  
  async send(message: string): Promise<void> {
    if (!this.isReady) {
      this.logger.info('Tried to send a message, but client was not ready yet!');
      return;
    }

    const chatId = this.configService.get<string>('WHATSAPP_CHAT_ID');

    try {
      this.logger.info('About to send message...', { chatId, message });
      const messageResponse = await this.client.sendMessage(chatId, message, { linkPreview: false });
      await messageResponse.pin(7 * 24 * 60 * 60);
      this.logger.info('Message sent successfully', messageResponse.id);
    } catch (error: unknown) {
      this.logger.error(`Error during sending message: ${error}`);
    }
  }

}
