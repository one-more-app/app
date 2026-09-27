const NOTION_RICH_TEXT_MAX = 2000;

export function notionRichText(content: string) {
  return {
    rich_text: [
      {
        type: 'text' as const,
        text: { content: content.slice(0, NOTION_RICH_TEXT_MAX) },
      },
    ],
  };
}
