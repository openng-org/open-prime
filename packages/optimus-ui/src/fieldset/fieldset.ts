import { CommonModule } from '@angular/common';
import { booleanAttribute, ChangeDetectionStrategy, Component, computed, ElementRef, inject, InjectionToken, input, Input, NgModule, TemplateRef, ViewEncapsulation, viewChild, contentChild, contentChildren, output } from '@angular/core';
import { MotionEvent, MotionOptions } from '@openng/optimus-ui-motion';
import { uuid } from '@openng/optimus-ui-utils';
import { BlockableUI, PrimeTemplate, SharedModule } from '@openng/optimus-ui/api';
import { BaseComponent, PARENT_INSTANCE } from '@openng/optimus-ui/basecomponent';
import { Bind, BindModule } from '@openng/optimus-ui/bind';
import { MinusIcon, PlusIcon } from '@openng/optimus-ui/icons';
import { MotionModule } from '@openng/optimus-ui/motion';
import type { FieldsetAfterToggleEvent, FieldsetBeforeToggleEvent, FieldsetPassThrough } from '@openng/optimus-ui/types/fieldset';
import { FieldsetStyle } from './style/fieldsetstyle';

const FIELDSET_INSTANCE = new InjectionToken<Fieldset>('FIELDSET_INSTANCE');

/**
 * Fieldset is a grouping component with the optional content toggle feature.
 * @group Components
 */
@Component({
    selector: 'p-fieldset',
    standalone: true,
    imports: [CommonModule, MinusIcon, PlusIcon, SharedModule, BindModule, MotionModule],
    template: `
        <fieldset [attr.id]="id" [ngStyle]="style" [class]="cn(cx('root'), styleClass)" [pBind]="ptm('root')" [attr.data-p]="dataP">
            <legend [class]="cx('legend')" [pBind]="ptm('legend')" [attr.data-p]="dataP">
                @if (toggleable) {
                    <button
                        [attr.id]="id + '_header'"
                        tabindex="0"
                        role="button"
                        [attr.aria-controls]="id + '_content'"
                        [attr.aria-expanded]="!collapsed"
                        [attr.aria-label]="buttonAriaLabel"
                        (click)="toggle($event)"
                        (keydown)="onKeyDown($event)"
                        [class]="cx('toggleButton')"
                        [pBind]="ptm('toggleButton')"
                    >
                        @if (collapsed) {
                            @if (!expandIconTemplate() && !_expandIconTemplate) {
                                <svg data-p-icon="plus" [class]="cx('toggleIcon')" [pBind]="ptm('toggleIcon')" />
                            }
                            @if (expandIconTemplate() || _expandIconTemplate) {
                                <span [class]="cx('toggleIcon')" [pBind]="ptm('toggleIcon')">
                                    <ng-container *ngTemplateOutlet="expandIconTemplate() || _expandIconTemplate"></ng-container>
                                </span>
                            }
                        }
                        @if (!collapsed) {
                            @if (!collapseIconTemplate() && !_collapseIconTemplate) {
                                <svg data-p-icon="minus" [class]="cx('toggleIcon')" [attr.aria-hidden]="true" [pBind]="ptm('toggleIcon')" />
                            }
                            @if (collapseIconTemplate() || _collapseIconTemplate) {
                                <span [class]="cx('toggleIcon')" [pBind]="ptm('toggleIcon')">
                                    <ng-container *ngTemplateOutlet="collapseIconTemplate() || _collapseIconTemplate"></ng-container>
                                </span>
                            }
                        }
                        <ng-container *ngTemplateOutlet="legendContent"></ng-container>
                    </button>
                } @else {
                    <span [class]="cx('legendLabel')" [pBind]="ptm('legendLabel')">{{ legend }}</span>
                    <ng-content select="p-header"></ng-content>
                    <ng-container *ngTemplateOutlet="headerTemplate() || _headerTemplate"></ng-container>
                }
                <ng-template #legendContent>
                    <span [class]="cx('legendLabel')" [pBind]="ptm('legendLabel')">{{ legend }}</span>
                    <ng-content select="p-header"></ng-content>
                    <ng-container *ngTemplateOutlet="headerTemplate() || _headerTemplate"></ng-container>
                </ng-template>
            </legend>
            <div
                [pBind]="ptm('contentContainer')"
                [pMotion]="!toggleable || (toggleable && !collapsed)"
                pMotionName="p-collapsible"
                [pMotionOptions]="computedMotionOptions()"
                [class]="cx('contentContainer')"
                [id]="id + '_content'"
                role="region"
                [attr.aria-labelledby]="id + '_header'"
                [attr.aria-hidden]="collapsed"
                [attr.tabindex]="collapsed ? '-1' : undefined"
                (pMotionOnAfterEnter)="onToggleDone($event)"
                (pMotionOnAfterLeave)="onToggleDone($event)"
            >
                <div [pBind]="ptm('contentWrapper')" [class]="cx('contentWrapper')">
                    <div [class]="cx('content')" [pBind]="ptm('content')" #contentWrapper>
                        <ng-content></ng-content>
                        <ng-container *ngTemplateOutlet="contentTemplate() || _contentTemplate"></ng-container>
                    </div>
                </div>
            </div>
        </fieldset>
    `,
    changeDetection: ChangeDetectionStrategy.OnPush,
    encapsulation: ViewEncapsulation.None,
    providers: [FieldsetStyle, { provide: FIELDSET_INSTANCE, useExisting: Fieldset }, { provide: PARENT_INSTANCE, useExisting: Fieldset }],
    hostDirectives: [Bind]
})
export class Fieldset extends BaseComponent<FieldsetPassThrough> implements BlockableUI {
    componentName = 'Fieldset';

