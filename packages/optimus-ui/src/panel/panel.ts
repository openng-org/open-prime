import { CommonModule } from '@angular/common';
import { booleanAttribute, ChangeDetectionStrategy, Component, computed, ElementRef, inject, InjectionToken, input, Input, NgModule, TemplateRef, ViewEncapsulation, contentChild, viewChild, contentChildren, output } from '@angular/core';
import { MotionEvent, MotionOptions } from '@openng/optimus-ui-motion';
import { uuid } from '@openng/optimus-ui-utils';
import { BlockableUI, Footer, PrimeTemplate, SharedModule } from '@openng/optimus-ui/api';
import { BaseComponent, PARENT_INSTANCE } from '@openng/optimus-ui/basecomponent';
import { Bind, BindModule } from '@openng/optimus-ui/bind';
import { ButtonModule } from '@openng/optimus-ui/button';
import { MinusIcon, PlusIcon } from '@openng/optimus-ui/icons';
import { MotionModule } from '@openng/optimus-ui/motion';
import { Nullable } from '@openng/optimus-ui/ts-helpers';
import type { PanelAfterToggleEvent, PanelBeforeToggleEvent, PanelHeaderIconsTemplateContext, PanelPassThrough } from '@openng/optimus-ui/types/panel';
import { PanelStyle } from './style/panelstyle';

const PANEL_INSTANCE = new InjectionToken<Panel>('PANEL_INSTANCE');

/**
 * Panel is a container with the optional content toggle feature.
 * @group Components
 */
@Component({
    selector: 'p-panel',
    standalone: true,
    imports: [CommonModule, PlusIcon, MinusIcon, ButtonModule, SharedModule, BindModule, MotionModule],
    template: `
        @if (showHeader) {
            <div [pBind]="ptm('header')" [class]="cx('header')" (click)="onHeaderClick($event)" [attr.id]="id + '-titlebar'" [attr.data-p]="dataP">
                @if (_header) {
                    <span [pBind]="ptm('title')" [class]="cx('title')" [attr.id]="id + '_header'">{{ _header }}</span>
                }
                <ng-content select="p-header"></ng-content>
                <ng-container *ngTemplateOutlet="headerTemplate() || _headerTemplate"></ng-container>
                <div [pBind]="ptm('headerActions')" [class]="cx('headerActions')">
                    <ng-template *ngTemplateOutlet="iconsTemplate() || _iconsTemplate"></ng-template>
                    @if (toggleable) {
                        <p-button
                            [attr.id]="id + '_header'"
                            severity="secondary"
                            [text]="true"
                            [rounded]="true"
                            type="button"
                            role="button"
                            [styleClass]="cx('pcToggleButton')"
                            [attr.aria-label]="buttonAriaLabel"
                            [attr.aria-controls]="id + '_content'"
                            [attr.aria-expanded]="!collapsed"
                            (click)="onIconClick($event)"
                            (keydown)="onKeyDown($event)"
                            [buttonProps]="toggleButtonProps"
                            [pt]="ptm('pcToggleButton')"
                            [unstyled]="unstyled()"
                        >
                            <ng-template #icon>
                                @if (!headerIconsTemplate() && !_headerIconsTemplate && !toggleButtonProps?.icon) {
                                    @if (!collapsed) {
                                        <svg data-p-icon="minus" [pBind]="ptm('pcToggleButton.icon')" />
                                    }
                                    @if (collapsed) {
                                        <svg data-p-icon="plus" [pBind]="ptm('pcToggleButton.icon')" />
                                    }
                                }
                                <ng-template *ngTemplateOutlet="headerIconsTemplate() || _headerIconsTemplate; context: { $implicit: collapsed }"></ng-template>
                            </ng-template>
                        </p-button>
                    }
                </div>
            </div>
        }
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
        >
            <div [pBind]="ptm('contentWrapper')" [class]="cx('contentWrapper')">
                <div [pBind]="ptm('content')" [class]="cx('content')" #contentWrapper>
                    <ng-content></ng-content>
                    <ng-container *ngTemplateOutlet="contentTemplate() || _contentTemplate"></ng-container>
                </div>

                @if (footerFacet() || footerTemplate() || _footerTemplate) {
                    <div [pBind]="ptm('footer')" [class]="cx('footer')">
                        <ng-content select="p-footer"></ng-content>
                        <ng-container *ngTemplateOutlet="footerTemplate() || _footerTemplate"></ng-container>
                    </div>
                }
            </div>
        </div>
    `,
    changeDetection: ChangeDetectionStrategy.OnPush,
    encapsulation: ViewEncapsulation.None,
    providers: [PanelStyle, { provide: PANEL_INSTANCE, useExisting: Panel }, { provide: PARENT_INSTANCE, useExisting: Panel }],
    host: {
        '[id]': 'id',
        '[class]': "cn(cx('root'), styleClass)",
        '[attr.data-p]': 'dataP'
    },
    hostDirectives: [Bind]
})
export class Panel extends BaseComponent<PanelPassThrough> implements BlockableUI {
    componentName = 'Panel';

    $pcPanel: Panel | undefined = inject(PANEL_INSTANCE, { optional: true, skipSelf: true }) ?? undefined;

    _componentStyle = inject(PanelStyle);

    bindDirectiveInstance = inject(Bind, { self: true });

    onAfterViewChecked(): void {
        this.bindDirectiveInstance.setAttrs(this.ptms(['host', 'root']));
    }

    /**
     * Id of the component.
     */
    @Input() id: string | undefined = uuid('pn_id_');
    /**
     * Defines if content of panel can be expanded and collapsed.
     * @group Props
     */
    @Input({ transform: booleanAttribute }) toggleable: boolean | undefined;

