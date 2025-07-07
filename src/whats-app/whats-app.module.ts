import { Module } from '@nestjs/common';
import { WhatsAppController } from './whats-app.controller';
import { WhatsAppService } from './whats-app.service';

@Module({
  imports: [],
  controllers: [WhatsAppController],
  providers: [WhatsAppService],
  exports: [WhatsAppService]
})
export class WhatsAppModule {}
