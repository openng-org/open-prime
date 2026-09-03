import { describe, expect, it } from 'vitest';
import { createAppTree, createMigrationRunner } from './helpers';

describe('remove-dead-inputs', () => {
    it('removes showTransformOptions/hideTransformOptions/showTransitionOptions/hideTransitionOptions from p-toast', async () => {
        const runner = createMigrationRunner();
        const tree = createAppTree({
            '/src/app/app.html': `<p-toast showTransformOptions="translateY(100%)" [hideTransformOptions]="hideTf" showTransitionOptions="300ms" hideTransitionOptions="250ms" [life]="3000"></p-toast>\n`
        });
        const result = await runner.runSchematic('remove-dead-inputs', {}, tree);
        const html = result.readContent('/src/app/app.html');
        expect(html).not.toContain('TransformOptions');
        expect(html).not.toContain('TransitionOptions');
        expect(html).toBe(`<p-toast [life]="3000"></p-toast>\n`);
    });

    it('removes the same inputs from p-toastItem', async () => {
        const runner = createMigrationRunner();
        const tree = createAppTree({
            '/src/app/app.html': `<p-toastItem [showTransformOptions]="a" [hideTransformOptions]="b" [message]="msg"></p-toastItem>\n`
        });
        const result = await runner.runSchematic('remove-dead-inputs', {}, tree);
        expect(result.readContent('/src/app/app.html')).toBe(`<p-toastItem [message]="msg"></p-toastItem>\n`);
    });

    it('does not remove a similarly-named attribute on an unrelated selector', async () => {
        const runner = createMigrationRunner();
        const content = `<p-other showTransformOptions="x"></p-other>\n`;
        const tree = createAppTree({ '/src/app/app.html': content });
        const result = await runner.runSchematic('remove-dead-inputs', {}, tree);
        expect(result.readContent('/src/app/app.html')).toBe(content);
    });

    it('does not remove a bare attribute name that only shares a suffix (data-showTransformOptions)', async () => {
        const runner = createMigrationRunner();
        const content = `<p-toast data-showTransformOptions="x" [life]="3000"></p-toast>\n`;
        const tree = createAppTree({ '/src/app/app.html': content });
        const result = await runner.runSchematic('remove-dead-inputs', {}, tree);
        expect(result.readContent('/src/app/app.html')).toBe(content);
    });

    it('does not corrupt a dead input name that only appears as text inside a different attribute value', async () => {
        const runner = createMigrationRunner();
        const content = `<p-toast [tooltip]="'toggle the showTransformOptions flag'" [life]="3000"></p-toast>\n`;
        const tree = createAppTree({ '/src/app/app.html': content });
        const result = await runner.runSchematic('remove-dead-inputs', {}, tree);
        expect(result.readContent('/src/app/app.html')).toBe(content);
    });

    it('removes an unquoted bare-value attribute (showTransformOptions=translateY)', async () => {
        const runner = createMigrationRunner();
        const content = `<p-toast showTransformOptions=translateY [life]="3000"></p-toast>\n`;
        const tree = createAppTree({ '/src/app/app.html': content });
        const result = await runner.runSchematic('remove-dead-inputs', {}, tree);
        expect(result.readContent('/src/app/app.html')).toBe(`<p-toast [life]="3000"></p-toast>\n`);
    });

    it('removes the bindings inside an inline component template', async () => {
        const runner = createMigrationRunner();
        const tree = createAppTree({
            '/src/app/card.component.ts':
                `import { Component } from '@angular/core';\n` +
                '@Component({\n' +
                "    selector: 'app-card',\n" +
                '    template: `<p-toast showTransformOptions="translateY(100%)" [life]="3000"></p-toast>`\n' +
                '})\n' +
                `export class CardComponent {}\n`
        });
        const result = await runner.runSchematic('remove-dead-inputs', {}, tree);
        const ts = result.readContent('/src/app/card.component.ts');
        expect(ts).not.toContain('showTransformOptions');
        expect(ts).toContain('<p-toast [life]="3000"></p-toast>');
    });

    it('reports a leftover for a programmatic property access, without modifying the file', async () => {
        const runner = createMigrationRunner();
        const content =
            `import { Component, ViewChild } from '@angular/core';\n` +
            `import { Toast } from '@openng/optimus-ui/toast';\n\n` +
            `@Component({ selector: 'app-x', template: '' })\n` +
            `export class XComponent {\n` +
            `    @ViewChild(Toast) toast!: Toast;\n\n` +
            `    ngAfterViewInit() {\n` +
            `        console.log(this.toast.showTransformOptions);\n` +
            `    }\n` +
            `}\n`;
        const tree = createAppTree({ '/src/app/x.component.ts': content });

        const warnings: string[] = [];
        runner.logger.subscribe((entry) => {
            if (entry.level === 'warn') {
                warnings.push(entry.message);
            }
        });

        const result = await runner.runSchematic('remove-dead-inputs', {}, tree);
        expect(result.readContent('/src/app/x.component.ts')).toBe(content);
        const combined = warnings.join('\n');
        expect(combined).toContain('showTransformOptions');
        expect(combined).toContain('/src/app/x.component.ts:9');
    });

    it('does not rewrite non-template string literals in TypeScript', async () => {
        const runner = createMigrationRunner();
        const content = `export const label = '<p-toast showTransformOptions="x"></p-toast>';\n`;
        const tree = createAppTree({ '/src/app/config.ts': content });
        const result = await runner.runSchematic('remove-dead-inputs', {}, tree);
        expect(result.readContent('/src/app/config.ts')).toBe(content);
    });

    it('removes a dead input inside a double-quoted inline template whose HTML attributes need escaped quotes', async () => {
        const runner = createMigrationRunner();
        const tree = createAppTree({
            '/src/app/card.component.ts':
                `import { Component } from '@angular/core';\n` +
                '@Component({\n' +
                "    selector: 'app-card',\n" +
                '    template: "<p-toast showTransformOptions=\\"translateY(100%)\\" [life]=\\"3000\\"></p-toast>"\n' +
                '})\n' +
                `export class CardComponent {}\n`
        });
        const result = await runner.runSchematic('remove-dead-inputs', {}, tree);
        const ts = result.readContent('/src/app/card.component.ts');
        expect(ts).not.toContain('showTransformOptions');
        expect(ts).toContain('template: "<p-toast [life]=\\"3000\\"></p-toast>"');
    });

    it('does not rewrite a `template` property nested inside providers metadata', async () => {
        const runner = createMigrationRunner();
        const content =
            `import { Component } from '@angular/core';\n` +
            '@Component({\n' +
            "    selector: 'app-card',\n" +
            '    template: \'<p-toast [life]="3000"></p-toast>\',\n' +
            "    providers: [{ provide: 'TPL', useValue: { template: '<p-toast showTransformOptions=\"x\"></p-toast>' } }]\n" +
            '})\n' +
            `export class CardComponent {}\n`;
        const tree = createAppTree({ '/src/app/card.component.ts': content });
        const result = await runner.runSchematic('remove-dead-inputs', {}, tree);
        expect(result.readContent('/src/app/card.component.ts')).toBe(content);
    });

    it('does not rewrite a `template` property belonging to a non-Component decorator', async () => {
        const runner = createMigrationRunner();
        const content = `function CustomDecorator(config: { template: string }) {\n` + '    return () => {};\n' + '}\n\n' + '@CustomDecorator({ template: \'<p-toast showTransformOptions="x"></p-toast>\' })\n' + `export class NotAComponent {}\n`;
        const tree = createAppTree({ '/src/app/not-a-component.ts': content });
        const result = await runner.runSchematic('remove-dead-inputs', {}, tree);
        expect(result.readContent('/src/app/not-a-component.ts')).toBe(content);
    });

    it('does not touch node_modules or dist', async () => {
        const runner = createMigrationRunner();
        const content = `<p-toast showTransformOptions="x"></p-toast>\n`;
        const tree = createAppTree({
            '/node_modules/pkg/tpl.html': content,
            '/dist/app/tpl.html': content
        });
        const result = await runner.runSchematic('remove-dead-inputs', {}, tree);
        expect(result.readContent('/node_modules/pkg/tpl.html')).toBe(content);
        expect(result.readContent('/dist/app/tpl.html')).toBe(content);
    });

    it('reports nothing on a workspace with no usage of the removed inputs', async () => {
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
        await runner.runSchematic('remove-dead-inputs', {}, createAppTree());
        expect(infos.join('\n')).toContain('No bindings for the removed inputs were found to remove.');
        expect(warnings.join('\n')).toBe('');
    });
});
