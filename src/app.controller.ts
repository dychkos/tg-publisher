import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { OpenaiService } from './openai/openai.service';
import { TelegramService } from './telegram/telegram.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly openaiService: OpenaiService,
    private readonly telegramService: TelegramService,
  ) {}

  @Get()
  getHello(): string {
    // this.telegramService.sendMessage('test');
    // eslint-disable-next-line @typescript-eslint/no-var-requires

    return 'ready to use';
    // return this.appService.getHello();
  }

  @Post()
  getAnswer(@Body() dto: { question: string }) {
    return this.openaiService.askQuestion(dto.question);
  }
}
