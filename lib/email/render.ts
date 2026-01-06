type RenderOptions = {
  escape?: (value: string) => string;
};

export function renderTemplate(
  template: string,
  context: Record<string, string>,
  options: RenderOptions = {},
) {
  return template.replace(/\{\{\s*([\w]+)\s*\}\}/g, (_match, token) => {
    const rawValue = context[token] ?? "";
    return options.escape ? options.escape(rawValue) : rawValue;
  });
}

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
