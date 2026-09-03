import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import { SKIP_DIRS } from '../../utils/package-json';
import { rewriteStyleClassInHtml, rewriteStyleClassInTypeScript } from '../../utils/styleclass';

/**
 * Selectors whose `styleClass`/`[styleClass]` input was dropped in favor of binding the native
 * `class`/`[class]` attribute directly. Extend this list as more components make the same switch.
 */
export const MIGRATED_SELECTORS: readonly string[] = ['p-toast'];

/**
 * Rewrites `styleClass="x"` to `class="x"` (merging into an existing static `class` attribute) and
 * `[styleClass]="expr"` to `[class]="expr"` on the selectors in {@link MIGRATED_SELECTORS}, whose
 * `styleClass` input was removed in this version in favor of the native `class` attribute — Angular
 * merges a component's native `class`/`[class]` bindings with its host bindings automatically, so
 * `styleClass` no longer served a purpose these selectors couldn't already get for free.
 *
 * A tag that already has a `[class]`/`class` binding of its own (in a way that can't be merged
 * automatically — e.g. `[styleClass]` alongside an existing `[class]` expression) is left
 * unrewritten and reported for manual review, since combining two arbitrary expressions isn't safe
 * to do automatically.
 */
export default function (): Rule {
    return (tree: Tree, context: SchematicContext) => {
        let filesChanged = 0;
        let attrsRewritten = 0;
        const conflicts: string[] = [];

        tree.visit((path) => {
            if (SKIP_DIRS.test(path)) {
                return;
            }
            if (path.endsWith('.html')) {
                const original = tree.read(path)?.toString();
                if (original === undefined) {
                    return;
                }
                const result = rewriteStyleClassInHtml(original, MIGRATED_SELECTORS);
                if (result.changed) {
                    tree.overwrite(path, result.text);
                    filesChanged++;
                    attrsRewritten += result.rewritten;
                    context.logger.info(`${path}: rewrote ${result.rewritten} styleClass usage(s) to class`);
                }
                for (const line of result.conflictLines) {
                    conflicts.push(`${path}:${line}`);
                }
            } else if (path.endsWith('.ts') || path.endsWith('.mts')) {
                const original = tree.read(path)?.toString();
                if (original === undefined) {
                    return;
                }
                const result = rewriteStyleClassInTypeScript(path, original, MIGRATED_SELECTORS);
                if (result.changed) {
                    tree.overwrite(path, result.text);
                    filesChanged++;
                    attrsRewritten += result.rewritten;
                    context.logger.info(`${path}: rewrote ${result.rewritten} styleClass usage(s) to class in inline template`);
                }
                for (const line of result.conflictLines) {
                    conflicts.push(`${path}:${line}`);
                }
            }
        });

        if (attrsRewritten > 0) {
            context.logger.info(`Rewrote ${attrsRewritten} styleClass usage(s) to class across ${filesChanged} file(s).`);
        } else {
            context.logger.info('No usages of styleClass on the migrated selectors were found to rewrite.');
        }

        if (conflicts.length > 0) {
            context.logger.warn(`Found ${conflicts.length} styleClass usage(s) that need manual review — the same element already binds class/[class] in a way that could not be merged automatically:`);
            for (const conflict of conflicts) {
                context.logger.warn(`  ${conflict}`);
            }
        }

        return tree;
    };
}
