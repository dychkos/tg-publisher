import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { OpenaiService } from './openai/openai.service';
import { OpenaiModule } from './openai/openai.module';
import { TelegramModule } from './telegram/telegram.module';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [OpenaiModule, TelegramModule, PrismaModule, ConfigModule.forRoot()],
  controllers: [AppController],
  providers: [AppService, OpenaiService],
})
export class AppModule {}