    /**
     * Header text of the panel.
     * @group Props
     */
    @Input('header') _header: string | undefined;

    /**
     * Internal collapsed state
     */
    _collapsed: boolean | undefined;

    /**
     * Defines the initial state of panel content, supports one or two-way binding as well.
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
     * Style class of the component.
     * @group Props
     * @deprecated since v20.0.0, use `class` instead.
     */
    @Input() styleClass: string | undefined;

    /**
     * Position of the icons.
     * @group Props
     */
    @Input() iconPos: 'start' | 'end' | 'center' = 'end';

    /**
     * Specifies if header of panel cannot be displayed.
     * @group Props
     */
    @Input({ transform: booleanAttribute }) showHeader: boolean = true;

    /**
     * Specifies the toggler element to toggle the panel content.
     * @group Props
     */
    @Input() toggler: 'icon' | 'header' = 'icon';

    /**
     * Transition options of the animation.
     * @group Props
     * @deprecated since v21.0.0, use `motionOptions` instead.
     */
    @Input() transitionOptions: string = '400ms cubic-bezier(0.86, 0, 0.07, 1)';

    /**
     * Used to pass all properties of the ButtonProps to the Button component.
     * @group Props
     */
    @Input() toggleButtonProps: any;

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
     * Emitted when the collapsed changes.
     * @param {boolean} value - New Value.
     * @group Emits
     */
    readonly collapsedChange = output<boolean | undefined>();

    /**
     * Callback to invoke before panel toggle.
     * @param {PanelBeforeToggleEvent} event - Custom panel toggle event
     * @group Emits
     */
    readonly onBeforeToggle = output<PanelBeforeToggleEvent>();

    /**
     * Callback to invoke after panel toggle.
     * @param {PanelAfterToggleEvent} event - Custom panel toggle event
     * @group Emits
     */
    readonly onAfterToggle = output<PanelAfterToggleEvent>();

    readonly footerFacet = contentChild(Footer);
    /**
     * Defines template option for header.
     * @group Templates
     */
    readonly headerTemplate = contentChild<TemplateRef<void>>('header', { descendants: false });
    /**
     * Defines template option for icons.
     * @example
     * ```html
     * <ng-template #icons> </ng-template>
     * ```
     * @group Templates
     */
    readonly iconsTemplate = contentChild<TemplateRef<void>>('icons', { descendants: false });

    /**
     * Defines template option for content.
     * @example
     * ```html
     * <ng-template #content> </ng-template>
     * ```
     * @group Templates
     */
    readonly contentTemplate = contentChild<TemplateRef<void>>('content', { descendants: false });

    /**
     * Defines template option for footer.
     * @example
     * ```html
     * <ng-template #footer> </ng-template>
     * ```
     * @group Templates
     */
    readonly footerTemplate = contentChild<TemplateRef<void>>('footer', { descendants: false });

    /**
     * Defines template option for headerIcon.
     * @param {PanelHeaderIconsTemplateContext} context - context of the template.
     * @example
     * ```html
     * <ng-template #headericons let-collapsed> </ng-template>
     * ```
     * @see {@link PanelHeaderIconsTemplateContext}
     * @group Templates
     */
    readonly headerIconsTemplate = contentChild<TemplateRef<PanelHeaderIconsTemplateContext>>('headericons', { descendants: false });

    _headerTemplate: TemplateRef<void> | undefined;

    _iconsTemplate: TemplateRef<void> | undefined;

    _contentTemplate: TemplateRef<void> | undefined;

    _footerTemplate: TemplateRef<void> | undefined;

    _headerIconsTemplate: TemplateRef<PanelHeaderIconsTemplateContext> | undefined;

    readonly contentWrapperViewChild = viewChild.required<ElementRef>('contentWrapper');

    get buttonAriaLabel() {
        return this._header;
    }

    onHeaderClick(event: MouseEvent) {
        if (this.toggler === 'header') {
            this.toggle(event);
        }
    }

    onIconClick(event: MouseEvent) {
        if (this.toggler === 'icon') {
            this.toggle(event);
        }
    }

    toggle(event: MouseEvent) {
        this.onBeforeToggle.emit({ originalEvent: event, collapsed: this.collapsed });

        if (this.collapsed) this.expand();
        else this.collapse();

        event.preventDefault();
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
        return this.el.nativeElement;
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

    onKeyDown(event: KeyboardEvent) {
        if (event.code === 'Enter' || event.code === 'Space') {
            this.toggle(event as any);
            event.preventDefault();
        }
    }

    onToggleDone(event: MotionEvent) {
        this.onAfterToggle.emit({ originalEvent: event as any, collapsed: this.collapsed });
    }

    readonly templates = contentChildren(PrimeTemplate);

    onAfterContentInit() {
        this.templates().forEach((item) => {
            switch (item.getType()) {
                case 'header':
                    this._headerTemplate = item.template;
                    break;

                case 'content':
                    this._contentTemplate = item.template;
                    break;

                case 'footer':
                    this._footerTemplate = item.template;
                    break;

                case 'icons':
                    this._iconsTemplate = item.template;
                    break;

                case 'headericons':
                    this._headerIconsTemplate = item.template;
                    break;

                default:
                    this._contentTemplate = item.template;
                    break;
            }
        });
    }

    get dataP() {
        return this.cn({
            toggleable: this.toggleable
        });
    }
}

@NgModule({
    imports: [Panel, SharedModule, BindModule],
    exports: [Panel, SharedModule, BindModule]
})
export class PanelModule {}
