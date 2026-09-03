import { CommonModule } from '@angular/common';
import { afterEveryRender, booleanAttribute, ChangeDetectionStrategy, Component, computed, inject, InjectionToken, input, NgModule, signal, TemplateRef, ViewEncapsulation, contentChild, contentChildren, output } from '@angular/core';
import { MotionOptions } from '@openng/optimus-ui-motion';
import { PrimeTemplate, SharedModule } from '@openng/optimus-ui/api';
import { BaseComponent, PARENT_INSTANCE } from '@openng/optimus-ui/basecomponent';
import { Bind } from '@openng/optimus-ui/bind';
import { MotionModule } from '@openng/optimus-ui/motion';
import { Ripple } from '@openng/optimus-ui/ripple';
import { MessageContainerTemplateContext, MessagePassThrough, MessageSeverity } from '@openng/optimus-ui/types/message';
import { MessageStyle } from './style/messagestyle';

const MESSAGE_INSTANCE = new InjectionToken<Message>('MESSAGE_INSTANCE');

/**
 * Message groups a collection of contents in tabs.
 * @group Components
 */
@Component({
    selector: 'p-message',
    imports: [CommonModule, Ripple, SharedModule, Bind, MotionModule],
    template: `
        <div [pBind]="ptm('contentWrapper')" [class]="cx('contentWrapper')" [attr.data-p]="dataP()">
            <div [pBind]="ptm('content')" [class]="cx('content')" [attr.data-p]="dataP()">
                @if (iconTemplate() || _iconTemplate()) {
                    <ng-container *ngTemplateOutlet="iconTemplate() || _iconTemplate()"></ng-container>
                }
                @if (icon()) {
                    <i [pBind]="ptm('icon')" [class]="cn(cx('icon'), icon())" [attr.data-p]="dataP()"></i>
                }

                @if (containerTemplate() || _containerTemplate()) {
                    <ng-container *ngTemplateOutlet="containerTemplate() || _containerTemplate(); context: { closeCallback: closeCallback }"></ng-container>
                } @else {
                    @if (!escape()) {
                        <div>
                            @if (!escape()) {
                                <span [pBind]="ptm('text')" [ngClass]="cx('text')" [innerHTML]="text()" [attr.data-p]="dataP()"></span>
                            }
                        </div>
                    } @else {
                        @if (escape() && text()) {
                            <span [pBind]="ptm('text')" [ngClass]="cx('text')" [attr.data-p]="dataP()">{{ text() }}</span>
                        }
                    }

                    <span [pBind]="ptm('text')" [ngClass]="cx('text')" [attr.data-p]="dataP()">
                        <ng-content></ng-content>
                    </span>
                }
                @if (closable()) {
                    <button [pBind]="ptm('closeButton')" pRipple type="button" [class]="cx('closeButton')" (click)="close($event)" [attr.aria-label]="closeAriaLabel()" [attr.data-p]="dataP()">
                        @if (closeIcon()) {
                            <i [pBind]="ptm('closeIcon')" [class]="cn(cx('closeIcon'), closeIcon())" [ngClass]="closeIcon()" [attr.data-p]="dataP()"></i>
                        }
                        @if (closeIconTemplate() || _closeIconTemplate()) {
                            <ng-container *ngTemplateOutlet="closeIconTemplate() || _closeIconTemplate()"></ng-container>
                        }
                        @if (!closeIconTemplate() && !_closeIconTemplate() && !closeIcon()) {
                            <svg [pBind]="ptm('closeIcon')" data-p-icon="times" [class]="cx('closeIcon')" [attr.data-p]="dataP()" />
                        }
                    </button>
                }
            </div>
        </div>
    `,
    changeDetection: ChangeDetectionStrategy.OnPush,
    encapsulation: ViewEncapsulation.None,
    providers: [MessageStyle, { provide: MESSAGE_INSTANCE, useExisting: Message }, { provide: PARENT_INSTANCE, useExisting: Message }],
    hostDirectives: [Bind],
    host: {
        '[attr.data-p]': 'dataP()',
        role: 'alert',
        'aria-live': 'polite',
        '[class]': 'cx("root")',
        '[animate.enter]': '"p-message-enter-active"',
        '[animate.leave]': '"p-message-leave-active"',
        '[class.p-message-leave-active]': '!visible()'
    }
})
export class Message extends BaseComponent<MessagePassThrough> {
    componentName = 'Message';

