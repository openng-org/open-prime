import * as ts from 'typescript';

interface Edit {
    start: number;
    end: number;
    replacement: string;
}

export interface StyleClassResult {
    text: string;
    changed: boolean;
    /** Number of `styleClass`/`[styleClass]` occurrences rewritten. */
    rewritten: number;
    /**
     * 1-based line numbers of opening tags left unrewritten because the tag already had a
     * conflicting `class`/`[class]` binding that a rewrite could not merge automatically.
     */
    conflictLines: number[];
}

/**
 * Finds the character ranges of every opening tag (`<selector ...>` or `<selector .../>`) for the
 * given tag name in an HTML fragment. Tracks quote state so a `>` inside a quoted attribute value
 * doesn't prematurely end a tag.
 */
function findOpeningTags(html: string, selector: string): Array<{ start: number; end: number }> {
    const tags: Array<{ start: number; end: number }> = [];
    const openRegex = new RegExp(`<${escapeRegExp(selector)}(?=[\\s/>])`, 'g');
    let match: RegExpExecArray | null;
    while ((match = openRegex.exec(html))) {
        const start = match.index;
        let i = start;
        let quote: string | null = null;
        while (i < html.length) {
            const ch = html[i];
            if (quote) {
                if (ch === '\\') {
                    i += 2;
                    continue;
                }
                if (ch === quote) {
                    quote = null;
                }
            } else if (ch === '"' || ch === "'") {
                quote = ch;
            } else if (ch === '>') {
                break;
            }
            i++;
        }
        if (i >= html.length) {
            // Unterminated tag — skip rather than risk consuming the rest of the document.
            continue;
        }
        tags.push({ start, end: i + 1 });
        openRegex.lastIndex = i + 1;
    }
    return tags;
}

/**
 * Builds a regex matching a single attribute occurrence for `namePattern` (already regex-escaped,
 * e.g. `styleClass` or `\[styleClass\]`): either a quoted value (`name="..."`/`name='...'`,
 * capturing the quote character in group 2 and its content in group 3) or an unquoted bare value
 * (`name=x`, captured in group 4) — so `class=existing` is recognized just like `class="existing"`.
 */
function makeAttrRegex(namePattern: string): RegExp {
    return new RegExp(`(\\s${namePattern}\\s*=\\s*)(?:(["'])((?:\\\\.|(?!\\2)[^\\\\])*)\\2|([^\\s/>"']+))`);
}

const STATIC_STYLE_CLASS = makeAttrRegex('styleClass');
const BOUND_STYLE_CLASS = makeAttrRegex('\\[styleClass\\]');
const STATIC_CLASS = makeAttrRegex('class');
const BOUND_CLASS = makeAttrRegex('\\[class\\]');

interface AttrMatch {
    index: number;
    length: number;
    /** Text before the value, e.g. ` styleClass=` or ` [class]=`, including the leading space. */
    prefix: string;
    /** The quote character used, or `null` if the value was unquoted (`name=x`). */
    quote: string | null;
    value: string;
}

/**
 * Runs `regex` (built by `makeAttrRegex`) against a quote-masked copy of `text` (see
 * `maskQuotedValues`), then normalizes the quoted/unquoted branch into a single shape so callers
 * don't need to care which one matched.
 */
function matchAttr(regex: RegExp, text: string): AttrMatch | null {
    const match = execUnmasked(regex, text);
    if (!match) {
        return null;
    }
    const quote = match[2] ?? null;
    const value = quote !== null ? match[3] : match[4];
    return { index: match.index, length: match[0].length, prefix: match[1], quote, value: value ?? '' };
}

function testAttr(regex: RegExp, text: string): boolean {
    return matchAttr(regex, text) !== null;
}

/**
 * Returns a copy of `tag` the same length as the input, with the interior of every quoted
 * attribute value replaced by a space. The result is never used as output — only to find safe
 * match offsets for the attribute regexes above, which are then applied/read against the
 * original, unmasked text — so `styleClass="..."`/`class="..."` appearing as literal text inside a
 * *different* attribute's quoted value (e.g. `aria-label='styleClass="do not edit"'`) can never be
 * mistaken for a real `styleClass`/`class` attribute.
 */
