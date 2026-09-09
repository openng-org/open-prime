# Agent guides for optimus-ui

Reusable, tool-agnostic guides for AI coding agents working in this package live under [`.agents/skills/`](.agents/skills). Read the relevant guide in full before starting the kind of task it covers.

- [`angular-signal-migration`](.agents/skills/angular-signal-migration/SKILL.md) — migrating an Angular component from decorators and RxJS state onto the Signals API (`input()`/`output()`/`model()`, signal-based queries, `linkedSignal()`, lifecycle hooks, `OnPush`), including the dead-code audit, tests, and doc updates that go with it. Use it whenever asked to migrate, modernize, or convert a component to signals — or to touch just one piece of that on its own (e.g. "convert this @Input to a signal").