    _componentStyle = inject(MessageStyle);

    bindDirectiveInstance = inject(Bind, { self: true });

    $pcMessage: Message | undefined = inject(MESSAGE_INSTANCE, { optional: true, skipSelf: true }) ?? undefined;

    constructor() {
        super();

        afterEveryRender(() => {
            this.bindDirectiveInstance.setAttrs(this.ptms(['host', 'root']));
        });
    }

    /**
     * Severity level of the message.
     * @defaultValue 'info'
     * @group Props
     */
    severity = input<MessageSeverity | undefined | null>('info');
    /**
     * Text content.
     * @deprecated since v20.0.0. Use content projection instead '<p-message>Content</p-message>'.
     * @group Props
     */
    text = input<string | undefined>();
    /**
     * Whether displaying messages would be escaped or not.
     * @deprecated since v20.0.0. Use content projection instead '<p-message>Content</p-message>'.
     * @group Props
     */
    escape = input(true, { transform: booleanAttribute });
    /**
     * Inline style of the component.
     * @group Props
     */
    style = input<{ [klass: string]: any } | null | undefined>();
    /**
     * Whether the message can be closed manually using the close icon.
     * @group Props
     * @defaultValue false
     */
    closable = input(false, { transform: booleanAttribute });
    /**
     * Icon to display in the message.
     * @group Props
     * @defaultValue undefined
     */
    icon = input<string | undefined>();
    /**
     * Icon to display in the message close button.
     * @group Props
     * @defaultValue undefined
     */
    closeIcon = input<string | undefined>();
    /**
     * Delay in milliseconds to close the message automatically.
     * @defaultValue undefined
     */
    life = input<number | undefined>();
    /**
     * Defines the size of the component.
     * @group Props
     */
    size = input<'large' | 'small' | undefined>();
    /**
     * Specifies the input variant of the component.
     * @group Props
     */
    variant = input<'outlined' | 'text' | 'simple' | undefined>();
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
     * Emits when the message is closed.
     * @param {{ originalEvent: Event }} event - The event object containing the original event.
     * @group Emits
     */
    readonly onClose = output<{
        originalEvent: Event;
    }>();

    closeAriaLabel() {
        return this.config.translation.aria ? this.config.translation.aria.close : undefined;
    }

    visible = signal<boolean>(true);

    /**
     * Custom template of the message container.
     * @param {MessageContainerTemplateContext} context - container context.
     * @see {@link MessageContainerTemplateContext}
     * @group Templates
     */
    readonly containerTemplate = contentChild<TemplateRef<MessageContainerTemplateContext>>('container', { descendants: false });

    /**
     * Custom template of the message icon.
     * @group Templates
     */
    readonly iconTemplate = contentChild<TemplateRef<void>>('icon', { descendants: false });

    /**
     * Custom template of the close icon.
     * @group Templates
     */
    readonly closeIconTemplate = contentChild<TemplateRef<void>>('closeicon', { descendants: false });

    readonly templates = contentChildren(PrimeTemplate);

    _containerTemplate = computed<TemplateRef<MessageContainerTemplateContext> | undefined>(
        () =>
            this.templates()
                ?.filter((item) => item.getType() === 'container')
                .at(-1)?.template
    );

    _iconTemplate = computed<TemplateRef<void> | undefined>(
        () =>
            this.templates()
                ?.filter((item) => item.getType() === 'icon')
                .at(-1)?.template
    );

    _closeIconTemplate = computed<TemplateRef<void> | undefined>(
        () =>
            this.templates()
                ?.filter((item) => item.getType() === 'closeicon')
                .at(-1)?.template
    );

    closeCallback = (event: Event) => {
        this.close(event);
    };

    onInit() {
        if (this.life()) {
            setTimeout(() => {
                this.visible.set(false);
            }, this.life());
        }
    }

    /**
     * Closes the message.
     * @param {Event} event - Browser event.
     * @group Method
     */
    public close(event: Event) {
        this.visible.set(false);
        this.onClose.emit({ originalEvent: event });
    }

    dataP = computed(() =>
        this.cn({
            outlined: this.variant() === 'outlined',
            simple: this.variant() === 'simple',
            [this.severity() as string]: this.severity(),
            [this.size() as string]: this.size()
        })
    );
}

@NgModule({
    imports: [Message, SharedModule],
    exports: [Message, SharedModule]
})
export class MessageModule {}
