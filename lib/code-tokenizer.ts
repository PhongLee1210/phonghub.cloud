export type TokenType = "keyword" | "string" | "comment" | "number" | "default";

export interface CodeToken {
  text: string;
  type: TokenType;
}

const TS_KEYWORDS = new Set([
  "import",
  "export",
  "async",
  "const",
  "let",
  "return",
  "from",
  "function",
  "await",
  "type",
  "interface",
  "for",
  "of",
  "if",
  "else",
  "new",
  "throw",
  "true",
  "false",
  "null",
  "undefined",
]);

const PY_KEYWORDS = new Set([
  "def",
  "class",
  "async",
  "await",
  "return",
  "from",
  "import",
  "for",
  "in",
  "if",
  "else",
  "with",
  "True",
  "False",
  "None",
]);

export function tokenizeLine(
  line: string,
  lang: "typescript" | "python",
): CodeToken[] {
  if (line.trim() === "") {
    return [{ text: line, type: "default" }];
  }

  const trimmed = line.trim();

  // Full-line comment
  if (trimmed.startsWith("//") || trimmed.startsWith("#")) {
    return [{ text: line, type: "comment" }];
  }

  const keywords = lang === "python" ? PY_KEYWORDS : TS_KEYWORDS;
  const tokens: CodeToken[] = [];
  let i = 0;

  while (i < line.length) {
    // String literals (single or double quote)
    if (line[i] === '"' || line[i] === "'") {
      const quote = line[i];
      let j = i + 1;
      while (j < line.length && line[j] !== quote) {
        if (line[j] === "\\") j++; // skip escaped char
        j++;
      }
      j++; // include closing quote
      tokens.push({ text: line.slice(i, j), type: "string" });
      i = j;
      continue;
    }

    // Template literals
    if (line[i] === "`") {
      let j = i + 1;
      while (j < line.length && line[j] !== "`") {
        if (line[j] === "\\") j++;
        j++;
      }
      j++;
      tokens.push({ text: line.slice(i, j), type: "string" });
      i = j;
      continue;
    }

    // Numbers
    if (/[0-9]/.test(line[i]) && (i === 0 || /\W/.test(line[i - 1]))) {
      let j = i;
      while (j < line.length && /[0-9.]/.test(line[j])) j++;
      tokens.push({ text: line.slice(i, j), type: "number" });
      i = j;
      continue;
    }

    // Words (keywords or identifiers)
    if (/[a-zA-Z_$]/.test(line[i])) {
      let j = i;
      while (j < line.length && /[a-zA-Z0-9_$]/.test(line[j])) j++;
      const word = line.slice(i, j);
      tokens.push({ text: word, type: keywords.has(word) ? "keyword" : "default" });
      i = j;
      continue;
    }

    // Everything else: accumulate non-word chars
    let j = i;
    while (
      j < line.length &&
      !/[a-zA-Z_$0-9"'`]/.test(line[j]) &&
      !(line[j] === "/" && line[j + 1] === "/") &&
      !(line[j] === "#")
    ) {
      j++;
    }
    if (j > i) {
      tokens.push({ text: line.slice(i, j), type: "default" });
      i = j;
    } else {
      tokens.push({ text: line[i], type: "default" });
      i++;
    }
  }

  return tokens;
}
