import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class SharedService {
  private readonly logger = new Logger(SharedService.name);

  public async fetchLemmatizedString(text: string) {
    try {
      this.logger.log(`Lemmatizing the text: ${text}`);
      const response = await axios.post('http://lemmatizer:5000/lemmatize', {
        text,
      });
      return response.data.lemmatized_text;
    } catch (error) {
      this.logger.error(error.message);
      throw new Error('Failed to lemmatize the text');
    }
  }
}
