---
name: angular-signal-migration
description: "Migrates an Angular component from decorators and RxJS state onto the Signals API — @Input/@Output/model(), ViewChild/ContentChild queries, plain properties, Subjects/BehaviorSubjects, lifecycle hooks, and OnPush — with a dead-code audit up front and matching JSDoc/doc-site, test, and consumer-migration updates. Use this whenever the user asks to migrate, modernize, or convert an Angular component to signals, OR asks about just one piece of it on its own (e.g. 'convert this @Input to a signal', 'how do I use viewChild now', 'replace this BehaviorSubject with a signal', 'what's the signals way to do ngOnChanges') — even without the word 'signals' or a full-migration framing."
---

## Prerequisite: audit for dead and deprecated code

Before starting the signal migration on a component, audit it for dead and deprecated code and remove it first — migrating dead code to signals just moves the clutter, and it's harder to spot once it's wrapped in `signal()`/`computed()`. Do this pass component-by-component, before applying any of the signal conversions in the rest of this skill.

### Identify dead code

Look for:

- **Unused class members**: properties, methods, or getters never referenced anywhere in the class body, in the component's own template, or in any template that projects content into it. Grep the whole workspace for the member name (not just the current file) before deleting a `public`/protected member — an apparently-unused public API might still be used by a consumer elsewhere, especially template-side (`(click)="doThing()"`), which a TypeScript-only search can miss.
- **Unreachable branches**: `if`/`switch` branches guarded by a constant, an always-true/always-false condition, or a feature flag that has since been permanently turned on or off.
- **Commented-out code**: blocks of code left commented out — not TODO/explanatory comments, which are content, not dead code.
- **Unused imports and unused `@Input()`/`@Output()`** that nothing in this repo's templates binds to — confirm with a workspace-wide search before removing a public input/output, since an external consumer outside this repo may still rely on it (see "Migration schematic for consumers" below if so).

### Identify deprecated code

Look for:

