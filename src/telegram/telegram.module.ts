import { Module } from '@nestjs/common';
import { TelegramService } from './telegram.service';
import { OpenaiService } from '../openai/openai.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  providers: [TelegramService, OpenaiService, PrismaService],
  exports: [TelegramService],
})
export class TelegramModule {}