function maskQuotedValues(tag: string): string {
    const MASK = ' ';
    const out = tag.split('');
    let quote: string | null = null;
    let i = 0;
    while (i < out.length) {
        const ch = out[i];
        if (quote) {
            if (ch === '\\' && i + 1 < out.length) {
                out[i] = MASK;
                out[i + 1] = MASK;
                i += 2;
                continue;
            }
            if (ch === quote) {
                quote = null;
                i++;
                continue;
            }
            out[i] = MASK;
            i++;
            continue;
        }
        if (ch === '"' || ch === "'") {
            quote = ch;
        }
        i++;
    }
    return out.join('');
}

/**
 * Runs a non-global regex against a quote-masked copy of `text` to find a match position that can
 * never land inside another attribute's quoted value, then re-executes the same regex against the
 * corresponding slice of the original, unmasked `text` so the returned groups carry real content.
 * Masking only blanks quoted interiors (same length, same delimiters), so a match against the
 * masked text always has an identically-shaped match in the corresponding original slice.
 */
function execUnmasked(regex: RegExp, text: string): RegExpExecArray | null {
    const maskedMatch = regex.exec(maskQuotedValues(text));
    if (!maskedMatch) {
        return null;
    }
    const segment = text.slice(maskedMatch.index, maskedMatch.index + maskedMatch[0].length);
    const realMatch = regex.exec(segment);
    if (!realMatch) {
        return null;
    }
    const result = realMatch.slice() as RegExpExecArray;
    result.index = maskedMatch.index;
    result.input = text;
    return result;
}

/**
 * Rewrites `styleClass`/`[styleClass]` on a single opening tag into `class`/`[class]`:
 *
 * - `styleClass="x"` with no existing `class` attribute becomes `class="x"`; with an existing
 *   static `class="y"` the two are merged into `class="y x"`.
 * - `[styleClass]="expr"` with no existing `[class]` binding becomes `[class]="expr"`.
 * - `[styleClass]="expr"` alongside an existing `[class]="other"` binding is left in place and
 *   reported as a conflict — merging two arbitrary expressions isn't safe to do automatically.
 * - A static `styleClass="x"` alongside an existing `[class]` binding (or vice versa) is also left
 *   as a conflict, since a static/bound pair can't be merged into either single attribute either.
 *
 * All four attributes may be quoted (`name="x"`/`name='x'`) or unquoted (`name=x`) — `matchAttr`
 * normalizes either shape, so e.g. an existing unquoted `class=existing` is recognized and merged
 * into just as a quoted one would be, rather than being left behind as a duplicate `class`
 * attribute. Any rewritten or merged output is always written back quoted, since a merged value
 * generally contains a space and can't safely stay unquoted.
 *
 * All matching is done against a quote-masked copy of the tag (see `maskQuotedValues`), so
 * `styleClass`/`class` text that merely appears inside a different attribute's quoted value is
 * never treated as a real attribute.
 */