- Members annotated `@deprecated` in their JSDoc. Check whether their replacement already exists in the class: if so, migrate internal usages to the replacement and remove the deprecated member; if the replacement doesn't exist yet, the deprecated member isn't safe to remove as part of this migration.
- Calls to Angular APIs that are themselves deprecated for the Angular version this codebase targets, independent of whether the member calling them is marked deprecated itself.
- An old implementation kept side-by-side with a newer one "just in case" (e.g. a legacy rendering path that's never actually reached anymore because a newer path fully replaced it).

### Remove it, then migrate

Delete confirmed dead code outright. For deprecated code: replace internal usages with the replacement API, then remove the deprecated member if nothing outside the component depends on it. Only once this pass is done should the signal conversions in the rest of this skill be applied to what remains — don't spend effort migrating a property to a signal only to discover afterward that it was dead.

### Migration schematic for consumers

Any removed or renamed *public* class member — a `@deprecated` API, or a public `@Input()`/`@Output()`/method that's dead only from this repo's point of view but could still be used by external consumers of this component — is a breaking change and needs a migration note for consumers, not just a silent deletion. For each such removal, produce a migration entry with:

- **What changed**: the exact member name(s) removed or renamed.
- **Why**: dead (no longer functional / fully superseded) or deprecated (a replacement is available).
- **Before/after usage**, mirroring the Before/After code-block convention used throughout this skill, but written from the *consumer's* perspective (how a parent template or class that uses this component should change) rather than the component's internals.
- **Migration mechanism**: prefer an automatable fix over a prose instruction whenever the change is mechanical (a straight rename, or a static output-to-input change) — flag it as a candidate for an Angular CLI schematic/codemod (an `ng update` migration, or a `ts-morph`/`jscodeshift` script that renames the symbol or moves an input) so it can be applied automatically across consumer codebases instead of requiring every call site to be hand-edited. If the repo has no schematics infrastructure yet, still write the transform out precisely enough that one could be scripted later.

Collect these entries into a single migration document (e.g. `MIGRATION.md` next to the component, or a new dated section in the library's existing changelog) rather than scattering them across commit messages, so consumers upgrading past this change have one place to check.

Example entry:

```md
## Breaking change: `MyComponent`

- **Removed**: `legacyMode` input (dead — no longer read anywhere in the component; the legacy rendering path it toggled was deleted).

  **Before**
  ```html
  <my-component [legacyMode]="true"></my-component>
  ```

  **After**

  Remove the `legacyMode` binding entirely; the component no longer has a legacy mode.

- **Renamed**: `oldLabel` → `label` (`@deprecated` since v3, replacement has existed since then).

  **Before**
  ```html
  <my-component [oldLabel]="title"></my-component>
  ```

  **After**
  ```html
  <my-component [label]="title"></my-component>
  ```

  This rename is a straight 1:1 attribute substitution and is a good candidate for an automated codemod.
```

## Keep unrelated code in place: don't rename, reorder, retype, or annotate beyond what the migration requires

This skill converts *declarations* to their signal equivalents — it is not a license to also reorganize, rename, retype, or narrate the rest of the class. Four specific temptations to resist, because each makes the diff harder to review without changing what the code does:

### Don't reorder or re-group class members

Leave every member — including ones this skill doesn't otherwise touch — in its original position, even when a different arrangement would look tidier. In particular:

- Do not relocate lifecycle hooks to sit next to each other, or move them next to the constructor, "since they're all lifecycle hooks and it makes sense to group them" — that's a reasonable organizational preference in isolation, but doing it inside a signals-migration diff mixes a pure reorder with the actual signal-API change. A reviewer can no longer tell, line by line, whether something's logic changed or it just moved, which is exactly the kind of noise a migration diff should avoid.
- Do not sort or re-group properties by category (injected services, inputs, outputs, queries, other state) as a side effect of this migration, even if the codebase has (or later adopts) a documented canonical member order. Applying such a convention is a separate, dedicated change — ideally done with a tool that can prove it's a pure reorder (e.g. by diffing the multiset of non-blank lines before/after) and reviewed on its own — never folded into an individual component's signals migration.
- The only acceptable reason to move a member is when the signal conversion itself requires it: an `effect()` must be created inside the constructor, so logic that becomes an `effect()` has to move there if it wasn't already; a `computed()`/`signal()` referenced before its own declaration point may need to move earlier to satisfy TypeScript's use-before-declare check. Moves like these are fine — anything else is scope creep.

### Don't rename a field/property just because its role changed

When a field, getter, or method becomes a signal/computed/effect, keep its existing name. Do not rename it — including dropping a leading underscore, adding a `$`/other prefix, or otherwise restyling the identifier — purely to signal "this is now a computed/signal" or to match a naming convention, unless the rename is technically forced (the signal-creating API demands a different shape, a real identifier collision exists, or the user explicitly asks for that specific rename).

This matters even for a property that looks private-by-convention (an underscore prefix, no JSDoc, "clearly internal"): unless the language's own visibility modifier (`private`/`#field`) already enforced that, a consumer may already be reading it, so an unforced rename is still a potential breaking change — and even when nothing external reads it, the rename is still unrelated diff noise that makes the actual signal conversion harder to review. If the property's *access pattern* changed (e.g. a private field written imperatively in a lifecycle hook became a `computed()` that's safe to read anywhere), that's worth calling out in the migration notes — but the name itself should stay put unless something concrete forces it to change.

### Don't add comments the original code didn't have

Convert the declaration; don't narrate it. A field, method, or test that had no comment before the migration should have none after, even when the new signal-based form (a `computed()` replacing an imperative loop, a rewritten test) feels like it deserves an explanation. Let the code and, for tests, the test name carry the intent — the same way the pre-migration code did without a comment.

This applies to genuinely new code the migration introduces, not just converted lines: a `computed()` that replaces a multi-branch `ngOnInit` loop doesn't get a new JSDoc block explaining its fallback logic just because the old loop's logic wasn't obvious at a glance; a test written to replace one that tested since-removed behavior doesn't get a comment explaining what was removed and why. If a comment already existed on the member/line being converted, keep it (moved and reworded only as far as the "JSDoc on migrated members" section below requires) — the rule is about *adding* new commentary, not preserving old commentary. If in doubt whether an explanation is worth having permanently, that's a signal to raise it in the PR description or consumer migration document instead of the code itself, where it becomes diff noise that outlives the reason it was added.

### Don't change a property's type or default value beyond what the signal API requires

When a `@Input()`/decorator-based property or a plain mutable field becomes its signal equivalent (`input()`, `signal()`, etc.), its declared type union and its default/initial value must survive the conversion exactly — dropping a branch from the type, or picking a different sentinel default, is a silent behavior change riding along on what should be a pure mechanical conversion.

Two ways this drifts in practice:

- **Narrowing the type.** A property typed `number | null | undefined` before the migration stays `number | null | undefined` after — `input<number | null | undefined>(undefined, { transform: numberAttribute })`, not `input<number | undefined>(...)` with the `| null` branch quietly dropped because nothing today happens to pass `null`. The type describes what's *allowed*, not just what's currently exercised, and a caller or a future test relying on the dropped branch has no reason to suspect the migration touched it.
- **Picking a different default.** A plain field with no initializer (`messages: T[] | null | undefined;`, implicitly `undefined` until first assignment) becomes `signal<T[] | null | undefined>(undefined)` — not `signal(null)`. `null` and `undefined` are both "falsy/absent" to most read sites (`!value`, `isEmpty(value)`, a `@for`/`*ngFor` over it), which is exactly why this kind of drift survives a same-behavior-today review and every existing test: nothing currently distinguishes the two, so nothing fails. That's not evidence the change is safe, only that it hasn't been exercised yet.

```ts
// Before
export class MyComponent {
  @Input({ transform: numberAttribute }) count: number | null | undefined;
}
```

```ts
// After — type preserved exactly, including the branch nothing currently uses
export class MyComponent {
  count = input<number | null | undefined>(undefined, { transform: numberAttribute });
}
```

If a genuine type or default change is warranted (the property should no longer accept `null`, or a new signal default is actually being requested), that's a deliberate, separately-called-out decision — not a side effect of swapping a decorator for a signal function.

## Properties

### Flavor declarative approach

Update any property not initialized at declaration time but only initialized once statically without any specific requirement (like in constructor/any lifecycle hook).
Infer their type if it was previously explicit.

```ts
// Before
export class MyComponent {
  name: string;

  constructor() {
    name = 'optimus';
  }

}
```

```ts
// After
export class MyComponent {
  name = 'optimus';
}
```

Do not refactor these properties to Signals as not needed: their value does not change over time.

### Signals

Change all other properties to Signals — every property that's mutated after its declaration (assigned inside a constructor, a lifecycle hook, an event handler, or any other method), with no exceptions.

```ts
// Before
export class MyComponent {
  name = 'primeng';

  update() {
    this.name = 'optimus';
  }
}
```

```ts
// After
export class MyComponent {
 name = signal('primeng');

  update() {
    this.name.set('optimus');
  }
}
```

This applies whether or not the property is ever read reactively (from a template, a `computed()`, or an `effect()`). A private boolean guard flag that's only ever read and written inside plain imperative methods — never bound in a template, never depended on by a `computed()`/`effect()` — still qualifies: the test for "needs to be a signal" is *does this property's value change after declaration*, not *does anything currently react to that change*. It's easy to justify skipping such a property because nothing seems to depend on its reactivity today, but that's a property of today's callers, not of the field itself — a future template binding, `computed()`, or `effect()` added later would silently miss updates to a plain field, and there's no cheap way to notice that regression when it happens.

```ts
// Before — internal-only flag, never read reactively, still gets migrated
export class MyComponent {
  private isClosing = false;

  close() {
    this.isClosing = true;
    // ...
  }

  private onLeaveComplete() {
    if (!this.isClosing) {
      // ...
    }
  }
}
```

```ts
// After
export class MyComponent {
  private isClosing = signal(false);

  close() {
    this.isClosing.set(true);
    // ...
  }

  private onLeaveComplete() {
    if (!this.isClosing()) {
      // ...
    }
  }
}
```

**Don't let another component's unmigrated properties set the bar for this one.** If a search of the codebase turns up a sibling/related component that already went through this migration but still left a similar property as a plain field, treat that as a gap in that earlier migration — not as precedent, prior art, or an established convention that excuses leaving the property in front of you unconverted. Every component's migration applies this rule on its own terms, in full, regardless of what an earlier or neighboring migration did or didn't do; it doesn't "predate" (inherit) gaps from other components just because they exist elsewhere in the same codebase. If the inconsistency is worth fixing, say so and flag the other component as a follow-up — don't resolve the inconsistency by matching its incompleteness instead of the rule.

### Computed Signals

Refactor any function returning a value based on local properties to Computed Signals.
It affects both getters and more generic functions.

```ts
// Before
export class MyComponent {
 name = signal('primeng');

  get lowerName() {
    return this.name().toLowerCase();
  }
}
```

```ts
// After
export class MyComponent {
 name = signal('primeng');

 lowerName = computed(() => this.name().toLowerCase());
}
```

## RxJS Subjects and BehaviorSubjects

RxJS `Subject`/`BehaviorSubject` is often used just to hold and broadcast local component state — that role is exactly what signals replace, along with the manual subscribe/unsubscribe boilerplate it drags along. Migrate the *state-holding* uses; leave genuine async/event-stream uses alone (see "When to leave RxJS alone" below).

### BehaviorSubject as component state

A `BehaviorSubject` exposed via `.asObservable()` and read in the template with `| async` is state with a current value — convert it directly to a `signal()`. `.next(value)` becomes `.set(value)` (or `.update()` for a value derived from the current one).

```ts
// Before
export class MyComponent {
  private nameSubject = new BehaviorSubject<string>('primeng');
  name$ = this.nameSubject.asObservable();

  updateName(value: string) {
    this.nameSubject.next(value);
  }
}
```

```html
<!-- Before (template) -->
<span>{{ name$ | async }}</span>
```

```ts
// After
export class MyComponent {
  name = signal('primeng');

  updateName(value: string) {
    this.name.set(value);
  }
}
```

```html
<!-- After (template) -->
<span>{{ name() }}</span>
```

Drop the `AsyncPipe`/`CommonModule` import for this binding if nothing else in the template still needs `| async`.

### Plain Subject used to track a current value

A plain `Subject` combined with a separately-tracked "current value" field (updated inside a `.subscribe()` callback) is the same state pattern with extra indirection — collapse both into one `signal()`.

```ts
// Before
export class MyComponent {
  private countSubject = new Subject<number>();
  count = 0;

  constructor() {
    this.countSubject.subscribe((value) => (this.count = value));
  }

  increment() {
    this.countSubject.next(this.count + 1);
  }
}
```

```ts
// After
export class MyComponent {
  count = signal(0);

  increment() {
    this.count.update((value) => value + 1);
  }
}
```

### Combined/derived observables → computed()

Once the underlying Subjects are signals, drop `combineLatest`/`withLatestFrom`/`.pipe(map(...))` chains that only combine them for a derived local value — use `computed()` instead. It tracks every signal it reads with no combination operator needed.

```ts
// Before
export class MyComponent {
  private firstNameSubject = new BehaviorSubject('John');
  private lastNameSubject = new BehaviorSubject('Doe');

  fullName$ = combineLatest([this.firstNameSubject, this.lastNameSubject]).pipe(
    map(([first, last]) => `${first} ${last}`)
  );
}
```

```ts
// After
export class MyComponent {
  firstName = signal('John');
  lastName = signal('Doe');

  fullName = computed(() => `${this.firstName()} ${this.lastName()}`);
}
```

### Boilerplate that disappears with the migration

Once a Subject becomes a signal, remove what only existed to manage its subscription: the `Subscription` field, `ngOnDestroy`'s `.unsubscribe()` call for it, and any `takeUntil(this.destroy$)`/`takeUntilDestroyed()` operator that existed solely to stop that subscription. Signals don't need to be unsubscribed — don't leave dead cleanup code behind, and don't remove `OnDestroy`/the destroy subject entirely if something else in the component still needs it.

### Bridging with toSignal() for genuine async sources

For an Observable that legitimately comes from outside the component (an HTTP call, a WebSocket, another service's stream) rather than component-owned state, don't hand-roll a `signal()` plus manual `.subscribe()`/`ngOnDestroy` — use `toSignal()` from `@angular/core/rxjs-interop`, which subscribes and unsubscribes automatically.

```ts
// Before
export class MyComponent implements OnInit, OnDestroy {
  user: User | undefined;
  private sub?: Subscription;

  constructor(private userService: UserService) {}

  ngOnInit() {
    this.sub = this.userService.currentUser$.subscribe((user) => {
      this.user = user;
    });
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }
}
```

```ts
// After
export class MyComponent {
  private userService = inject(UserService);
  user = toSignal(this.userService.currentUser$);
}
```

`toSignal()` requires a way to represent "no value yet": pass `{ initialValue: ... }` to give it a synchronous starting value (e.g. `null`, `[]`), or, without one, the signal's type includes `undefined` until the first emission — update every read site to handle that instead of assuming a value is always present.

If the direction needs to be reversed — a signal has to be handed to code that still expects an `Observable` (a directive, a library, an RxJS pipeline) — use `toObservable()` from the same package rather than re-introducing a `Subject` to bridge it manually.

### When to leave RxJS alone

Not every Subject is state, and this migration should not force one to become a signal: a `Subject` used as a genuine multicast event bus (many independent subscribers, `debounceTime`/`switchMap`/`retry` chains feeding an HTTP call, a stream truly exposed as a public API other modules subscribe to with RxJS operators) stays as RxJS. The distinguishing question is whether the Subject is being read for its *current value* (state — migrate) or being *subscribed to as a stream of events with further RxJS composition* (an event bus — leave it).

## Inputs and Outputs

This also applies to the array-based `inputs: ['name']` / `outputs: ['nameChange']` form declared in `@Component()`/`@Directive()` metadata, not just the `@Input()`/`@Output()` decorators — the same conversion rules below apply; remove the property name from that array and declare it as `input()`/`output()` (or `model()`, see below) on the class instead.

### Inputs

Convert `@Input()` decorated properties to the `input()` signal function.

An input is required — and should become `input.required<T>()` — when the original code signals, in ANY of the following ways, that a value is always expected. Check for all of them, not just an explicit `required` flag:

**1. Explicit `required` option**

```ts
// Before
export class MyComponent {
  @Input({ required: true }) value = 0;
}
```

**2. Definite assignment assertion (`!`) on the property itself**

```ts
// Before
export class MyComponent {
  @Input() myRequiredInput!: unknown;
}
```

**3. Non-null assertion (`!`) forced somewhere else** — the property declaration isn't marked, but the code forces it with `!` at usage sites: inside a method/getter, or in the template. That forcing is itself evidence the author already treats it as always set.

```ts
// Before
export class MyComponent {
  @Input() user: User;

  greet() {
    return `Hello ${this.user!.name}`;
  }
}
```

```html
<!-- Before (template) -->
<span>{{ user!.name }}</span>
```

**4. Used without any guard at all** — no `?` modifier, no default value, and no null/undefined check anywhere it's read. The absence of any guard implies the author assumes it is always provided.

```ts
// Before
export class MyComponent {
  @Input() user: User;

  greet() {
    return `Hello ${this.user.name}`;
  }
}
```

All four cases above become the same thing after migration:

```ts
// After
export class MyComponent {
  value = input.required<number>();
  myRequiredInput = input.required<unknown>();
  user = input.required<User>();

  greet() {
    return `Hello ${this.user().name}`;
  }
}
```

```html
<!-- After (template) -->
<span>{{ user().name }}</span>
```

When converting, also strip any `!` non-null assertions left at usage sites and in templates — once the input is required, calling it (`this.user()`) is always defined, so the assertion is redundant.

An input that has a `?` modifier, a default value, or is genuinely read behind a null/undefined guard does NOT match any of the above and becomes a plain `input<T>()` instead.

```ts
// Before
export class MyComponent {
  @Input() name?: string;
}
```

```ts
// After
export class MyComponent {
  name = input<string>();
}
```

Update every internal usage of the property to call it as a function (`this.name()` instead of `this.name`), and remove the now-unused `Input` import once no `@Input()` decorators remain.

### Get/set input accessors

A `@Input()` is sometimes declared as a getter/setter pair backed by a private field, instead of a plain property. Because a signal input (`input()`) is read-only — there is no setter to intercept — the setter's body has to be redistributed rather than translated line-for-line. First classify what the setter actually does, then apply the matching rule:

**1. The setter only stores the value (no other logic).** Drop the accessor pair and the private backing field entirely; the signal itself replaces both.

```ts
// Before
export class MyComponent {
  private _name: string;

  @Input()
  set name(value: string) {
    this._name = value;
  }
  get name(): string {
    return this._name;
  }
}
```

```ts
// After
export class MyComponent {
  name = input<string>();
}
```

**2. The setter derives another value from the incoming one.** Turn the derived value into a `computed()` based on the input, instead of assigning it imperatively inside the setter.

```ts
// Before
export class MyComponent {
  private _name: string;
  displayName: string;

  @Input()
  set name(value: string) {
    this._name = value;
    this.displayName = value.toUpperCase();
  }
  get name(): string {
    return this._name;
  }
}
```

```ts
// After
export class MyComponent {
  name = input<string>();
  displayName = computed(() => this.name().toUpperCase());
}
```

**3. The setter runs a side effect** (calls a method, triggers a subscription, logs, mutates something outside the component). Move that logic into an `effect()` created in the constructor, watching the new input signal — this is what re-runs the side effect whenever the value changes, since there's no setter left to trigger it.

```ts
// Before
export class MyComponent {
  private _id: string;

  @Input()
  set id(value: string) {
    this._id = value;
    this.loadData(value);
  }
  get id(): string {
    return this._id;
  }

  loadData(id: string) { /* ... */ }
}
```

```ts
// After
export class MyComponent {
  id = input<string>();

  constructor() {
    effect(() => {
      this.loadData(this.id());
    });
  }

  loadData(id: string) { /* ... */ }
}
```

**4. The setter resets a separately-mutable field.** If the field the setter writes to is *also* mutated independently elsewhere (a click handler, a method, a form control) — not just derived and read — it isn't a plain `computed()`. See "LinkedSignal" below.

A setter can combine several of these cases at once — split it accordingly: the purely derived part becomes a `computed()`, the side-effecting part becomes an `effect()`, the reset-but-overridable part becomes a `linkedSignal()`, and none of them should stay nested inside another.

Still apply the required-input detection rules above to the underlying property/type of a get/set pair (an explicit `required` option, a `!` assertion on the field or getter, `!` forced at usage sites, or no guard anywhere it's read) — a get/set accessor is just another spelling of an input and can be required exactly like a plain one.

After migrating, remove the private backing field and update every external caller of the old getter (`this.name`, or `component.name` from outside) to call the signal instead (`this.name()`).

### Outputs

Convert `@Output()` / `EventEmitter` properties to the `output()` function.

```ts
// Before
export class MyComponent {
  @Output() nameChange = new EventEmitter<string>();

  rename(name: string) {
    this.nameChange.emit(name);
  }
}
```

```ts
// After
export class MyComponent {
  nameChange = output<string>();

  rename(name: string) {
    this.nameChange.emit(name);
  }
}
```

`output()` keeps the same `.emit()` API, so call sites inside the component don't change — only the declaration changes, and the imports (`output` instead of `Output`, `EventEmitter`) need updating. Before converting a plain `@Output()`, check whether it's actually one half of a two-way binding pair — see "Two-way bound pairs" below, which takes priority over converting the input and output separately.

### Two-way bound pairs: model()

An `@Input()` paired with an `@Output()` following Angular's two-way-binding naming convention — `value` alongside `valueChange`, of the same type, existing specifically so a consumer can write `[(value)]=".."` — shouldn't become a separate `input()` and `output()`. Collapse the pair into a single `model()`: it's both readable and writable, and it emits its own `xChange` event automatically on every `.set()`/`.update()`, so the manual `.emit()` call disappears too.

```ts
// Before
export class MyComponent {
  @Input() value = 0;
  @Output() valueChange = new EventEmitter<number>();

  increment() {
    this.value++;
    this.valueChange.emit(this.value);
  }
}
```

```ts
// After
export class MyComponent {
  value = model(0);

  increment() {
    this.value.update((v) => v + 1);
  }
}
```

```html
<!-- Consumer template: unchanged -->
<my-component [(value)]="count"></my-component>
```

Apply the same required-detection rules used for plain inputs (see "Inputs" above) to choose between `model()` and `model.required<T>()`.

Only collapse the pair when the `xChange` output exists *specifically to support two-way binding on `x`* — matching name, same type, emitted on every change to `x` (programmatic or user-driven). An `@Output()` that merely shares a name prefix but represents a distinct semantic event (e.g. `selectionChange` emitted only in response to user interaction, not on every programmatic `.set()`) should stay a plain `output()` instead, since `model()`'s automatic emit-on-write behavior wouldn't match its original, narrower semantics.

## ViewChild / ContentChild queries

Convert `@ViewChild()`/`@ViewChildren()`/`@ContentChild()`/`@ContentChildren()` decorators to their signal-based equivalents: `viewChild()`, `viewChildren()`, `contentChild()`, `contentChildren()`.

### Singular queries: ViewChild → viewChild(), ContentChild → contentChild()

```ts
// Before
export class MyComponent {
  @ViewChild('box') box: ElementRef<HTMLElement>;
}
```

```ts
// After
export class MyComponent {
  box = viewChild<ElementRef<HTMLElement>>('box');
}
```

The same conversion applies to `@ContentChild()` → `contentChild()`.

Apply the same required-detection rules used for `@Input()` (see "Inputs" above — a `!` definite assignment assertion on the property, a `!` forced at usage sites, or no guard anywhere it's read) to decide between `viewChild()` and `viewChild.required()` (equivalently `contentChild()`/`contentChild.required()`). Queries also get one rule of their own, stronger than any of those: **`{ static: true }` on the decorator** — a static query is guaranteed to resolve before the first change detection runs, so it should always be required.

```ts
// Before
export class MyComponent {
  @ViewChild('box', { static: true }) box: ElementRef<HTMLElement>;
}
```

Any of those four signals produces the same result:

```ts
// After
export class MyComponent {
  box = viewChild.required<ElementRef<HTMLElement>>('box');
}
```

A query that's conditionally rendered (behind `*ngIf`/`@if`) and shows none of them stays a plain `viewChild()`/`contentChild()`, which returns `Signal<T | undefined>` — keep (or add) a guard at every read site rather than forcing it with `.required()`.

### Plural queries: ViewChildren → viewChildren(), ContentChildren → contentChildren()

```ts
// Before
export class MyComponent implements AfterViewInit {
  @ViewChildren('item') items: QueryList<ElementRef<HTMLElement>>;

  ngAfterViewInit() {
    console.log(this.items.length);
  }
}
```

```ts
// After
export class MyComponent {
  items = viewChildren<ElementRef<HTMLElement>>('item');

  constructor() {
    effect(() => {
      console.log(this.items().length);
    });
  }
}
```

The same conversion applies to `@ContentChildren()` → `contentChildren()`. There is no `.required` variant for plural queries — an empty array is already a valid, always-present result, so `viewChildren()`/`contentChildren()` always return `Signal<ReadonlyArray<T>>`.

Update every usage of the old `QueryList`:

- Read it as a function call: `this.items` → `this.items()`.
- `QueryList.toArray()` is unnecessary — the signal already returns a plain array.
- `.first` / `.last` become `this.items()[0]` / `this.items().at(-1)`.
- `.length`, `.forEach()`, `.map()`, etc. still work directly on the returned array — just call the signal first.
- A `.changes.subscribe(...)` used to react to the query results changing becomes an `effect()` that reads the signal — re-reading it inside `effect()` is what makes it re-run whenever the results change. Remove the subscription and any related `Subscription` field / `ngOnDestroy` cleanup.

Signal-based queries resolve automatically and can be read safely from `computed()`/`effect()`/the constructor without waiting on `ngAfterViewInit`/`ngAfterContentInit` — a hook that existed only to wait for a decorator-based query to become available can often be removed entirely once the query is migrated (see "DOM render timing" below for what remains once genuine DOM-timing work is still needed).

## LinkedSignal

Some state is a hybrid: it should default to a value *derived* from another signal (like `computed()`), but the component also needs to overwrite it locally afterward (like `signal()`) — and it should reset back to the derived default whenever the source changes. That combination is exactly what `linkedSignal()` is for. Migrate to it instead of `computed()` (which is read-only and can't be overridden) or a plain `signal()` with manual reset logic scattered across `ngOnChanges`/`effect()`.

**When to reach for it:** look for a property in the original code that is (a) reset to a source-derived value inside `ngOnChanges`, a setter, or an `effect()` whenever an input/signal changes, AND (b) also mutated independently elsewhere (a click handler, a method, a form control) between those resets. If a property is only ever set by the reactive logic and never mutated elsewhere, it's a `computed()`. If it's mutated elsewhere but never needs to reset when the source changes, it's a plain `signal()`.

**Use case: a selection that resets when its source list changes**

```ts
// Before
export class MyComponent implements OnChanges {
  @Input() options: string[] = [];
  selected: string;

  ngOnChanges(changes: SimpleChanges) {
    if (changes['options']) {
      this.selected = this.options[0];
    }
  }

  selectOption(option: string) {
    this.selected = option;
  }
}
```

```ts
// After
export class MyComponent {
  options = input<string[]>([]);
  selected = linkedSignal(() => this.options()[0]);

  selectOption(option: string) {
    this.selected.set(option);
  }
}
```

`linkedSignal(() => ...)` behaves like a `computed()` for its default value, but unlike `computed()` it also exposes `.set()`/`.update()`. Every time `options()` changes, `selected` resets to the new computation — but a manual `.set()` in between resets sticks until the next source change.

**Use case: preserving the previous value when it's still valid**

When resetting unconditionally to the default is wrong — e.g. keep the current selection if it still exists in the new list, and only fall back to a default otherwise — use the object form with `source` and `computation`, which receives the previous state:

```ts
// Before
export class MyComponent implements OnChanges {
  @Input() options: string[] = [];
  selected: string;

  ngOnChanges(changes: SimpleChanges) {
    if (changes['options'] && !this.options.includes(this.selected)) {
      this.selected = this.options[0];
    }
  }

  selectOption(option: string) {
    this.selected = option;
  }
}
```

```ts
// After
export class MyComponent {
  options = input<string[]>([]);
  selected = linkedSignal<string[], string>({
    source: this.options,
    computation: (options, previous) =>
      previous && options.includes(previous.value) ? previous.value : options[0],
  });

  selectOption(option: string) {
    this.selected.set(option);
  }
}
```

`previous` is `undefined` on the very first computation, and otherwise `{ source, value }` holding the prior source value and the linked signal's value at that time — guard for it accordingly.

**Use case: a get/set input accessor that resets separately-mutable internal state**

When a get/set input accessor's setter (see "Get/set input accessors" above) resets a *different*, independently-mutable field — not just a value that's only ever read — that field is a `linkedSignal()` derived from the input, not a `computed()`:

```ts
// Before
export class MyComponent {
  private _pageSize = 10;
  currentPageSize: number;

  @Input()
  set pageSize(value: number) {
    this._pageSize = value;
    this.currentPageSize = value;
  }
  get pageSize(): number {
    return this._pageSize;
  }

  onPageSizeChange(size: number) {
    this.currentPageSize = size;
  }
}
```

```ts
// After
export class MyComponent {
  pageSize = input(10);
  currentPageSize = linkedSignal(() => this.pageSize());

  onPageSizeChange(size: number) {
    this.currentPageSize.set(size);
  }
}
```

## Lifecycle hooks

### ngOnChanges

`ngOnChanges` almost always reacts to one or more `@Input()`s changing, so once those inputs become signal inputs, `ngOnChanges` itself can usually disappear. Decide where its logic goes using this priority order, favoring the most declarative option that fits:

**1. Prefer `computed()`.** If the hook's body only derives a value from the changed input(s) and stores it on the class — no service calls, no logging, no mutating anything outside the reactive graph — convert it to a `computed()` reading the input signal(s) directly. This is the default choice; only fall through to the next options when this doesn't fit.

```ts
// Before
export class MyComponent implements OnChanges {
  @Input() name: string;
  displayName: string;

  ngOnChanges() {
    this.displayName = this.name.toUpperCase();
  }
}
```

```ts
// After
export class MyComponent {
  name = input<string>();
  displayName = computed(() => this.name().toUpperCase());
}
```

**2. Use `linkedSignal()`** if the field the hook resets is *also* independently mutated elsewhere (a click handler, a method, a form control) — see "LinkedSignal" above. This is still not a side effect: the state is derived-with-override, not an imperative action.

**3. Fall back to `effect()`** only when the hook does something that isn't representable as a value — a genuine side effect: calling a service, logging, imperative DOM work, mutating something outside the component's own reactive state.

```ts
// Before
export class MyComponent implements OnChanges {
  @Input() id: string;

  ngOnChanges() {
    this.loadData(this.id);
  }

  loadData(id: string) { /* ... */ }
}
```

```ts
// After
export class MyComponent {
  id = input<string>();

  constructor() {
    effect(() => {
      this.loadData(this.id());
    });
  }

  loadData(id: string) { /* ... */ }
}
```

If a single `ngOnChanges` mixes several of these (derives one value, resets an overridable one, and triggers a side effect), split it: one `computed()`, one `linkedSignal()`, one `effect()` — never fold a pure derivation back into an `effect()` for convenience.

### Other lifecycle hooks (`ngOnInit`, `ngDoCheck`)

Apply the same priority order to logic in `ngOnInit`/`ngDoCheck` that reacts to signal-based state: `computed()` first, `linkedSignal()` when it's reset-but-overridable, and `effect()` only for genuine side effects. Keep one-time, non-reactive setup (subscribing to a static service, DOM setup that doesn't depend on signal values, etc.) in its existing lifecycle hook — do not convert it. (For `ngAfterViewInit`, `ngAfterContentInit`, `ngAfterViewChecked`, and `ngAfterContentChecked`, see "DOM render timing" below instead — those are about render timing, not signal reactivity.)

`ngOnChanges` and `ngDoCheck` can usually be removed entirely once every input they read is a signal input and their logic has moved to `computed()`, `linkedSignal()`, or `effect()`.

### DOM render timing: `afterRender()` / `afterNextRender()`

Favor `afterNextRender()` and `afterRender()` over `ngAfterViewInit`, `ngAfterContentInit`, `ngAfterViewChecked`, and `ngAfterContentChecked` whenever the hook's job is tied to render/DOM timing rather than to application state — do this migration whenever one of these hooks is present, even if the rest of the component is already otherwise using signals. Both are called once from an injection context (typically the constructor) and don't require the component to implement a lifecycle interface:

- **One-time, DOM-dependent setup** that used to live in `ngAfterViewInit`/`ngAfterContentInit` (measuring an element, focusing it, initializing a third-party library against a rendered DOM node) → `afterNextRender()`, which runs once, after the next render.
- **Logic that must re-run after every render** that used to live in `ngAfterViewChecked`/`ngAfterContentChecked` (DOM synchronization, re-measuring on every check) → `afterRender()`, which runs after every render.

```ts
// Before
export class MyComponent implements AfterViewInit {
  @ViewChild('box') box: ElementRef<HTMLElement>;

  ngAfterViewInit() {
    this.box.nativeElement.focus();
  }
}
```

```ts
// After
export class MyComponent {
  box = viewChild.required<ElementRef<HTMLElement>>('box');

  constructor() {
    afterNextRender(() => {
      this.box().nativeElement.focus();
    });
  }
}
```

```ts
// Before
export class MyComponent implements AfterViewChecked {
  @ViewChild('chart') chart: ElementRef<HTMLElement>;

  ngAfterViewChecked() {
    this.resizeChart(this.chart.nativeElement);
  }

  resizeChart(el: HTMLElement) { /* ... */ }
}
```

```ts
// After
export class MyComponent {
  chart = viewChild.required<ElementRef<HTMLElement>>('chart');

  constructor() {
    afterRender(() => {
      this.resizeChart(this.chart().nativeElement);
    });
  }

  resizeChart(el: HTMLElement) { /* ... */ }
}
```

These run on Angular's render schedule, not in reaction to a signal read — they are not a substitute for `effect()`/`computed()`. Keep using `effect()` when the goal is reacting to signal-based state changes; reach for `afterRender()`/`afterNextRender()` only when what matters is timing relative to the DOM render itself. Both also accept an options object with a `phase` (`earlyRead`, `write`, `mixedReadWrite`, `read`) for more precise scheduling when several such callbacks need to run in a specific order — use it if the original code relied on running before/after other DOM work.

### `effect()` is for side effects only

Never use `effect()` to derive and store a value from other signals — that is exactly what `computed()` is for. Using `effect()` for a derivation loses the benefits of a pure computation (memoization, no risk of redundant writes or update-ordering bugs, being usable directly in a template or inside another `computed()`). A reliable smell: if an `effect()`'s body does nothing but assign its result to a class field/signal and has no other observable action, it should be a `computed()` instead.

```ts
// Wrong: effect() used to derive a value
export class MyComponent {
  name = signal('primeng');
  lowerName = signal('');

  constructor() {
    effect(() => {
      this.lowerName.set(this.name().toLowerCase());
    });
  }
}
```

```ts
// Right: derive with computed()
export class MyComponent {
  name = signal('primeng');
  lowerName = computed(() => this.name().toLowerCase());
}
```

Reserve `effect()` for things that aren't values: logging/analytics, calling an imperative API (a service method, `localStorage`, a non-Angular library), synchronizing with the DOM outside of template bindings, or manually managing a subscription. If the work is actually DOM-render-timing-dependent rather than signal-reactive, it likely belongs in `afterRender()`/`afterNextRender()` instead (see above).

When an `effect()` (or a `computed()`) needs to read a signal's current value without creating a reactive dependency on it — e.g. reading a context/config signal that shouldn't itself cause the effect to re-run — wrap that specific read in `untracked(() => this.other())` rather than restructuring the effect to avoid the read, or worse, capturing a stale value from outside the reactive context.

## Change detection

### Adopt OnPush

Signals are most valuable paired with `ChangeDetectionStrategy.OnPush`: reading a signal in a template automatically notifies Angular's change detection, so an `OnPush` component whose template only reads signals (migrated inputs, local signals, computed signals, linked signals) re-renders exactly when one of them changes — no more, no less. Once every input and every template read in the component comes from a signal (or from an `@Input()` that's also been migrated), set `changeDetection: ChangeDetectionStrategy.OnPush` in its `@Component()` decorator rather than leaving it as a separate, optional cleanup step.

```ts
// Before
@Component({
  selector: 'my-component',
  templateUrl: './my-component.html',
})
export class MyComponent { /* ... */ }
```

```ts
// After
@Component({
  selector: 'my-component',
  templateUrl: './my-component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MyComponent { /* ... */ }
```

Don't add `OnPush` while the component still has un-migrated plain (non-signal) fields that the template reads directly, or `@Input()`s not yet converted — finish migrating those first, or the view can stop updating when they change.

### Remove now-redundant ChangeDetectorRef calls

A `this.cdr.markForCheck()` / `this.changeDetectorRef.detectChanges()` call that existed only to tell Angular "a property changed, please re-render" is redundant once that property is a signal — a signal write (`.set()`/`.update()`) already notifies Angular itself. Remove the call along with the manual-notification code path it supported, but keep `ChangeDetectorRef` (and its usage) if the component still relies on it for something unrelated to a signal write, such as detaching/reattaching the change detector.

```ts
// Before
export class MyComponent {
  name = 'primeng';

  constructor(private cdr: ChangeDetectorRef) {}

  update(value: string) {
    this.name = value;
    this.cdr.markForCheck();
  }
}
```

```ts
// After
export class MyComponent {
  name = signal('primeng');

  update(value: string) {
    this.name.set(value);
  }
}
```

## Component metadata

### Remove redundant `standalone: true`

Since Angular v19, components, directives, and pipes are standalone by default — an explicit `standalone: true` in `@Component()`/`@Directive()`/`@Pipe()` metadata is redundant and should be removed as part of this migration whenever it's found. Only remove the flag when it's set to `true`; leave `standalone: false` untouched (it still changes behavior, opting the class back into the NgModule-based system), and don't add `standalone: true` anywhere it's currently absent.

```ts
// Before
@Component({
  selector: 'my-component',
  standalone: true,
  templateUrl: './my-component.html',
})
export class MyComponent { /* ... */ }
```

```ts
// After
@Component({
  selector: 'my-component',
  templateUrl: './my-component.html',
})
export class MyComponent { /* ... */ }
```

This also applies to `@Directive()` and `@Pipe()` metadata carrying the same flag.

## Tests

Once a component's public surface changes (inputs, outputs, and queries becoming signals) and its internal state moves off RxJS, its spec file needs matching updates. A test suite that still compiles against the old API isn't proof the migration works, and one that was hand-adjusted just to compile without actually asserting through the new API isn't either — update assertions to genuinely exercise the migrated code.

### Setting inputs

Signal inputs are read-only from outside the component; direct assignment no longer works and must become `fixture.componentRef.setInput(...)`.

```ts
// Before
it('renders the name', () => {
  const fixture = TestBed.createComponent(MyComponent);
  fixture.componentInstance.name = 'optimus';
  fixture.detectChanges();
  expect(fixture.nativeElement.textContent).toContain('optimus');
});
```

```ts
// After
it('renders the name', () => {
  const fixture = TestBed.createComponent(MyComponent);
  fixture.componentRef.setInput('name', 'optimus');
  fixture.detectChanges();
  expect(fixture.nativeElement.textContent).toContain('optimus');
});
```

For an input migrated to `input.required<T>()` (or `model.required<T>()`), every test that creates the component must call `setInput()` for it before the first `detectChanges()` — Angular throws (`NG0950`) if a required input is never set. Add or fix tests accordingly rather than only updating the ones that already happened to set it.

### Reading component state

A signal has to be called, not read as a property — update every assertion that reads a migrated property, input, computed value, or query directly off the component instance.

```ts
// Before
expect(component.name).toBe('optimus');
expect(component.lowerName).toBe('optimus');
```

```ts
// After
expect(component.name()).toBe('optimus');
expect(component.lowerName()).toBe('optimus');
```

This includes migrated `viewChild()`/`contentChild()`/`viewChildren()`/`contentChildren()` queries — `expect(component.box()).toBeTruthy()` instead of `expect(component.box).toBeTruthy()`, after the same `fixture.detectChanges()` needed to resolve the query as before.

### Driving local writable signals

For a genuinely internal signal (not an input), a test can still call `.set()`/`.update()` directly on it since it's the same writable signal the component uses — but prefer exercising it through the component's public methods or simulated DOM interaction (the same way the test did before the migration) rather than reaching in and mutating implementation details, unless the test is specifically a narrow unit test of that signal's own logic.

### BehaviorSubject/Subject-based assertions

Drop test scaffolding that only existed to observe RxJS-based state: a test that subscribed to `component.name$` or wrapped itself in `fakeAsync`/`tick()` to let a `BehaviorSubject` emit can read the migrated signal synchronously instead.

```ts
// Before
it('updates the name', fakeAsync(() => {
  component.name$.subscribe((value) => expect(value).toBe('optimus'));
  component.updateName('optimus');
  tick();
}));
```

```ts
// After
it('updates the name', () => {
  component.updateName('optimus');
  expect(component.name()).toBe('optimus');
});
```

An output's test doesn't need to change: `output()` still exposes `.subscribe()` with the same shape as the old `EventEmitter`, so `component.nameChange.subscribe(callback)` keeps working as-is. A migrated `model()` still supports `.subscribe()` on its `xChange` counterpart the same way, in addition to `component.x()`/`component.x.set()` directly.

### Effects

`effect()` runs asynchronously (scheduled, not synchronous with the `.set()`/`setInput()` that triggered it), unlike the `ngOnChanges`/imperative code it replaced. After a test changes a signal an `effect()` depends on, flush pending effects before asserting on the side effect — call `fixture.detectChanges()` again (change detection flushes pending effects), or `TestBed.flushEffects()` where available if the assertion shouldn't require a full change-detection cycle.

```ts
// Before
it('logs when name changes', () => {
  const logSpy = spyOn(console, 'log');
  component.name = 'optimus';
  component.ngOnChanges();
  expect(logSpy).toHaveBeenCalledWith('name changed to', 'optimus');
});
```

```ts
// After
it('logs when name changes', () => {
  const logSpy = spyOn(console, 'log');
  fixture.componentRef.setInput('name', 'optimus');
  fixture.detectChanges(); // flushes the effect()
  expect(logSpy).toHaveBeenCalledWith('name changed to', 'optimus');
});
```

### afterRender() / afterNextRender()

These run after Angular commits a render, which in a test means after `fixture.detectChanges()` — for `afterNextRender()`, one `detectChanges()` call is enough. If the original test used `await fixture.whenStable()` to wait for async DOM work, keep that await after the migration too, since these callbacks are still scheduled outside the synchronous test body.

### toSignal()-backed state

A component field created with `toSignal(someObservable$)` reflects whatever the test's mock/service `Observable` emits. Feed the test double a synchronous value (e.g. `of(mockUser)`, or a `BehaviorSubject` from the mocked service) so the signal has a value by the first `detectChanges()`, and assert with `component.user()` rather than subscribing to the underlying source. If the migrated `toSignal()` call has no `initialValue`, also add a test asserting the pre-emission state is `undefined`, since callers now need to handle that case.

### LinkedSignal

Test both halves of a `linkedSignal()`'s behavior: that it resets to the derived default when its source changes, and that a manual `.set()` sticks until the next source change.

```ts
// After
it('resets the selection when options change', () => {
  fixture.componentRef.setInput('options', ['a', 'b']);
  fixture.detectChanges();
  expect(component.selected()).toBe('a');

  component.selectOption('b');
  expect(component.selected()).toBe('b');

  fixture.componentRef.setInput('options', ['c', 'd']);
  fixture.detectChanges();
  expect(component.selected()).toBe('c');
});
```

### OnPush regressions

Once a component adopts `ChangeDetectionStrategy.OnPush`, add or keep at least one test per input/signal that asserts the view actually re-renders after that signal changes (not just that the underlying value changed) — `fixture.componentRef.setInput(...)` / a signal `.set()` followed by `fixture.detectChanges()` and an assertion on `fixture.nativeElement`. This is what would catch a template accidentally reading a plain field that was left out of the signal migration and therefore stopped updating the view under `OnPush`.

## Documentation

Migrating a component's implementation to signals can leave its documentation out of sync even when nothing about its public template API (`[input]`, `(output)`, `[(model)]` bindings) changed for consumers — the property's *declared type* changes (an `@Input() name: string` becomes an `InputSignal<string>`, for instance), and anything generated from JSDoc or maintained by hand needs to keep describing the real shape of the class. Investigate this alongside the code migration, not as a follow-up.

### JSDoc on migrated members

Move and merge existing JSDoc comments onto their new declarations rather than dropping them:

- A single `@Input()`/`@Output()`/`@ViewChild()` with a JSDoc comment above it keeps that comment above the new `input()`/`output()`/`viewChild()` initializer.
- A two-way pair collapsed into `model()` (see "Two-way bound pairs" above) had two separate comments — one on the input, one on the output. Merge them into one comment on the `model()` field that describes both the read and the write side, rather than keeping only one and silently dropping the other's content.
- A get/set accessor pair (see "Get/set input accessors" above) often has JSDoc on the getter, the setter, or both, sometimes describing side effects that moved into a separate `computed()`/`effect()`/`linkedSignal()` — split that description too: what belongs to the input itself stays on the `input()` declaration, and what described the side effect now belongs wherever that logic landed, not silently discarded because the original comment's home no longer exists.
- Check for `@deprecated`, `@see`, or `@example` tags that reference decorator-specific mechanics (e.g. an example showing `@Input()` property assignment) — reword them to match the new declaration if the wording is now misleading, even though the runtime behavior for consumers is unchanged.

### Related doc projects

Look for whatever generates or hosts this component's public documentation — a `compodoc`/`typedoc` config, a Storybook setup with autodocs or an MDX file, a docs site under `/docs` that lists the component's API, or a README table of inputs/outputs — and check two things:

1. **Does the tool actually understand signal-based APIs?** Some documentation generators (older Compodoc versions in particular) were built against `@Input()`/`@Output()` decorators and may not recognize `input()`/`output()`/`model()`/`viewChild()` as public API members at all, silently dropping them from generated output. If the project uses one of these tools, verify — a quick regenerate-and-diff, or a changelog/version check — that it's new enough to pick up the migrated members, and flag a version bump as a needed follow-up if not, rather than letting migrated members quietly vanish from the docs.
2. **Does hand-maintained documentation need updating to match?** A README API table, a docs-site page, or Storybook `argTypes` that lists inputs and outputs as separate rows needs to reflect a collapsed `model()` as a single two-way-bindable entry instead of two; any example usage snippet showing the old constructor-injection or decorator-heavy internals (as opposed to the external `[x]`/`(xChange)`/`[(x)]` binding syntax, which stays the same) needs updating to match the new implementation.

Regenerate any generated docs after the migration and confirm the output actually reflects the new members before considering the component done — a stale generated doc that still shows `@Input() name: string` instead of the signal-based signature is a symptom the tool didn't pick up the change, not a sign the migration is finished.

## Final review checklist

Before considering a component's migration complete, re-scan the whole file (class, template, host bindings, styles that reference bindings, and its spec file) and confirm every item below — the migration is not done until all are true:

- [ ] The dead/deprecated code audit ran before the signal conversions, and everything it flagged was either removed or, if still relied on externally, deliberately kept and noted for the consumer migration document instead.
- [ ] Every removed or renamed public member (dead public API or resolved `@deprecated` member) has a corresponding entry in the consumer migration document (`MIGRATION.md`/changelog), with before/after usage and a note on whether it's automatable as a codemod.
- [ ] No class member was reordered or relocated beyond what the signal conversion itself required (an `effect()` moved into the constructor, a use-before-declare fix) — lifecycle hooks and every other member stayed in their original relative position; no unrelated member-grouping or category-sorting pass was folded into this diff.
- [ ] No field, getter, or method was renamed just because it became a signal/computed/effect — every migrated member kept its original identifier unless the rename was technically forced, including ones that look private-by-convention (leading underscore) but aren't actually language-enforced private.
- [ ] No new explanatory comment (JSDoc or `//`) was added anywhere in the diff — class members, tests, anything else — that didn't already exist there before the migration; genuinely new code (a replacement `computed()`, a rewritten test) relies on its own name/structure rather than a new comment to explain it.
- [ ] Every converted property's signal declaration has the exact same type union as its pre-migration `@Input()`/field type (no dropped `| null`/`| undefined` branch) and the exact same default/initial value (a field with no initializer became `signal(undefined)`/`input(undefined, ...)`, not `signal(null)` or some other sentinel picked because it looked equivalent against today's call sites).
- [ ] No `@Input()` decorators, and no array-based `inputs: [...]` metadata, remain — every former input is `input()` or `input.required()` (or `model()`/`model.required()`, see next item).
- [ ] No `@Input()`/`@Output()` pair matching the two-way naming convention (`x`/`xChange`) was left as separate `input()`/`output()` — it's a single `model()`/`model.required()`, unless the output's semantics genuinely differ from a plain two-way sync.
- [ ] No `@Input()` get/set accessor pairs or their private backing fields remain — each is a plain signal input, plus a `computed()`, `effect()`, and/or `linkedSignal()` if the setter did more than store the value.
- [ ] No `@Output()` decorators, `new EventEmitter()`, or array-based `outputs: [...]` metadata remain — every former output is `output()` (or folded into a `model()`).
- [ ] No `@ViewChild()`/`@ContentChild()` decorators remain — each is `viewChild()`/`viewChild.required()` or `contentChild()`/`contentChild.required()`.
- [ ] No `@ViewChildren()`/`@ContentChildren()` decorators or `QueryList` types remain — each is `viewChildren()`/`contentChildren()`, and any `.toArray()`/`.first`/`.last`/`.changes.subscribe()` usage was updated for the plain array signal.
- [ ] The now-unused `Input`, `Output`, `EventEmitter`, `ViewChild`, `ViewChildren`, `ContentChild`, `ContentChildren`, and `QueryList` imports are removed (only if nothing else in the file still needs them).
- [ ] Every converted property is read as a function call everywhere it's used: in the class body, in getters/methods, in template interpolations (`{{ x() }}` not `{{ x }}`), in template bindings (`[prop]="x()"`), and in any `@HostBinding()`/`host: {}` metadata that reads it.
- [ ] No leftover `!` non-null assertions remain on properties that became `.required()` (inputs, models, or queries) — in the class, in methods, or in the template — since they're redundant once the value is required.
- [ ] No property that changes over time is still assigned with plain `=` outside its declaration (e.g. `this.name = ...`); every such mutation now uses `.set()` or `.update()`. This includes properties never read reactively (a private guard flag only read/written inside imperative methods) — mutation-over-time is what triggers the conversion, not whether anything currently depends on it reactively.
- [ ] No property left as a plain (non-signal) field unless it is genuinely static/once-set per "Flavor declarative approach" — it never changes after that single assignment. A similar property left unconverted elsewhere in the codebase (a sibling component, an earlier migration) is not a valid reason to leave this one unconverted — that's a gap in the other migration, not a precedent to match.
- [ ] Every getter or function that only derives a value from other signals is now a `computed()`, not a plain getter or method.
- [ ] No `BehaviorSubject`/`Subject` remains where it was only used to hold or broadcast local component state — that's a `signal()`; only genuine multicast event buses or streams composed further with RxJS operators were deliberately left as-is.
- [ ] No `| async` pipe remains in the template for a value that is now a signal — replaced with a direct call (`x()`).
- [ ] No `combineLatest`/`withLatestFrom`/manual multi-subject combination remains for local derived state — that's a `computed()`.
- [ ] No dangling `Subscription` field, `ngOnDestroy` unsubscribe call, or `takeUntil`/`takeUntilDestroyed()` remains for a subscription that no longer exists because its source became a signal.
- [ ] Any Observable genuinely sourced from outside the component (HTTP, WebSocket, another service) that feeds local state uses `toSignal()` rather than manual `.subscribe()`/`ngOnDestroy` bookkeeping.
- [ ] Any state that both defaults from another signal AND is independently overridable elsewhere is a `linkedSignal()` — not a plain `signal()` with leftover manual reset logic in `ngOnChanges`/`effect()`, and not a `computed()` that was force-written around.
- [ ] `ngOnChanges`/`ngDoCheck` are either removed or contain only logic that is NOT reactive to signals; every remaining reactive piece was placed by priority — `computed()` first, `linkedSignal()` second, `effect()` only as a last resort for genuine side effects.
- [ ] No `effect()` exists purely to compute and assign a value to another signal/field — that logic is a `computed()` instead.
- [ ] No `ngAfterViewInit`/`ngAfterContentInit` remains where its only purpose was one-time DOM-dependent setup — that's `afterNextRender()`.
- [ ] No `ngAfterViewChecked`/`ngAfterContentChecked` remains where its only purpose was DOM work repeated on every check — that's `afterRender()`.
- [ ] The component uses `ChangeDetectionStrategy.OnPush` once its inputs and template reads are fully signal-based, and no `ChangeDetectorRef.markForCheck()`/`detectChanges()` call remains that existed only to notify Angular of a now-signal property change.
- [ ] No `standalone: true` remains in `@Component()`/`@Directive()`/`@Pipe()` metadata (redundant default since Angular v19) — `standalone: false`, where present, was left alone.
- [ ] No signal (property, input, model, computed, linked signal, or query) is referenced without calling it (`this.x` instead of `this.x()`) anywhere in the class, template, or host bindings.
- [ ] Every test that used to assign an input directly now uses `fixture.componentRef.setInput(...)`, and every test that creates a component with a required input/model sets it before the first `detectChanges()`.
- [ ] Every test assertion reading a migrated property/input/computed/query off the component reads it as a function call, not a bare property.
- [ ] No test still wraps itself in `fakeAsync`/`tick()` or subscribes to a Subject/BehaviorSubject-backed property solely to observe state that is now a synchronous signal.
- [ ] Any test asserting on an `effect()`'s side effect flushes it (`fixture.detectChanges()` or `TestBed.flushEffects()`) after the triggering `.set()`/`setInput()`.
- [ ] If the component adopted `OnPush`, at least one test per migrated input/signal asserts the rendered view actually updates after it changes, not just that the underlying value did.
- [ ] JSDoc comments on every migrated member were moved (and, for collapsed `model()` pairs or split get/set accessors, merged/redistributed) onto their new declarations rather than dropped.
- [ ] Any documentation generator (Compodoc/TypeDoc/Storybook/etc.) used by this project was verified to actually pick up the migrated signal-based members, with a version bump flagged if it doesn't; hand-maintained docs (README tables, docs-site pages, Storybook argTypes) were updated to match, including collapsing two-way pairs into one entry.
- [ ] The component still type-checks/compiles after the migration, and its test suite passes with no assertions silently weakened just to make it compile.
