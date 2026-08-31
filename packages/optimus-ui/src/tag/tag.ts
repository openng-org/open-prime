import { CommonModule } from '@angular/common';
import { AfterContentInit, booleanAttribute, ChangeDetectionStrategy, Component, inject, InjectionToken, Input, NgModule, TemplateRef, ViewEncapsulation, contentChild, contentChildren } from '@angular/core';
import { PrimeTemplate, SharedModule } from '@openng/optimus-ui/api';
import { BaseComponent, PARENT_INSTANCE } from '@openng/optimus-ui/basecomponent';
import { Bind } from '@openng/optimus-ui/bind';
import type { BadgeSeverity } from '@openng/optimus-ui/types/badge';
import { TagPassThrough } from '@openng/optimus-ui/types/tag';
import { TagStyle } from './style/tagstyle';

const TAG_INSTANCE = new InjectionToken<Tag>('TAG_INSTANCE');

/**
 * Tag component is used to categorize content.
 * @group Components
 */
@Component({
    selector: 'p-tag',
    standalone: true,
    imports: [CommonModule, SharedModule, Bind],
    template: `
        <ng-content></ng-content>
        @if (!iconTemplate() && !_iconTemplate) {
            @if (icon) {
                <span [class]="cx('icon')" [ngClass]="icon" [pBind]="ptm('icon')"></span>
            }
        }
        @if (iconTemplate() || _iconTemplate) {
            <span [class]="cx('icon')" [pBind]="ptm('icon')">
                <ng-template *ngTemplateOutlet="iconTemplate() || _iconTemplate"></ng-template>
            </span>
        }
        <span [class]="cx('label')" [pBind]="ptm('label')">{{ value }}</span>
    `,
    changeDetection: ChangeDetectionStrategy.OnPush,
    encapsulation: ViewEncapsulation.None,
    providers: [TagStyle, { provide: TAG_INSTANCE, useExisting: Tag }, { provide: PARENT_INSTANCE, useExisting: Tag }],
    host: {
        '[class]': "cn(cx('root'), styleClass)",
        '[attr.data-p]': 'dataP'
    },
    hostDirectives: [Bind]
})
export class Tag extends BaseComponent<TagPassThrough> implements AfterContentInit {
    componentName = 'Tag';
    $pcTag: Tag | undefined = inject(TAG_INSTANCE, { optional: true, skipSelf: true }) ?? undefined;

    bindDirectiveInstance = inject(Bind, { self: true });

    onAfterViewChecked(): void {
        this.bindDirectiveInstance.setAttrs(this.ptms(['host', 'root']));
    }

    /**
     * Style class of the component.
     * @deprecated since v20.0.0, use `class` instead.
     * @group Props
     */
    @Input() styleClass: string | undefined;
    /**
     * Severity type of the tag.
     * @group Props
     */
    @Input() severity: BadgeSeverity | undefined | null;
    /**
     * Value to display inside the tag.
     * @group Props
     */
    @Input() value: string | undefined;
    /**
     * Icon of the tag to display next to the value.
     * @group Props
     */
    @Input() icon: string | undefined;
    /**
     * Whether the corners of the tag are rounded.
     * @group Props
     */
    @Input({ transform: booleanAttribute }) rounded: boolean | undefined;

    /**
     * Custom icon template.
     * @group Templates
     */
    readonly iconTemplate = contentChild<TemplateRef<void>>('icon', { descendants: false });

    readonly templates = contentChildren(PrimeTemplate);

    _iconTemplate: TemplateRef<void> | undefined;

    _componentStyle = inject(TagStyle);

    onAfterContentInit() {
        this.templates()?.forEach((item) => {
            switch (item.getType()) {
                case 'icon':
                    this._iconTemplate = item.template;
                    break;
            }
        });
    }

    get dataP() {
        return this.cn({
            rounded: this.rounded,
            [this.severity as string]: this.severity
        });
    }
}

@NgModule({
    imports: [Tag, SharedModule],
    exports: [Tag, SharedModule]
})
export class TagModule {}