function rewriteTag(tag: string): { text: string; rewritten: number; conflict: boolean } {
    let text = tag;
    let rewritten = 0;
    let conflict = false;

    const boundStyleClass = matchAttr(BOUND_STYLE_CLASS, text);
    if (boundStyleClass) {
        const hasExistingClass = testAttr(BOUND_CLASS, text) || testAttr(STATIC_CLASS, text);
        if (hasExistingClass) {
            conflict = true;
        } else {
            const quote = boundStyleClass.quote ?? '"';
            const replacement = `${boundStyleClass.prefix.replace('[styleClass]', '[class]')}${quote}${boundStyleClass.value}${quote}`;
            text = text.slice(0, boundStyleClass.index) + replacement + text.slice(boundStyleClass.index + boundStyleClass.length);
            rewritten++;
        }
    }

    const staticStyleClass = matchAttr(STATIC_STYLE_CLASS, text);
    if (staticStyleClass) {
        if (testAttr(BOUND_CLASS, text)) {
            conflict = true;
        } else {
            const existingStaticClass = matchAttr(STATIC_CLASS, text);
            if (existingStaticClass) {
                const merged = `${existingStaticClass.value} ${staticStyleClass.value}`.trim();
                const quote = existingStaticClass.quote ?? '"';
                // Remove the styleClass attribute outright, then merge its value into the existing class attribute.
                const withoutStyleClass = text.slice(0, staticStyleClass.index) + text.slice(staticStyleClass.index + staticStyleClass.length);
                const reMatch = matchAttr(STATIC_CLASS, withoutStyleClass);
                text = reMatch ? withoutStyleClass.slice(0, reMatch.index) + reMatch.prefix + quote + merged + quote + withoutStyleClass.slice(reMatch.index + reMatch.length) : withoutStyleClass;
            } else {
                const quote = staticStyleClass.quote ?? '"';
                const replacement = `${staticStyleClass.prefix.replace('styleClass', 'class')}${quote}${staticStyleClass.value}${quote}`;
                text = text.slice(0, staticStyleClass.index) + replacement + text.slice(staticStyleClass.index + staticStyleClass.length);
            }
            rewritten++;
        }
    }

    return { text, rewritten, conflict };
}

function lineOf(text: string, offset: number): number {
    let line = 1;
    for (let i = 0; i < offset && i < text.length; i++) {
        if (text[i] === '\n') {
            line++;
        }
    }
    return line;
}

/**
 * Rewrites `styleClass`/`[styleClass]` into `class`/`[class]` on every opening tag matching one of
 * the given selectors within an HTML fragment (a standalone template file or the body of an inline
 * component template). Reports 1-based line numbers (relative to `html`) of any tags left
 * unrewritten due to a `class`/`[class]` conflict.
 */
export function rewriteStyleClassInHtml(html: string, selectors: readonly string[]): StyleClassResult {
    const edits: Edit[] = [];
    let rewritten = 0;
    const conflictOffsets: number[] = [];

    for (const selector of selectors) {
        for (const tag of findOpeningTags(html, selector)) {
            const original = html.slice(tag.start, tag.end);
            const result = rewriteTag(original);
            if (result.rewritten > 0) {
                edits.push({ start: tag.start, end: tag.end, replacement: result.text });
                rewritten += result.rewritten;
            }
            if (result.conflict) {
                conflictOffsets.push(tag.start);
            }
        }
    }

    const conflictLines = conflictOffsets.map((offset) => lineOf(html, offset));
    if (edits.length === 0) {
        return { text: html, changed: false, rewritten, conflictLines };
    }

    edits.sort((a, b) => b.start - a.start);
    let text = html;
    for (const edit of edits) {
        text = text.slice(0, edit.start) + edit.replacement + text.slice(edit.end);
    }
    return { text, changed: true, rewritten, conflictLines };
}

/**
 * Re-encodes `value` as the body of a string-literal-like node matching `node`'s original quote
 * style: a `NoSubstitutionTemplateLiteral` (backtick) is escaped for backticks, `\` and `${`; a
 * regular string literal is escaped for its own quote character (`'` or `"`, whichever `node` used)
 * plus `\` and line breaks. Pairs with `node.text`, which TypeScript already decodes for us — so a
 * round trip through `.text` and this function preserves the literal's real content exactly, unlike
 * slicing the raw source text (which still carries escapes like `\"`).
 */
function encodeLiteralBody(node: ts.StringLiteralLike, value: string): string {
    if (ts.isNoSubstitutionTemplateLiteral(node)) {
        const escaped = value.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
        return `\`${escaped}\``;
    }
    const quote = node.getText()[0];
    const escaped = value.replace(/\\/g, '\\\\').replace(new RegExp(quote, 'g'), `\\${quote}`).replace(/\r/g, '\\r').replace(/\n/g, '\\n');
    return `${quote}${escaped}${quote}`;
}

