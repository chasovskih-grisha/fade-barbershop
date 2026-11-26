// PreviewArticle — прев'ю тіла статті без збереження (T-2300d). Тіло розбирає
// той самий парсер, що й публікація: прев'ю не показує те, чого не буде на сайті.

import {
  InvalidArticleBodyError,
  parseArticleBody,
  type ArticleBlock,
} from '../domain/article-body';
import { InvalidArticleInputError } from './content-errors';

export interface PreviewArticleInput {
  body: string;
}

export class PreviewArticleHandler {
  handle(input: PreviewArticleInput): { blocks: ArticleBlock[] } {
    try {
      return { blocks: parseArticleBody(input.body) };
    } catch (error) {
      if (error instanceof InvalidArticleBodyError) {
        throw new InvalidArticleInputError(error.message);
      }
      throw error;
    }
  }
}
