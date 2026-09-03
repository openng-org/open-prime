import { describe, expect, it } from 'vitest';
import { createAppTree, createMigrationRunner } from './helpers';

describe('styleclass-to-class', () => {
    it('rewrites a static styleClass to class when there is no existing class attribute', async () => {
        const runner = createMigrationRunner();
        const tree = createAppTree({
            '/src/app/app.html': `<p-toast styleClass="my-toast"></p-toast>\n`
        });
        const result = await runner.runSchematic('styleclass-to-class', {}, tree);
        expect(result.readContent('/src/app/app.html')).toBe(`<p-toast class="my-toast"></p-toast>\n`);
    });

    it('merges a static styleClass into an existing static class attribute', async () => {
        const runner = createMigrationRunner();
        const tree = createAppTree({
            '/src/app/app.html': `<p-toast class="existing" styleClass="my-toast"></p-toast>\n`
        });
        const result = await runner.runSchematic('styleclass-to-class', {}, tree);
        expect(result.readContent('/src/app/app.html')).toBe(`<p-toast class="existing my-toast"></p-toast>\n`);
    });

    it('rewrites an unquoted static styleClass to a quoted class when there is no existing class attribute', async () => {
        const runner = createMigrationRunner();
        const tree = createAppTree({
            '/src/app/app.html': `<p-toast styleClass=my-toast></p-toast>\n`
        });
        const result = await runner.runSchematic('styleclass-to-class', {}, tree);
        expect(result.readContent('/src/app/app.html')).toBe(`<p-toast class="my-toast"></p-toast>\n`);
    });

    it('merges a quoted static styleClass into an existing unquoted class attribute', async () => {
        const runner = createMigrationRunner();
        const tree = createAppTree({
            '/src/app/app.html': `<p-toast class=existing styleClass="my-toast"></p-toast>\n`
        });
        const result = await runner.runSchematic('styleclass-to-class', {}, tree);
        expect(result.readContent('/src/app/app.html')).toBe(`<p-toast class="existing my-toast"></p-toast>\n`);
    });

    it('merges an unquoted static styleClass into an existing quoted class attribute', async () => {
        const runner = createMigrationRunner();
        const tree = createAppTree({
            '/src/app/app.html': `<p-toast class="existing" styleClass=my-toast></p-toast>\n`
        });
        const result = await runner.runSchematic('styleclass-to-class', {}, tree);
        expect(result.readContent('/src/app/app.html')).toBe(`<p-toast class="existing my-toast"></p-toast>\n`);
    });

    it('rewrites a bound [styleClass] to [class] when there is no existing class binding', async () => {
        const runner = createMigrationRunner();
        const tree = createAppTree({
            '/src/app/app.html': `<p-toast [styleClass]="myClass"></p-toast>\n`
        });
        const result = await runner.runSchematic('styleclass-to-class', {}, tree);
        expect(result.readContent('/src/app/app.html')).toBe(`<p-toast [class]="myClass"></p-toast>\n`);
    });

    it('rewrites an unquoted bound [styleClass] to a quoted [class] when there is no existing class binding', async () => {
        const runner = createMigrationRunner();
        const tree = createAppTree({
            '/src/app/app.html': `<p-toast [styleClass]=myClass></p-toast>\n`
        });
        const result = await runner.runSchematic('styleclass-to-class', {}, tree);
        expect(result.readContent('/src/app/app.html')).toBe(`<p-toast [class]="myClass"></p-toast>\n`);
    });

    it('leaves [styleClass] in place and reports a conflict when [class] is already bound', async () => {
        const runner = createMigrationRunner();
        const content = `<p-toast [class]="otherClass" [styleClass]="myClass"></p-toast>\n`;
        const tree = createAppTree({ '/src/app/app.html': content });

        const warnings: string[] = [];
        runner.logger.subscribe((entry) => {
            if (entry.level === 'warn') {
                warnings.push(entry.message);
            }
        });

        const result = await runner.runSchematic('styleclass-to-class', {}, tree);
        expect(result.readContent('/src/app/app.html')).toBe(content);
        expect(warnings.join('\n')).toContain('/src/app/app.html:1');
    });

    it('does not rewrite styleClass text that only appears inside a different attribute value', async () => {
        const runner = createMigrationRunner();
        const content = `<p-toast aria-label='styleClass="do not edit"'></p-toast>\n`;
        const tree = createAppTree({ '/src/app/app.html': content });
        const result = await runner.runSchematic('styleclass-to-class', {}, tree);
        expect(result.readContent('/src/app/app.html')).toBe(content);
    });

    it('does not touch styleClass on selectors outside MIGRATED_SELECTORS', async () => {
        const runner = createMigrationRunner();
        const content = `<p-button styleClass="my-button"></p-button>\n`;
        const tree = createAppTree({ '/src/app/app.html': content });
        const result = await runner.runSchematic('styleclass-to-class', {}, tree);
        expect(result.readContent('/src/app/app.html')).toBe(content);
    });

    it('rewrites styleClass inside an inline component template', async () => {
        const runner = createMigrationRunner();
        const tree = createAppTree({
            '/src/app/card.component.ts':
                `import { Component } from '@angular/core';\n` + '@Component({\n' + "    selector: 'app-card',\n" + '    template: `<p-toast styleClass="my-toast" [life]="3000"></p-toast>`\n' + '})\n' + `export class CardComponent {}\n`
        });
        const result = await runner.runSchematic('styleclass-to-class', {}, tree);
        const ts = result.readContent('/src/app/card.component.ts');
        expect(ts).toContain('<p-toast class="my-toast" [life]="3000"></p-toast>');
        expect(ts).not.toContain('styleClass');
    });

    it('does not rewrite non-template string literals in TypeScript', async () => {
        const runner = createMigrationRunner();
        const content = `export const label = '<p-toast styleClass="x"></p-toast>';\n`;
        const tree = createAppTree({ '/src/app/config.ts': content });
        const result = await runner.runSchematic('styleclass-to-class', {}, tree);
        expect(result.readContent('/src/app/config.ts')).toBe(content);
    });

    it('rewrites styleClass inside a double-quoted inline template whose HTML attributes need escaped quotes', async () => {
        const runner = createMigrationRunner();
        const tree = createAppTree({
            '/src/app/card.component.ts':
                `import { Component } from '@angular/core';\n` + '@Component({\n' + "    selector: 'app-card',\n" + '    template: "<p-toast styleClass=\\"my-toast\\" [life]=\\"3000\\"></p-toast>"\n' + '})\n' + `export class CardComponent {}\n`
        });
        const result = await runner.runSchematic('styleclass-to-class', {}, tree);
        const ts = result.readContent('/src/app/card.component.ts');
        expect(ts).toContain('template: "<p-toast class=\\"my-toast\\" [life]=\\"3000\\"></p-toast>"');
        expect(ts).not.toContain('styleClass');
    });

    it('rewrites styleClass inside a single-quoted inline template whose HTML attributes need escaped quotes', async () => {
        const runner = createMigrationRunner();
        const tree = createAppTree({
            '/src/app/card.component.ts':
                `import { Component } from '@angular/core';\n` + '@Component({\n' + "    selector: 'app-card',\n" + "    template: '<p-toast styleClass=\\'my-toast\\' [life]=\\'3000\\'></p-toast>'\n" + '})\n' + `export class CardComponent {}\n`
        });
        const result = await runner.runSchematic('styleclass-to-class', {}, tree);
        const ts = result.readContent('/src/app/card.component.ts');
        expect(ts).toContain("template: '<p-toast class=\\'my-toast\\' [life]=\\'3000\\'></p-toast>'");
        expect(ts).not.toContain('styleClass');
    });

    it('does not rewrite a `template` property nested inside providers metadata', async () => {
        const runner = createMigrationRunner();
        const content =
            `import { Component } from '@angular/core';\n` +
            '@Component({\n' +
            "    selector: 'app-card',\n" +
            "    template: '<p-toast></p-toast>',\n" +
            "    providers: [{ provide: 'TPL', useValue: { template: '<p-toast styleClass=\"x\"></p-toast>' } }]\n" +
            '})\n' +
            `export class CardComponent {}\n`;
        const tree = createAppTree({ '/src/app/card.component.ts': content });
        const result = await runner.runSchematic('styleclass-to-class', {}, tree);
        expect(result.readContent('/src/app/card.component.ts')).toBe(content);
    });

    it('does not rewrite a `template` property belonging to a non-Component decorator', async () => {
        const runner = createMigrationRunner();
        const content = `function CustomDecorator(config: { template: string }) {\n` + '    return () => {};\n' + '}\n\n' + '@CustomDecorator({ template: \'<p-toast styleClass="x"></p-toast>\' })\n' + `export class NotAComponent {}\n`;
        const tree = createAppTree({ '/src/app/not-a-component.ts': content });
        const result = await runner.runSchematic('styleclass-to-class', {}, tree);
        expect(result.readContent('/src/app/not-a-component.ts')).toBe(content);
    });

    it('does not touch node_modules or dist', async () => {
        const runner = createMigrationRunner();
        const content = `<p-toast styleClass="x"></p-toast>\n`;
        const tree = createAppTree({
            '/node_modules/pkg/tpl.html': content,
            '/dist/app/tpl.html': content
        });
        const result = await runner.runSchematic('styleclass-to-class', {}, tree);
        expect(result.readContent('/node_modules/pkg/tpl.html')).toBe(content);
        expect(result.readContent('/dist/app/tpl.html')).toBe(content);
    });

    it('rewrites a static styleClass to class on p-message', async () => {
        const runner = createMigrationRunner();
        const tree = createAppTree({
            '/src/app/app.html': `<p-message severity="error" styleClass="my-message"></p-message>\n`
        });
        const result = await runner.runSchematic('styleclass-to-class', {}, tree);
        expect(result.readContent('/src/app/app.html')).toBe(`<p-message severity="error" class="my-message"></p-message>\n`);
    });

    it('rewrites a bound [styleClass] to [class] on p-message', async () => {
        const runner = createMigrationRunner();
        const tree = createAppTree({
            '/src/app/app.html': `<p-message [styleClass]="myClass"></p-message>\n`
        });
        const result = await runner.runSchematic('styleclass-to-class', {}, tree);
        expect(result.readContent('/src/app/app.html')).toBe(`<p-message [class]="myClass"></p-message>\n`);
    });

    it('reports nothing on a workspace with no usage of styleClass on the migrated selectors', async () => {
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
        await runner.runSchematic('styleclass-to-class', {}, createAppTree());
        expect(infos.join('\n')).toContain('No usages of styleClass on the migrated selectors were found to rewrite.');
        expect(warnings.join('\n')).toBe('');
    });
});
