import messages from "./messages.json";

type Messages = typeof messages;

type LocaleMessages = Messages[keyof Messages];

export function getMessages(lang: string): LocaleMessages {
  if (Object.prototype.hasOwnProperty.call(messages, lang)) {
    return messages[lang as keyof Messages];
  }
  return messages.en;
}

export function formatMessage(
  template: string,
  values: Record<string, string | number>,
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    const value = values[key];
    return value === undefined || value === null ? "" : String(value);
  });
}
