import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import { SKIP_DIRS } from '../../utils/package-json';
import { findLeftoversInTypeScript, removeBindings, removeBindingsInTypeScript } from '../../utils/removed-outputs';

/**
 * A set of outputs removed together in this version, and the events/template bindings they
 * correspond to. Each group is auto-removed from templates independently, and reports its own
 * `leftoverGuidance` for references a template-binding removal can't safely rewrite (a
 * `.subscribe()`/`.emit()` call, or a config-object property of the same name).
 */
interface RemovedOutputGroup {
    /** Human-readable label used in the summary log line. */
    label: string;
    /** Output property names in this group, e.g. ['onAnimationStart', 'onAnimationDone']. */
    names: readonly string[];
    /** Appended after "Found N reference(s) to ..." when reporting leftovers for this group. */
    leftoverGuidance: string;
}

const REMOVED_OUTPUT_GROUPS: readonly RemovedOutputGroup[] = [
    {
        label: 'Overlay onAnimationStart/onAnimationDone',
        names: ['onAnimationStart', 'onAnimationDone'],
        leftoverGuidance: 'These split into onOverlayBeforeEnter/onOverlayAfterEnter (show) and onOverlayBeforeLeave/onOverlayAfterLeave (hide) ' + 'with no automatic 1:1 replacement — review each and pick the right one:'
    },
    {
        label: 'MenubarSub menuFocus/menuBlur/menuKeydown',
        names: ['menuFocus', 'menuBlur', 'menuKeydown'],
        leftoverGuidance: "These never fired (MenubarSub is applied as a directive on Menubar's own <ul>, which already exposes focus/blur/keydown directly) — remove the dead subscription:"
    }
];

/**
 * Removes outputs (and their template bindings) that stopped doing anything before being deleted
 * from @openng/optimus-ui in this version:
 *
 * - Overlay.onAnimationStart/onAnimationDone (and the matching OverlayOptions config callbacks):
 *   dead since Overlay's animation lifecycle moved to onOverlayBeforeEnter/onOverlayAfterEnter/
 *   onOverlayBeforeLeave/onOverlayAfterLeave.
 * - MenubarSub.menuFocus/menuBlur/menuKeydown: never wired to anything — MenubarSub is applied as
 *   an attribute directive directly on Menubar's own <ul>, which already binds focus/blur/keydown
 *   natively on that same element.
 *
 * `(name)="..."` template bindings are removed automatically — safe to delete outright, since the
 * handlers they called were already dead code. Programmatic `.subscribe()`/`.emit()` call sites
 * and (for Overlay) `OverlayOptions` config-callback properties of the same name are reported for
 * manual review instead of being rewritten automatically — see each group's `leftoverGuidance`.
 */
export default function (): Rule {
    return (tree: Tree, context: SchematicContext) => {
        let filesChanged = 0;
        let bindingsRemoved = 0;
        const leftoversByGroup = new Map<RemovedOutputGroup, string[]>();

        tree.visit((path) => {
            if (SKIP_DIRS.test(path)) {
                return;
            }
            if (path.endsWith('.html')) {
                const original = tree.read(path)?.toString();
                if (original === undefined) {
                    return;
                }
                let text = original;
                let changed = false;
                for (const group of REMOVED_OUTPUT_GROUPS) {
                    const result = removeBindings(text, group.names);
                    if (result.changed) {
                        text = result.text;
                        changed = true;
                        bindingsRemoved += result.removed.length;
                        context.logger.info(`${path}: removed ${result.removed.join(', ')} binding(s)`);
                    }
                }
                if (changed) {
                    tree.overwrite(path, text);
                    filesChanged++;
                }
            } else if (path.endsWith('.ts') || path.endsWith('.mts')) {
                const original = tree.read(path)?.toString();
                if (original === undefined) {
                    return;
                }
                let text = original;
                let changed = false;
                for (const group of REMOVED_OUTPUT_GROUPS) {
                    const result = removeBindingsInTypeScript(path, text, group.names);
                    if (result.changed) {
                        text = result.text;
                        changed = true;
                        bindingsRemoved += result.removed.length;
                        context.logger.info(`${path}: removed ${result.removed.join(', ')} binding(s) from inline template`);
                    }
                }
                if (changed) {
                    tree.overwrite(path, text);
                    filesChanged++;
                }
                for (const group of REMOVED_OUTPUT_GROUPS) {
                    const lines = findLeftoversInTypeScript(path, text, group.names);
                    if (lines.length === 0) {
                        continue;
                    }
                    const entries = leftoversByGroup.get(group) ?? [];
                    for (const line of lines) {
                        entries.push(`${path}:${line}`);
                    }
                    leftoversByGroup.set(group, entries);
                }
            }
        });

        if (bindingsRemoved > 0) {
            context.logger.info(`Removed ${bindingsRemoved} dead output template binding(s) across ${filesChanged} file(s) — they had already stopped firing.`);
        } else {
            context.logger.info('No bindings for the removed outputs were found to remove.');
        }

        for (const group of REMOVED_OUTPUT_GROUPS) {
            const leftovers = leftoversByGroup.get(group);
            if (!leftovers || leftovers.length === 0) {
                continue;
            }
            context.logger.warn(`Found ${leftovers.length} reference(s) to ${group.label} that need manual review. ${group.leftoverGuidance}`);
            for (const leftover of leftovers) {
                context.logger.warn(`  ${leftover}`);
            }
        }

        return tree;
    };
}
