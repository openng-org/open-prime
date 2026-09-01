import * as ts from 'typescript';

interface Edit {
    start: number;
    end: number;
    replacement: string;
}

export interface RemovalResult {
    text: string;
    changed: boolean;
    removed: string[];
}

function bindingRegex(names: readonly string[]): RegExp {
    // An Angular event binding for one of the given output names: `(name)="..."`, single- or
    // double-quoted. Matches the leading whitespace too, so removing it does not leave a stray
    // gap between the surrounding attributes.
    const alternation = names.map(escapeRegExp).join('|');
    return new RegExp(`\\s*\\((${alternation})\\)\\s*=\\s*(["'])(?:\\\\.|(?!\\2)[^\\\\])*\\2`, 'g');
}

/**
 * Removes `(name)="..."` event bindings for the given output names from an HTML fragment (a
 * standalone template file or the body of an inline component template).
 */
export function removeBindings(html: string, names: readonly string[]): RemovalResult {
    const removed: string[] = [];
    const text = html.replace(bindingRegex(names), (_match, name: string) => {
        removed.push(name);
        return '';
    });
    return { text, changed: removed.length > 0, removed };
}

/**
 * Same removal, applied only inside the `template: \`...\`` string literal of an `@Component`
 * decorator in a TypeScript source file — mirrors utils/primeflex.ts's translateTypeScript so
 * unrelated string literals elsewhere in the file are never touched.
 */
export function removeBindingsInTypeScript(fileName: string, text: string, names: readonly string[]): RemovalResult {
    const sourceFile = ts.createSourceFile(fileName, text, ts.ScriptTarget.Latest, true);
    const edits: Edit[] = [];
    const removed: string[] = [];

    const visit = (node: ts.Node): void => {
        if (ts.isPropertyAssignment(node) && isTemplateProperty(node) && isInsideDecorator(node)) {
            const initializer = node.initializer;
            if (ts.isStringLiteralLike(initializer)) {
                const raw = initializer.getText(sourceFile);
                const quote = raw[0];
                const body = raw.slice(1, -1);
                const result = removeBindings(body, names);
                if (result.changed) {
                    edits.push({ start: initializer.getStart(sourceFile), end: initializer.getEnd(), replacement: `${quote}${result.text}${quote}` });
                    removed.push(...result.removed);
                }
            }
        }
        ts.forEachChild(node, visit);
    };
    visit(sourceFile);

    if (edits.length === 0) {
        return { text, changed: false, removed };
    }
    edits.sort((a, b) => b.start - a.start);
    let result = text;
    for (const edit of edits) {
        result = result.slice(0, edit.start) + edit.replacement + result.slice(edit.end);
    }
    return { text: result, changed: true, removed };
}

/**
 * Finds references to the given (removed) output names that a binding-removal pass does not
 * rewrite automatically: TypeScript property access (e.g. `.subscribe(...)`/`.emit(...)` on a
 * queried/injected component instance) and object-literal properties of the same name (config
 * callbacks that mirrored the output, e.g. `OverlayOptions.onAnimationStart`). Returns the
 * 1-based line number of each reference found.
 */
export function findLeftoversInTypeScript(fileName: string, text: string, names: readonly string[]): number[] {
    const sourceFile = ts.createSourceFile(fileName, text, ts.ScriptTarget.Latest, true);
    const targetNames = new Set(names);
    const lines: number[] = [];

    const record = (node: ts.Node): void => {
        lines.push(sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1);
    };

    const visit = (node: ts.Node): void => {
        if (ts.isPropertyAccessExpression(node) && targetNames.has(node.name.text)) {
            record(node);
        } else if ((ts.isPropertyAssignment(node) || ts.isShorthandPropertyAssignment(node)) && isTargetPropertyName(node.name, targetNames)) {
            record(node);
        }
        ts.forEachChild(node, visit);
    };
    visit(sourceFile);
    return lines;
}

function escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function isTemplateProperty(node: ts.PropertyAssignment): boolean {
    const name = node.name;
    return (ts.isIdentifier(name) || ts.isStringLiteral(name)) && name.text === 'template';
}

function isInsideDecorator(node: ts.Node): boolean {
    let current: ts.Node | undefined = node.parent;
    while (current) {
        if (ts.isDecorator(current)) {
            return true;
        }
        current = current.parent;
    }
    return false;
}

function isTargetPropertyName(name: ts.PropertyName, targetNames: ReadonlySet<string>): boolean {
    return (ts.isIdentifier(name) || ts.isStringLiteral(name)) && targetNames.has(name.text);
}
