import { Injectable } from '@nestjs/common';
import { Configuration, OpenAIApi } from 'openai';

// ...

@Injectable()
export class OpenaiService {
  private openAi;

  constructor() {
    // Replace 'YOUR_API_KEY' with your OpenAI API key
    const apiKey = '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';
    const cfg = new Configuration({
      apiKey: apiKey,
    });
    this.openAi = new OpenAIApi(cfg);
  }

  async askQuestion(question) {
    try {
      const msg = [{ role: 'user', content: question }];
      const response = await this.openAi.createChatCompletion({
        model: 'gpt-3.5-turbo',
        messages: msg,
      });

      const answer = response.data.choices[0].message.content;
      return answer;
    } catch (error) {
      console.log(error.response);
      // console.error('Something went wrong:', error);
      throw error;
    }
  }

  async generateImage(prompt) {
    try {
      const response = await this.openAi.createImage({
        prompt,
        n: 1,
        size: '1024x1024',
      });
      const image_url = response.data.data[0].url;
      return image_url;
    } catch (e) {
      console.error(e.response);
    }
  }
}
