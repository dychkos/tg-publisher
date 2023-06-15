import { Injectable, OnModuleInit } from '@nestjs/common';
import * as TelegramBot from 'node-telegram-bot-api';
import { Message } from 'node-telegram-bot-api';
import { OpenaiService } from '../openai/openai.service';
import { markdownv2 as format } from 'telegram-format';
import { PrismaService } from '../prisma/prisma.service';
import { Publication } from '@prisma/client';
import * as process from 'process';

interface TelegramPublication {
  title: string;
  content: string;
  imagePath: string;
}

@Injectable()
export class TelegramService implements OnModuleInit {
  TOKEN = '5940308955:AAGeW1dnr0OIC_2dxSTIoSMYa1tTgtuZZkA';
  CHANNEL_ID = process.env.CHANNEL_ID;

  private tg;

  constructor(
    private readonly ai: OpenaiService,
    private readonly prisma: PrismaService,
  ) {
    this.tg = new TelegramBot(this.TOKEN, { polling: true });
  }

  async initPublisher() {
    this.tg.on('message', async (msg: Message) => {
      const chatId = msg.chat.id;
      console.log(chatId, msg.chat.first_name);

      if (msg.text == '/start') {
        this.sendMessage(
          chatId,
          'Привіт ' + msg.chat?.first_name + ', введи заголовок публікації ⬇️',
        );
        return;
      }

      let user = await this.prisma.user.findUnique({
        where: { chatId },
      });

      if (!user)
        user = await this.prisma.user.create({
          data: { chatId },
        });

      if (user.busy) {
        this.sendMessage(chatId, 'Дочейкайтесь виконання попереднього запиту.');
        return;
      }

      await this.prisma.user.update({
        where: { chatId },
        data: { busy: true },
      });

      if (!user.editMode) {
        this.sendMessage(chatId, 'Генерую відповідь...');
        console.log('Find answer to:', msg.text);

        if (
          await this.prisma.publication.findFirst({
            where: { authorId: user.id },
          })
        ) {
          await this.prisma.publication.delete({
            where: { authorId: user.id },
          });
        }
        const answer: TelegramPublication = await this.generateAIAnswer(
          msg.text,
        );

        const publication: Publication = await this.prisma.publication.create({
          data: {
            ...answer,
            author: {
              connect: { id: user.id },
            },
          },
        });

        await this.sendPublication(chatId, publication);
      }

      switch (user.editMode) {
        case 'TITLE_EDIT': {
          const publication = await this.prisma.publication.update({
            where: { authorId: user.id },
            data: { title: msg.text },
          });
          await this.sendPublication(chatId, publication);
          break;
        }

        case 'BODY_EDIT': {
          const publication = await this.prisma.publication.update({
            where: { authorId: user.id },
            data: { content: msg.text },
          });
          await this.sendPublication(chatId, publication);
          break;
        }

        case 'IMAGE_EDIT': {
          if (!msg.photo) return;

          const fileId = msg.photo[0].file_id;
          const publication = await this.prisma.publication.update({
            where: { authorId: user.id },
            data: { imagePath: fileId },
          });
          await this.sendPublication(chatId, publication);
        }
      }

      await this.setUpEditMode(chatId);
      await this.prisma.user.update({
        where: { chatId },
        data: { busy: false },
      });
    });

    this.tg.on('callback_query', async (query) => {
      const buttonId = query.data;
      const chatId = query.message.chat.id;
      const messageId = query.message.message_id;
      console.log(messageId);

      try {
        const user = await this.prisma.user.findUnique({ where: { chatId } });

        if (!user) return;
        const userId = user.id;

        // Handle the button press based on the buttonId
        switch (buttonId) {
          case 'edit-title':
            await this.prisma.user.update({
              where: { id: userId },
              data: { editMode: 'TITLE_EDIT' },
            });
            this.sendMessage(chatId, 'Чекаю на виправлений заголовок.');
            break;
          case 'edit-body':
            await this.prisma.user.update({
              where: { id: userId },
              data: { editMode: 'BODY_EDIT' },
            });
            this.sendMessage(chatId, 'Чекаю на виправлений контент.');
            break;
          case 'edit-img':
            await this.prisma.user.update({
              where: { id: userId },
              data: { editMode: 'IMAGE_EDIT' },
            });
            this.sendMessage(chatId, 'Чекаю на нове зображення.');
            break;
          case 'send':
            await this.prisma.user.update({
              where: { id: userId },
              data: { editMode: null },
            });
            const publication = await this.prisma.publication.findFirst({
              where: { authorId: userId },
            });
            await this.sendPublication(this.CHANNEL_ID, publication);
            this.sendMessage(chatId, 'Опубліковано!');
            await this.prisma.publication.delete({
              where: { authorId: userId },
            });
            break;
          case 'cancel':
            await this.prisma.user.update({
              where: { id: userId },
              data: { editMode: null },
            });
            await this.prisma.publication.delete({
              where: { authorId: userId },
            });
            this.sendMessage(chatId, 'Введіть новий запит на публікацію:');
            break;
          default:
            await this.prisma.user.update({
              where: { id: userId },
              data: { editMode: null },
            });
        }
      } catch (e) {
        console.log(e);
        this.sendMessage(chatId, 'Упс, щось поламалось');
      }
    });
  }