    $pcFieldset: Fieldset | undefined = inject(FIELDSET_INSTANCE, { optional: true, skipSelf: true }) ?? undefined;

    _componentStyle = inject(FieldsetStyle);

    bindDirectiveInstance = inject(Bind, { self: true });

    onAfterViewChecked(): void {
        this.bindDirectiveInstance.setAttrs(this.ptm('host'));
    }

    get dataP() {
        return this.cn({
            toggleable: this.toggleable
        });
    }

    /**
     * Header text of the fieldset.
     * @group Props
     */
    @Input() legend: string | undefined;
    /**
     * When specified, content can toggled by clicking the legend.
     * @group Props
     * @defaultValue false
     */
    @Input({ transform: booleanAttribute }) toggleable: boolean | undefined;
    /**
     * Inline style of the component.
     * @group Props
     */
    @Input() style: { [klass: string]: any } | null | undefined;
    /**
     * Style class of the component.
     * @group Props
     */
    @Input() styleClass: string | undefined;
    /**
     * Transition options of the panel animation.
     * @group Props
     * @deprecated since v21.0.0, use `motionOptions` instead.
     */
    @Input() transitionOptions: string = '400ms cubic-bezier(0.86, 0, 0.07, 1)';
    /**
     * The motion options.
     * @group Props
     */
    motionOptions = input<MotionOptions | undefined>(undefined);

    computedMotionOptions = computed<MotionOptions>(() => {
        return {
            ...this.ptm('motion'),
            ...this.motionOptions()
        };
    });
    /**
     * Emits when the collapsed state changes.
     * @param {boolean} value - New value.
     * @group Emits
     */
    readonly collapsedChange = output<boolean>();
    /**
     * Callback to invoke before panel toggle.
     * @param {PanelBeforeToggleEvent} event - Custom toggle event
     * @group Emits
     */
    readonly onBeforeToggle = output<FieldsetBeforeToggleEvent>();
    /**
     * Callback to invoke after panel toggle.
     * @param {PanelAfterToggleEvent} event - Custom toggle event
     * @group Emits
     */
    readonly onAfterToggle = output<FieldsetAfterToggleEvent>();

    readonly contentWrapperViewChild = viewChild.required<ElementRef>('contentWrapper');

    private _id: string = uuid('pn_id_');

    get id() {
        return this._id;
    }

    get buttonAriaLabel() {
        return this.legend;
    }

    /**
     * Internal collapsed state
     */
    _collapsed: boolean | undefined;

    /**
     * Defines the initial state of content, supports one or two-way binding as well.
     * @group Props
     */
    @Input({ transform: booleanAttribute })
    get collapsed(): boolean | undefined {
        return this._collapsed;
    }
    set collapsed(value: boolean | undefined) {
        this._collapsed = value;
    }

    /**
     * Custom header template.
     * @group Templates
     */
    readonly headerTemplate = contentChild<TemplateRef<void>>('header', { descendants: false });

    /**
     * Custom expand icon template.
     * @group Templates
     */
    readonly expandIconTemplate = contentChild<TemplateRef<void>>('expandicon', { descendants: false });

    /**
     * Custom collapse icon template.
     * @group Templates
     */
    readonly collapseIconTemplate = contentChild<TemplateRef<void>>('collapseicon', { descendants: false });

    /**
     * Custom content template.
     * @group Templates
     */
    readonly contentTemplate = contentChild<TemplateRef<void>>('content', { descendants: false });

    toggle(event: MouseEvent) {
        this.onBeforeToggle.emit({ originalEvent: event, collapsed: this.collapsed });

        if (this.collapsed) this.expand();
        else this.collapse();

        event.preventDefault();
    }

    onKeyDown(event) {
        if (event.code === 'Enter' || event.code === 'Space') {
            this.toggle(event);
            event.preventDefault();
        }
    }

    expand() {
        this._collapsed = false;
        this.collapsedChange.emit(false);
        this.updateTabIndex();
    }

    collapse() {
        this._collapsed = true;
        this.collapsedChange.emit(true);
        this.updateTabIndex();
    }

    getBlockableElement(): HTMLElement {
        return this.el.nativeElement.children[0];
    }

    updateTabIndex() {
        const focusableElements = this.contentWrapperViewChild().nativeElement.querySelectorAll('input, button, select, a, textarea, [tabindex]');
        focusableElements.forEach((element: HTMLElement) => {
            if (this.collapsed) {
                element.setAttribute('tabindex', '-1');
            } else {
                element.removeAttribute('tabindex');
            }
        });
    }

    onToggleDone(event: MotionEvent) {
        this.onAfterToggle.emit({ originalEvent: event as any, collapsed: this.collapsed });
    }

    _headerTemplate: TemplateRef<void> | undefined;

    _expandIconTemplate: TemplateRef<void> | undefined;

    _collapseIconTemplate: TemplateRef<void> | undefined;

    _contentTemplate: TemplateRef<void> | undefined;

    readonly templates = contentChildren(PrimeTemplate);

    onAfterContentInit() {
        this.templates().forEach((item) => {
            switch (item.getType()) {
                case 'header':
                    this._headerTemplate = item.template;
                    break;

                case 'expandicon':
                    this._expandIconTemplate = item.template;
                    break;

                case 'collapseicon':
                    this._collapseIconTemplate = item.template;
                    break;

                case 'content':
                    this._contentTemplate = item.template;
                    break;
            }
        });
    }
}

@NgModule({
    imports: [Fieldset, SharedModule, BindModule],
    exports: [Fieldset, SharedModule, BindModule]
})
export class FieldsetModule {}
