import { CommonModule } from '@angular/common';
import { afterEveryRender, booleanAttribute, ChangeDetectionStrategy, Component, computed, inject, input, NgModule, TemplateRef, ViewEncapsulation, contentChild, contentChildren } from '@angular/core';
import { PrimeTemplate, SharedModule } from '@openng/optimus-ui/api';
import { BaseComponent, PARENT_INSTANCE } from '@openng/optimus-ui/basecomponent';
import { Bind } from '@openng/optimus-ui/bind';
import type { BadgeSeverity } from '@openng/optimus-ui/types/badge';
import { TagPassThrough } from '@openng/optimus-ui/types/tag';
import { TagStyle } from './style/tagstyle';

/**
 * Tag component is used to categorize content.
 * @group Components
 */
@Component({
    selector: 'p-tag',
    imports: [CommonModule, SharedModule, Bind],
    template: `
        <ng-content></ng-content>
        @if (!iconTemplate() && !_iconTemplate()) {
            @if (icon()) {
                <span [class]="cx('icon')" [ngClass]="icon()" [pBind]="ptm('icon')"></span>
            }
        }
        @if (iconTemplate() || _iconTemplate()) {
            <span [class]="cx('icon')" [pBind]="ptm('icon')">
                <ng-template *ngTemplateOutlet="iconTemplate() || _iconTemplate()"></ng-template>
            </span>
        }
        <span [class]="cx('label')" [pBind]="ptm('label')">{{ value() }}</span>
    `,
    changeDetection: ChangeDetectionStrategy.OnPush,
    encapsulation: ViewEncapsulation.None,
    providers: [TagStyle, { provide: PARENT_INSTANCE, useExisting: Tag }],
    host: {
        '[class]': "cx('root')",
        '[attr.data-p]': 'dataP()'
    },
    hostDirectives: [Bind]
})
export class Tag extends BaseComponent<TagPassThrough> {
    componentName = 'Tag';

    bindDirectiveInstance = inject(Bind, { self: true });

    constructor() {
        super();
        afterEveryRender(() => this.bindDirectiveInstance.setAttrs(this.ptms(['host', 'root'])));
    }

    /**
     * Severity type of the tag.
     * @group Props
     */
    readonly severity = input<BadgeSeverity | undefined | null>();
    /**
     * Value to display inside the tag.
     * @group Props
     */
    readonly value = input<string | undefined>();
    /**
     * Icon of the tag to display next to the value.
     * @group Props
     */
    readonly icon = input<string | undefined>();
    /**
     * Whether the corners of the tag are rounded.
     * @group Props
     */
    readonly rounded = input<boolean | undefined>(undefined, { transform: booleanAttribute });

    /**
     * Custom icon template.
     * @group Templates
     */
    readonly iconTemplate = contentChild<TemplateRef<void>>('icon', { descendants: false });

    readonly templates = contentChildren(PrimeTemplate);

    readonly _iconTemplate = computed<TemplateRef<void> | undefined>(
        () =>
            this.templates()
                ?.filter((item) => item.getType() === 'icon')
                .at(-1)?.template
    );

    _componentStyle = inject(TagStyle);

    readonly dataP = computed(() => {
        return this.cn({
            rounded: this.rounded(),
            [this.severity() as string]: this.severity()
        });
    });
}

@NgModule({
    imports: [Tag, SharedModule],
    exports: [Tag, SharedModule]
})
export class TagModule {}
