import { describe, expect, it } from 'vitest';
import { createAppTree, createMigrationRunner } from './helpers';

describe('remove-dead-outputs', () => {
    describe('Overlay onAnimationStart/onAnimationDone', () => {
        it('removes an (onAnimationStart) binding from a standalone template file', async () => {
            const runner = createMigrationRunner();
            const tree = createAppTree({
                '/src/app/app.html': `<p-overlay [visible]="visible" (onAnimationStart)="onStart($event)" (onShow)="onShow()">content</p-overlay>\n`
            });
            const result = await runner.runSchematic('remove-dead-outputs', {}, tree);
            const html = result.readContent('/src/app/app.html');
            expect(html).not.toContain('onAnimationStart');
            expect(html).toContain('(onShow)="onShow()"');
            expect(html).toContain('<p-overlay [visible]="visible" (onShow)="onShow()">content</p-overlay>');
        });

        it('removes an (onAnimationDone) binding, single- or double-quoted', async () => {
            const runner = createMigrationRunner();
            const tree = createAppTree({
                '/src/app/app.html': `<p-overlay (onAnimationDone)='onDone($event)'></p-overlay>\n`
            });
            const result = await runner.runSchematic('remove-dead-outputs', {}, tree);
            expect(result.readContent('/src/app/app.html')).toBe(`<p-overlay></p-overlay>\n`);
        });

        it('removes both bindings inside an inline component template', async () => {
            const runner = createMigrationRunner();
            const tree = createAppTree({
                '/src/app/card.component.ts':
                    `import { Component } from '@angular/core';\n` +
                    '@Component({\n' +
                    "    selector: 'app-card',\n" +
                    '    template: `<p-overlay (onAnimationStart)="a()" (onAnimationDone)="b()" [visible]="true"></p-overlay>`\n' +
                    '})\n' +
                    `export class CardComponent {\n` +
                    `    a() {}\n` +
                    `    b() {}\n` +
                    `}\n`
            });
            const result = await runner.runSchematic('remove-dead-outputs', {}, tree);
            const ts = result.readContent('/src/app/card.component.ts');
            expect(ts).not.toContain('onAnimationStart');
            expect(ts).not.toContain('onAnimationDone');
            expect(ts).toContain('<p-overlay [visible]="true"></p-overlay>');
            // The (now-orphaned) handler methods are left in place — removing dead template
            // bindings is safe, but deciding whether the handler code is still needed is not.
            expect(ts).toContain('a() {}');
            expect(ts).toContain('b() {}');
        });

        it('reports a leftover for a programmatic .subscribe() call, without modifying the file', async () => {
            const runner = createMigrationRunner();
            const content =
                `import { Component, ViewChild } from '@angular/core';\n` +
                `import { Overlay } from '@openng/optimus-ui/overlay';\n\n` +
                `@Component({ selector: 'app-x', template: '' })\n` +
                `export class XComponent {\n` +
                `    @ViewChild(Overlay) overlay!: Overlay;\n\n` +
                `    ngAfterViewInit() {\n` +
                `        this.overlay.onAnimationStart.subscribe((e) => console.log(e));\n` +
                `    }\n` +
                `}\n`;
            const tree = createAppTree({ '/src/app/x.component.ts': content });

            const warnings: string[] = [];
            runner.logger.subscribe((entry) => {
                if (entry.level === 'warn') {
                    warnings.push(entry.message);
                }
            });

            const result = await runner.runSchematic('remove-dead-outputs', {}, tree);
            expect(result.readContent('/src/app/x.component.ts')).toBe(content);
            const combined = warnings.join('\n');
            expect(combined).toContain('Overlay onAnimationStart/onAnimationDone');
            expect(combined).toContain('pick the right one');
            expect(combined).toContain('/src/app/x.component.ts:9');
        });

        it('reports a leftover for an OverlayOptions.onAnimationStart config callback', async () => {
            const runner = createMigrationRunner();
            const content = `export const overlayOptions = {\n    onAnimationStart: (e: unknown) => console.log(e),\n    onShow: () => {}\n};\n`;
            const tree = createAppTree({ '/src/app/options.ts': content });

            const warnings: string[] = [];
            runner.logger.subscribe((entry) => {
                if (entry.level === 'warn') {
                    warnings.push(entry.message);
                }
            });

            const result = await runner.runSchematic('remove-dead-outputs', {}, tree);
            expect(result.readContent('/src/app/options.ts')).toBe(content);
            expect(warnings.join('\n')).toContain('/src/app/options.ts:2');
        });
    });

    describe('MenubarSub menuFocus/menuBlur/menuKeydown', () => {
        it('removes (menuFocus)/(menuBlur)/(menuKeydown) bindings from a hand-assembled <ul pMenubarSub>', async () => {
            const runner = createMigrationRunner();
            const tree = createAppTree({
                '/src/app/app.html': `<ul pMenubarSub [items]="items" (menuFocus)="onFocus($event)" (menuBlur)="onBlur($event)" (menuKeydown)="onKey($event)" (itemClick)="onItemClick($event)"></ul>\n`
            });
            const result = await runner.runSchematic('remove-dead-outputs', {}, tree);
            const html = result.readContent('/src/app/app.html');
            expect(html).not.toContain('menuFocus');
            expect(html).not.toContain('menuBlur');
            expect(html).not.toContain('menuKeydown');
            expect(html).toContain('(itemClick)="onItemClick($event)"');
        });

        it('reports a leftover for a programmatic .subscribe() call with dead-output guidance, without modifying the file', async () => {
            const runner = createMigrationRunner();
            const content =
                `import { Component, ViewChild } from '@angular/core';\n` +
                `import { MenubarSub } from '@openng/optimus-ui/menubar';\n\n` +
                `@Component({ selector: 'app-x', template: '' })\n` +
                `export class XComponent {\n` +
                `    @ViewChild(MenubarSub) sub!: MenubarSub;\n\n` +
                `    ngAfterViewInit() {\n` +
                `        this.sub.menuKeydown.subscribe((e) => console.log(e));\n` +
                `    }\n` +
                `}\n`;
            const tree = createAppTree({ '/src/app/x.component.ts': content });

            const warnings: string[] = [];
            runner.logger.subscribe((entry) => {
                if (entry.level === 'warn') {
                    warnings.push(entry.message);
                }
            });

            const result = await runner.runSchematic('remove-dead-outputs', {}, tree);
            expect(result.readContent('/src/app/x.component.ts')).toBe(content);
            const combined = warnings.join('\n');
            expect(combined).toContain('MenubarSub menuFocus/menuBlur/menuKeydown');
            expect(combined).toContain('never fired');
            expect(combined).toContain('/src/app/x.component.ts:9');
        });
    });

    it('does not rewrite non-template string literals in TypeScript', async () => {
        const runner = createMigrationRunner();
        const content = `export const label = '(onAnimationStart)="x" (menuFocus)="y"';\n`;
        const tree = createAppTree({ '/src/app/config.ts': content });
        const result = await runner.runSchematic('remove-dead-outputs', {}, tree);
        expect(result.readContent('/src/app/config.ts')).toBe(content);
    });

    it('does not touch node_modules or dist', async () => {
        const runner = createMigrationRunner();
        const content = `<p-overlay (onAnimationStart)="x()"></p-overlay>\n`;
        const tree = createAppTree({
            '/node_modules/pkg/tpl.html': content,
            '/dist/app/tpl.html': content
        });
        const result = await runner.runSchematic('remove-dead-outputs', {}, tree);
        expect(result.readContent('/node_modules/pkg/tpl.html')).toBe(content);
        expect(result.readContent('/dist/app/tpl.html')).toBe(content);
    });

    it('reports nothing on a workspace with no usage of the removed outputs', async () => {
        const runner = createMigrationRunner();
        const infos: string[] = [];
        const warnings: string[] = [];
        runner.logger.subscribe((entry) => {
            if (entry.level === 'info') {
                infos.push(entry.message);
            } else if (entry.level === 'warn') {
                warnings.push(entry.message);
            }
        });
        await runner.runSchematic('remove-dead-outputs', {}, createAppTree());
        expect(infos.join('\n')).toContain('No bindings for the removed outputs were found to remove.');
        expect(warnings.join('\n')).toBe('');
    });
});
