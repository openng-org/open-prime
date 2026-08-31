import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, InjectionToken, Input, NgModule, QueryList, TemplateRef, ViewEncapsulation, contentChild, contentChildren } from '@angular/core';
import { BlockableUI, PrimeTemplate, SharedModule } from '@openng/optimus-ui/api';
import { BaseComponent, PARENT_INSTANCE } from '@openng/optimus-ui/basecomponent';
import { Bind, BindModule } from '@openng/optimus-ui/bind';
import { ToolbarStyle } from './style/toolbarstyle';
import { ToolbarPassThrough } from '@openng/optimus-ui/types/toolbar';

const TOOLBAR_INSTANCE = new InjectionToken<Toolbar>('TOOLBAR_INSTANCE');

/**
 * Toolbar is a grouping component for buttons and other content.
 * @group Components
 */
@Component({
    selector: 'p-toolbar',
    standalone: true,
    imports: [CommonModule, SharedModule, BindModule],
    template: `
        <ng-content></ng-content>
        @if (startTemplate() || _startTemplate) {
            <div [class]="cx('start')" [pBind]="ptm('start')">
                <ng-container *ngTemplateOutlet="startTemplate() || _startTemplate"></ng-container>
            </div>
        }
        @if (centerTemplate() || _centerTemplate) {
            <div [class]="cx('center')" [pBind]="ptm('center')">
                <ng-container *ngTemplateOutlet="centerTemplate() || _centerTemplate"></ng-container>
            </div>
        }
        @if (endTemplate() || _endTemplate) {
            <div [class]="cx('end')" [pBind]="ptm('end')">
                <ng-container *ngTemplateOutlet="endTemplate() || _endTemplate"></ng-container>
            </div>
        }
    `,
    changeDetection: ChangeDetectionStrategy.OnPush,
    encapsulation: ViewEncapsulation.None,
    providers: [ToolbarStyle, { provide: TOOLBAR_INSTANCE, useExisting: Toolbar }, { provide: PARENT_INSTANCE, useExisting: Toolbar }],
    host: {
        '[class]': 'cn(cx("root"), styleClass)',
        role: 'toolbar',
        '[attr.aria-labelledby]': 'ariaLabelledBy'
    },
    hostDirectives: [Bind]
})
export class Toolbar extends BaseComponent<ToolbarPassThrough> implements BlockableUI {
    componentName = 'Toolbar';

    $pcToolbar: Toolbar | undefined = inject(TOOLBAR_INSTANCE, { optional: true, skipSelf: true }) ?? undefined;

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
     * Defines a string value that labels an interactive element.
     * @group Props
     */
    @Input() ariaLabelledBy: string | undefined;

    _componentStyle = inject(ToolbarStyle);

    getBlockableElement(): HTMLElement {
        return this.el.nativeElement.children[0];
    }
    /**
     * Custom start template.
     * @group Templates
     */
    readonly startTemplate = contentChild<TemplateRef<void>>('start', { descendants: false });

    /**
     * Custom end template.
     * @group Templates
     */
    readonly endTemplate = contentChild<TemplateRef<void>>('end', { descendants: false });

    /**
     * Custom center template.
     * @group Templates
     */
    readonly centerTemplate = contentChild<TemplateRef<void>>('center', { descendants: false });

    readonly templates = contentChildren(PrimeTemplate);

    _startTemplate: TemplateRef<void> | undefined;

    _endTemplate: TemplateRef<void> | undefined;

    _centerTemplate: TemplateRef<void> | undefined;

    onAfterContentInit() {
        (this.templates() as QueryList<PrimeTemplate>).forEach((item) => {
            switch (item.getType()) {
                case 'start':
                case 'left':
                    this._startTemplate = item.template;
                    break;

                case 'end':
                case 'right':
                    this._endTemplate = item.template;
                    break;

                case 'center':
                    this._centerTemplate = item.template;
                    break;
            }
        });
    }
}

@NgModule({
    imports: [Toolbar, SharedModule, BindModule],
    exports: [Toolbar, SharedModule, BindModule]
})
export class ToolbarModule {}
