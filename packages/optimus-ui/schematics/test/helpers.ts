import { HostTree } from '@angular-devkit/schematics';
import { SchematicTestRunner, UnitTestTree } from '@angular-devkit/schematics/testing';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const COLLECTION_PATH = path.resolve(__dirname, '../dist/collection.json');
export const MIGRATIONS_PATH = path.resolve(__dirname, '../dist/migrations.json');

export function createRunner(): SchematicTestRunner {
    return new SchematicTestRunner('optimus-ui', COLLECTION_PATH);
}

// `ng update` migrations live in a separate collection (migrations.json) from the `ng generate`
// schematics (collection.json) — a runner needs to be pointed at whichever one it's testing.
export function createMigrationRunner(): SchematicTestRunner {
    return new SchematicTestRunner('optimus-ui-migrations', MIGRATIONS_PATH);
}

export const DEFAULT_PKG = {
    name: 'test-app',
    version: '0.0.0',
    dependencies: {
        '@angular/core': '^21.0.0'
    },
    devDependencies: {
        typescript: '~5.9.0'
    }
};

const APP_CONFIG = `import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';

export const appConfig: ApplicationConfig = {
    providers: [provideRouter([])]
};
`;

export function createAppTree(overrides: Record<string, string> = {}, pkg: object = DEFAULT_PKG): UnitTestTree {
    const tree = new UnitTestTree(new HostTree());
    tree.create('/package.json', JSON.stringify(pkg, null, 2) + '\n');
    tree.create('/angular.json', JSON.stringify({ version: 1, projects: { app: { projectType: 'application', root: '', sourceRoot: 'src' } } }, null, 2) + '\n');
    tree.create('/src/main.ts', `import { bootstrapApplication } from '@angular/platform-browser';\n`);
    tree.create('/src/app/app.config.ts', APP_CONFIG);
    for (const [p, content] of Object.entries(overrides)) {
        if (tree.exists(p)) {
            tree.overwrite(p, content);
        } else {
            tree.create(p, content);
        }
    }
    return tree;
}

/**
 * Builds a fixture tree by actually running the real `@schematics/angular` `workspace` and
 * `application` schematics (rather than hand-authoring a minimal `angular.json`/`main.ts`), so
 * tests exercise the schematic under test against a byte-accurate CLI v21 output — full
 * `architect`/`build` config, a real `bootstrapApplication(...)`/`bootstrapModule(...)` call, etc.
 */
export async function createRealAppTree(runner: SchematicTestRunner, options: { standalone?: boolean } = {}): Promise<UnitTestTree> {
    const workspaceTree = await runner.runExternalSchematic('@schematics/angular', 'workspace', { name: 'workspace', version: '21.0.0', newProjectRoot: 'projects' }, new UnitTestTree(new HostTree()));
    return runner.runExternalSchematic(
        '@schematics/angular',
        'application',
        {
            name: 'app',
            projectRoot: '',
            standalone: options.standalone ?? true,
            skipPackageJson: false,
            skipInstall: true,
            routing: true,
            style: 'css',
            inlineStyle: false,
            inlineTemplate: false
        },
        workspaceTree
    );
}
