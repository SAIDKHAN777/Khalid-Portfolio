import { marked } from 'marked';
import sanitizeHtml from 'sanitize-html';

export async function renderAndSanitizeMarkdown(markdown: string): Promise<string> {
  if (!markdown) return '';

  // Render raw HTML from Markdown
  const rawHtml = await marked.parse(markdown);

  // Strict sanitization with rich blog elements preserved
  return sanitizeHtml(rawHtml, {
    allowedTags: [
      ...sanitizeHtml.defaults.allowedTags,
      'img',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'del',
      'ins',
    ],
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      img: ['src', 'alt', 'title', 'width', 'height', 'loading'],
      a: ['href', 'title', 'target', 'rel'],
      code: ['class'],
      pre: ['class'],
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    transformTags: {
      a: sanitizeHtml.simpleTransform('a', {
        rel: 'noopener noreferrer',
        target: '_blank',
      }),
    },
  });
}

export function calculateReadingTime(text: string, wordsPerMinute = 200): number {
  if (!text) return 1;
  const wordCount = text.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
}
