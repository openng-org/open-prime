import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, InjectionToken, Input, NgModule, QueryList, signal, TemplateRef, ViewEncapsulation, contentChild, contentChildren } from '@angular/core';
import { equals } from '@openng/optimus-ui-utils';
import { BlockableUI, Footer, Header, PrimeTemplate, SharedModule } from '@openng/optimus-ui/api';
import { BaseComponent, PARENT_INSTANCE } from '@openng/optimus-ui/basecomponent';
import { Bind, BindModule } from '@openng/optimus-ui/bind';
import { CardStyle } from './style/cardstyle';
import { CardPassThrough } from '@openng/optimus-ui/types/card';

const CARD_INSTANCE = new InjectionToken<Card>('CARD_INSTANCE');

/**
 * Card is a flexible container component.
 * @group Components
 */
@Component({
    selector: 'p-card',
    standalone: true,
    imports: [CommonModule, SharedModule, BindModule],
    template: `
        @if (headerFacet() || headerTemplate() || _headerTemplate) {
            <div [pBind]="ptm('header')" [class]="cx('header')">
                <ng-content select="p-header"></ng-content>
                <ng-container *ngTemplateOutlet="headerTemplate() || _headerTemplate"></ng-container>
            </div>
        }
        <div [pBind]="ptm('body')" [class]="cx('body')">
            @if (header || titleTemplate() || _titleTemplate) {
                <div [pBind]="ptm('title')" [class]="cx('title')">
                    @if (header && !_titleTemplate && !titleTemplate()) {
                        {{ header }}
                    }
                    <ng-container *ngTemplateOutlet="titleTemplate() || _titleTemplate"></ng-container>
                </div>
            }
            @if (subheader || subtitleTemplate() || _subtitleTemplate) {
                <div [pBind]="ptm('subtitle')" [class]="cx('subtitle')">
                    @if (subheader && !_subtitleTemplate && !subtitleTemplate()) {
                        {{ subheader }}
                    }
                    <ng-container *ngTemplateOutlet="subtitleTemplate() || _subtitleTemplate"></ng-container>
                </div>
            }
            <div [pBind]="ptm('content')" [class]="cx('content')">
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
    `,
    changeDetection: ChangeDetectionStrategy.OnPush,
    encapsulation: ViewEncapsulation.None,
    providers: [CardStyle, { provide: CARD_INSTANCE, useExisting: Card }, { provide: PARENT_INSTANCE, useExisting: Card }],
    host: {
        '[class]': "cn(cx('root'), styleClass)",
        '[style]': '_style()'
    },
    hostDirectives: [Bind]
})
export class Card extends BaseComponent<CardPassThrough> implements BlockableUI {
    componentName = 'Card';

    $pcCard: Card | undefined = inject(CARD_INSTANCE, { optional: true, skipSelf: true }) ?? undefined;

    bindDirectiveInstance = inject(Bind, { self: true });

    _componentStyle = inject(CardStyle);

    onAfterViewChecked(): void {
        this.bindDirectiveInstance.setAttrs(this.ptms(['host', 'root']));
    }
    /**
     * Header of the card.
     * @group Props
     */
    @Input() header: string | undefined;
    /**
     * Subheader of the card.
     * @group Props
     */
    @Input() subheader: string | undefined;
    /**
     * Inline style of the element.
     * @group Props
     */
    @Input() set style(value: { [klass: string]: any } | null | undefined) {
        if (!equals(this._style(), value)) {
            this._style.set(value);
            // Apply style directly to avoid infinite loop in host binding
            if (this.el?.nativeElement) {
                if (value) {
                    Object.keys(value).forEach((key) => {
                        this.el.nativeElement.style[key] = value[key];
                    });
                }
            }
        }
    }

    get style() {
        return this._style();
    }
    /**
     * Class of the element.
     * @deprecated since v20.0.0, use `class` instead.
     * @group Props
     */
    @Input() styleClass: string | undefined;

    readonly headerFacet = contentChild(Header);

    readonly footerFacet = contentChild(Footer);

    /**
     * Custom header template.
     * @group Templates
     */
    readonly headerTemplate = contentChild<TemplateRef<void>>('header', { descendants: false });

    /**
     * Custom title template.
     * @group Templates
     */
    readonly titleTemplate = contentChild<TemplateRef<void>>('title', { descendants: false });

    /**
     * Custom subtitle template.
     * @group Templates
     */
    readonly subtitleTemplate = contentChild<TemplateRef<void>>('subtitle', { descendants: false });

    /**
     * Custom content template.
     * @group Templates
     */
    readonly contentTemplate = contentChild<TemplateRef<void>>('content', { descendants: false });

    /**
     * Custom footer template.
     * @group Templates
     */
    readonly footerTemplate = contentChild<TemplateRef<void>>('footer', { descendants: false });

    _headerTemplate: TemplateRef<void> | undefined;

    _titleTemplate: TemplateRef<void> | undefined;

    _subtitleTemplate: TemplateRef<void> | undefined;

    _contentTemplate: TemplateRef<void> | undefined;

    _footerTemplate: TemplateRef<void> | undefined;

    _style = signal<{ [klass: string]: any } | null | undefined>(null);

    getBlockableElement(): HTMLElement {
        return this.el.nativeElement;
    }

    readonly templates = contentChildren(PrimeTemplate);

    onAfterContentInit() {
        (this.templates() as QueryList<PrimeTemplate>).forEach((item) => {
            switch (item.getType()) {
                case 'header':
                    this._headerTemplate = item.template;
                    break;

                case 'title':
                    this._titleTemplate = item.template;
                    break;

                case 'subtitle':
                    this._subtitleTemplate = item.template;
                    break;

                case 'content':
                    this._contentTemplate = item.template;
                    break;

                case 'footer':
                    this._footerTemplate = item.template;
                    break;

                default:
                    this._contentTemplate = item.template;
                    break;
            }
        });
    }
}

@NgModule({
    imports: [Card, SharedModule, BindModule],
    exports: [Card, SharedModule, BindModule]
})
export class CardModule {}
