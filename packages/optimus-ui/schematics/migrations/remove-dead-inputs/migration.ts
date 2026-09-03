import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import { SKIP_DIRS } from '../../utils/package-json';
import { findLeftoversInTypeScript } from '../../utils/removed-outputs';
import { removeDeadInputsInHtml, removeDeadInputsInTypeScript, SelectorInputRemoval } from '../../utils/removed-inputs';

/**
 * Inputs removed in this version, scoped per-selector: `showTransformOptions`/
 * `hideTransformOptions`/`showTransitionOptions`/`hideTransitionOptions` on Toast/ToastItem had
 * already stopped doing anything once the show/hide animation moved to the shared Motion
 * directive, which does not take transform/transition options through the toast API.
 */
const REMOVED_INPUT_GROUPS: readonly SelectorInputRemoval[] = [
    { selector: 'p-toast', names: ['showTransformOptions', 'hideTransformOptions', 'showTransitionOptions', 'hideTransitionOptions'] },
    { selector: 'p-toastItem', names: ['showTransformOptions', 'hideTransformOptions', 'showTransitionOptions', 'hideTransitionOptions'] }
];

/**
 * Removes usages of inputs that stopped doing anything before being deleted from
 * @openng/optimus-ui in this version: Toast/ToastItem's showTransformOptions, hideTransformOptions,
 * showTransitionOptions and hideTransitionOptions, dead since the show/hide animation moved to the
 * shared Motion directive (which has no equivalent transform/transition-options input).
 *
 * `name="..."`/`[name]="..."` template bindings on `p-toast`/`p-toastItem` are removed
 * automatically — safe to delete outright, since the values they passed were already unused.
 * Programmatic reads/writes of the same property name elsewhere (e.g. on a `@ViewChild`-queried
 * instance) are reported for manual review instead of being rewritten automatically.
 */
export default function (): Rule {
    return (tree: Tree, context: SchematicContext) => {
        let filesChanged = 0;
        let attrsRemoved = 0;
        const leftovers: string[] = [];

        tree.visit((path) => {
            if (SKIP_DIRS.test(path)) {
                return;
            }
            if (path.endsWith('.html')) {
                const original = tree.read(path)?.toString();
                if (original === undefined) {
                    return;
                }
                const result = removeDeadInputsInHtml(original, REMOVED_INPUT_GROUPS);
                if (result.changed) {
                    tree.overwrite(path, result.text);
                    filesChanged++;
                    attrsRemoved += result.removed.length;
                    context.logger.info(`${path}: removed ${result.removed.join(', ')} binding(s)`);
                }
            } else if (path.endsWith('.ts') || path.endsWith('.mts')) {
                const original = tree.read(path)?.toString();
                if (original === undefined) {
                    return;
                }
                const result = removeDeadInputsInTypeScript(path, original, REMOVED_INPUT_GROUPS);
                let text = original;
                if (result.changed) {
                    text = result.text;
                    tree.overwrite(path, text);
                    filesChanged++;
                    attrsRemoved += result.removed.length;
                    context.logger.info(`${path}: removed ${result.removed.join(', ')} binding(s) from inline template`);
                }
                const allNames = Array.from(new Set(REMOVED_INPUT_GROUPS.flatMap((group) => group.names)));
                const lines = findLeftoversInTypeScript(path, text, allNames);
                for (const line of lines) {
                    leftovers.push(`${path}:${line}`);
                }
            }
        });

        if (attrsRemoved > 0) {
            context.logger.info(`Removed ${attrsRemoved} dead input template binding(s) across ${filesChanged} file(s) — they had already stopped doing anything.`);
        } else {
            context.logger.info('No bindings for the removed inputs were found to remove.');
        }

        if (leftovers.length > 0) {
            context.logger.warn(
                `Found ${leftovers.length} reference(s) to the removed showTransformOptions/hideTransformOptions/showTransitionOptions/hideTransitionOptions inputs that need manual review — these had already stopped doing anything and can likely be deleted:`
            );
            for (const leftover of leftovers) {
                context.logger.warn(`  ${leftover}`);
            }
        }

        return tree;
    };
}