  async generateAIAnswer(aiQuestion: string): Promise<TelegramPublication> {
    const res = await this.ai.askQuestion(aiQuestion);

    const image = await this.ai.generateImage(aiQuestion);
    return {
      title: aiQuestion,
      content: res,
      imagePath: image,
    };
  }

  async setUpEditMode(chatId: number) {
    const buttons = [
      [
        { text: 'Edit title', callback_data: 'edit-title' },
        { text: 'Edit body', callback_data: 'edit-body' },
      ],
      [{ text: 'Edit image', callback_data: 'edit-img' }],
      [
        { text: 'Send ✅', callback_data: 'send' },
        { text: 'Сancel ❌', callback_data: 'cancel' },
      ],
    ];

    await this.sendMessageWithButtons(
      chatId,
      'Доступно редагування публікації.',
      buttons,
    );
  }

  async sendMessageWithButtons(chatId, message, buttons) {
    await this.tg.sendMessage(chatId, message, {
      reply_markup: {
        inline_keyboard: buttons,
      },
    });
  }

  async sendPublication(groupId, answer: TelegramPublication) {
    const formatted = this.buildMessage(answer.title, answer.content);

    await this.tg
      .sendPhoto(groupId, answer.imagePath, {
        caption: formatted,
        parse_mode: 'Markdown',
      })
      .then(() => {
        console.log('AI Answer was sent!');
      })
      .catch((error) => {
        console.error('Error sending image:', error);
      });
  }

  async sendImage(groupId, msg, imgPath) {
    this.tg
      .sendPhoto(groupId, imgPath, {
        caption: msg,
        parse_mode: 'Markdown',
      })
      .then(() => {
        console.log('Image sent successfully');
      })
      .catch((error) => {
        console.error('Error sending image:', error);
      });
  }

  async findChannelIdByName(channelLink) {
    // const channelLink = '@tg_publisher_test';
    try {
      this.tg
        .getChat(channelLink)
        .then((channelInfo) => {
          const chatId = channelInfo.id;
          console.log('Channel ID:', chatId);
          return chatId;
        })
        .catch((error) => {
          console.error('Error retrieving channel information:', error);
        });
    } catch (e) {
      console.error(e);
      return null;
    }
  }

  private buildMessage(title, body) {
    title = format.bold(title);
    // body = format.monospace(body.substring(0, 800));
    body = body.substring(0, 800);

    return title + ' \n ' + ' \n ' + body;
  }

  sendMessage(groupId, messageText) {
    this.tg
      .sendMessage(groupId, messageText)
      .then(() => {
        console.log(messageText);
      })
      .catch((error) => {
        console.error('Error sending message:', error);
      });
  }

  onModuleInit(): any {
    this.initPublisher();
  }
}
