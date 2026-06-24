import { type RNG } from "@/phonetic";
import { EN_WORDS } from "@/phonetic";
import { type Settings } from "@/settings";
import { lessonLengthChars } from "./textgen.ts";

export type CodeSyntax = {
  readonly id: string;
  readonly name: string;
  /** Emits one plausible statement as a list of tokens. */
  readonly statement: (g: Gen) => string;
};

// Short, readable identifiers drawn from the common-word list.
const IDENTS = EN_WORDS.filter((w) => w.length >= 3 && w.length <= 7);

class Gen {
  constructor(private readonly rng: RNG) {}
  ident(): string {
    return IDENTS[this.rng.int(IDENTS.length)];
  }
  camel(): string {
    const a = this.ident();
    const b = this.ident();
    return a + b[0].toUpperCase() + b.slice(1);
  }
  num(): string {
    return String(this.rng.int(100));
  }
  str(): string {
    return `"${this.ident()}"`;
  }
  pick<T>(items: readonly T[]): T {
    return items[this.rng.int(items.length)];
  }
}

export const SYNTAXES: readonly CodeSyntax[] = [
  {
    id: "javascript",
    name: "JavaScript",
    statement: (g) =>
      g.pick([
        () => `const ${g.camel()} = ${g.ident()}(${g.ident()}, ${g.ident()});`,
        () => `function ${g.camel()}(${g.ident()}) { return ${g.ident()}.${g.ident()}; }`,
        () => `if (${g.ident()} === ${g.num()}) { ${g.camel()}(${g.str()}); }`,
        () => `const ${g.ident()} = [${g.ident()}, ${g.ident()}, ${g.ident()}];`,
        () => `${g.ident()}.map((${g.ident()}) => ${g.ident()} + ${g.num()});`,
        () => `export const ${g.camel()} = { ${g.ident()}: ${g.num()} };`,
      ])(),
  },
  {
    id: "python",
    name: "Python",
    statement: (g) =>
      g.pick([
        () => `def ${g.ident()}(${g.ident()}, ${g.ident()}): return ${g.ident()}`,
        () => `${g.ident()} = [${g.ident()}, ${g.ident()}, ${g.num()}]`,
        () => `if ${g.ident()} == ${g.num()}: ${g.ident()}(${g.str()})`,
        () => `${g.ident()} = {${g.str()}: ${g.num()}, ${g.str()}: ${g.num()}}`,
        () => `for ${g.ident()} in ${g.ident()}: print(${g.ident()})`,
        () => `class ${g.ident()}: pass`,
      ])(),
  },
  {
    id: "json",
    name: "JSON",
    statement: (g) =>
      g.pick([
        () => `{ ${g.str()}: ${g.num()}, ${g.str()}: ${g.str()} },`,
        () => `{ ${g.str()}: [${g.num()}, ${g.num()}, ${g.num()}] },`,
        () => `{ ${g.str()}: { ${g.str()}: ${g.str()} } },`,
        () => `{ ${g.str()}: true, ${g.str()}: false },`,
      ])(),
  },
  {
    id: "html",
    name: "HTML",
    statement: (g) => {
      const tag = g.pick(["div", "span", "p", "li", "a", "h1", "section"]);
      return g.pick([
        () => `<${tag} class=${g.str()}>${g.ident()}</${tag}>`,
        () => `<${tag} id=${g.str()}>${g.ident()} ${g.ident()}</${tag}>`,
        () => `<a href=${g.str()}>${g.ident()}</a>`,
        () => `<input type=${g.str()} value=${g.str()} />`,
      ])();
    },
  },
  {
    id: "sql",
    name: "SQL",
    statement: (g) =>
      g.pick([
        () => `SELECT ${g.ident()}, ${g.ident()} FROM ${g.ident()};`,
        () => `UPDATE ${g.ident()} SET ${g.ident()} = ${g.num()} WHERE ${g.ident()} = ${g.num()};`,
        () => `INSERT INTO ${g.ident()} (${g.ident()}, ${g.ident()}) VALUES (${g.num()}, ${g.str()});`,
        () => `DELETE FROM ${g.ident()} WHERE ${g.ident()} = ${g.str()};`,
      ])(),
  },
];

export function syntaxById(id: string): CodeSyntax {
  return SYNTAXES.find((s) => s.id === id) ?? SYNTAXES[0];
}

/**
 * Generates a code lesson: plausible statements in the chosen syntax, joined on
 * one line so every character (including brackets and operators) is typeable
 * without needing Enter or indentation.
 */
export function generateCodeText(settings: Settings, rng: RNG): string {
  const syntax = syntaxById(settings.code.syntax);
  const gen = new Gen(rng);
  const target = lessonLengthChars(settings);
  const parts: string[] = [];
  let length = 0;
  while (length < target) {
    const stmt = syntax.statement(gen);
    parts.push(stmt);
    length += stmt.length + 1;
  }
  return parts.join(" ");
}