/**
 * Same rewrite, applied only inside the `template: \`...\`` string literal of an `@Component`
 * decorator in a TypeScript source file, so unrelated string literals elsewhere in the file are
 * never touched. Conflict line numbers are relative to the whole TypeScript file.
 *
 * Uses `initializer.text` — TypeScript's own decoded value of the string literal — rather than
 * slicing the raw source text between its quotes, since the raw text still carries the literal's
 * original escape sequences (e.g. `\"`). Treating those escapes as literal HTML content can
 * desynchronize the quote-tracking in `rewriteStyleClassInHtml`/`findOpeningTags` and cause the
 * opening tag to be skipped entirely. The rewritten value is re-escaped for the literal's original
 * quote style by `encodeLiteralBody` before being written back.
 */
export function rewriteStyleClassInTypeScript(fileName: string, text: string, selectors: readonly string[]): StyleClassResult {
    const sourceFile = ts.createSourceFile(fileName, text, ts.ScriptTarget.Latest, true);
    const edits: Edit[] = [];
    let rewritten = 0;
    const conflictLines: number[] = [];

    const visit = (node: ts.Node): void => {
        if (ts.isPropertyAssignment(node) && isDirectComponentTemplateProperty(node)) {
            const initializer = node.initializer;
            if (ts.isStringLiteralLike(initializer)) {
                const body = initializer.text;
                const result = rewriteStyleClassInHtml(body, selectors);
                if (result.changed) {
                    edits.push({ start: initializer.getStart(sourceFile), end: initializer.getEnd(), replacement: encodeLiteralBody(initializer, result.text) });
                    rewritten += result.rewritten;
                }
                if (result.conflictLines.length > 0) {
                    const bodyStart = initializer.getStart(sourceFile) + 1;
                    for (const bodyLine of result.conflictLines) {
                        const offset = offsetOfLine(body, bodyLine);
                        conflictLines.push(sourceFile.getLineAndCharacterOfPosition(bodyStart + offset).line + 1);
                    }
                }
            }
        }
        ts.forEachChild(node, visit);
    };
    visit(sourceFile);

    if (edits.length === 0) {
        return { text, changed: false, rewritten, conflictLines };
    }
    edits.sort((a, b) => b.start - a.start);
    let result = text;
    for (const edit of edits) {
        result = result.slice(0, edit.start) + edit.replacement + result.slice(edit.end);
    }
    return { text: result, changed: true, rewritten, conflictLines };
}

function offsetOfLine(text: string, oneBasedLine: number): number {
    let line = 1;
    for (let i = 0; i < text.length; i++) {
        if (line === oneBasedLine) {
            return i;
        }
        if (text[i] === '\n') {
            line++;
        }
    }
    return text.length;
}

function escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function isTemplateProperty(node: ts.PropertyAssignment): boolean {
    const name = node.name;
    return (ts.isIdentifier(name) || ts.isStringLiteral(name)) && name.text === 'template';
}

/**
 * True only for a `template` property that is a *direct* member of the object literal passed to
 * `@Component(...)` — not a `template` property nested deeper in that same argument (e.g. inside a
 * `providers: [{ useValue: { template: ... } }]` entry), and not a `template` property belonging to
 * some other decorator whose argument shape happens to also have one.
 */
function isDirectComponentTemplateProperty(node: ts.PropertyAssignment): boolean {
    if (!isTemplateProperty(node)) {
        return false;
    }
    const objectLiteral = node.parent;
    if (!ts.isObjectLiteralExpression(objectLiteral)) {
        return false;
    }
    const callExpression = objectLiteral.parent;
    if (!callExpression || !ts.isCallExpression(callExpression) || callExpression.arguments[0] !== objectLiteral) {
        return false;
    }
    const decorator = callExpression.parent;
    if (!decorator || !ts.isDecorator(decorator) || decorator.expression !== callExpression) {
        return false;
    }
    const decoratorExpression = callExpression.expression;
    return ts.isIdentifier(decoratorExpression) && decoratorExpression.text === 'Component';
}
