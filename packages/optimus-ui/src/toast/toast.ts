import { CommonModule } from '@angular/common';
import {
    booleanAttribute,
    ChangeDetectionStrategy,
    Component,
    computed,
    effect,
    EventEmitter,
    inject,
    InjectionToken,
    input,
    Input,
    NgModule,
    NgZone,
    numberAttribute,
    output,
    Output,
    signal,
    TemplateRef,
    ViewEncapsulation,
    contentChild,
    contentChildren
} from '@angular/core';
import { MotionEvent, MotionOptions } from '@openng/optimus-ui-motion';
import { isEmpty, setAttribute, uuid } from '@openng/optimus-ui-utils';
import { MessageService, PrimeTemplate, SharedModule, ToastMessageOptions } from '@openng/optimus-ui/api';
import { BaseComponent, PARENT_INSTANCE } from '@openng/optimus-ui/basecomponent';
import { Bind } from '@openng/optimus-ui/bind';
import { CheckIcon, ExclamationTriangleIcon, InfoCircleIcon, TimesCircleIcon, TimesIcon } from '@openng/optimus-ui/icons';
import { MotionModule } from '@openng/optimus-ui/motion';
import { ToastCloseEvent, ToastHeadlessTemplateContext, ToastItemCloseEvent, ToastMessageTemplateContext, ToastPassThrough, ToastPositionType } from '@openng/optimus-ui/types/toast';
import { ZIndexUtils } from '@openng/optimus-ui/utils';
import { Subscription } from 'rxjs';
import { ToastStyle } from './style/toaststyle';

const TOAST_INSTANCE = new InjectionToken<Toast>('TOAST_INSTANCE');

@Component({
    selector: 'p-toastItem',
    standalone: true,
    imports: [CommonModule, CheckIcon, ExclamationTriangleIcon, InfoCircleIcon, TimesIcon, TimesCircleIcon, SharedModule, Bind, MotionModule],
    template: `
        <div
            #container
            [pMotion]="visible()"
            [pMotionAppear]="true"
            [pMotionName]="'p-toast-message'"
            [pMotionOptions]="motionOptions()"
            (pMotionOnBeforeEnter)="onBeforeEnter($event)"
            (pMotionOnAfterLeave)="onAfterLeave($event)"
            [attr.id]="message?.id"
            [pBind]="ptm('message')"
            [class]="cn(cx('message'), message?.styleClass)"
            (mouseenter)="onMouseEnter()"
            (mouseleave)="onMouseLeave()"
            role="alert"
            aria-live="assertive"
            aria-atomic="true"
            [attr.data-p]="dataP"
        >
            @if (headlessTemplate) {
                <ng-container *ngTemplateOutlet="headlessTemplate; context: { $implicit: message, closeFn: onCloseIconClick }"></ng-container>
            } @else {
                <div [pBind]="ptm('messageContent')" [class]="cn(cx('messageContent'), message?.contentStyleClass)">
                    @if (!template) {
                        @if (message.icon) {
                            <span [pBind]="ptm('messageIcon')" [class]="cn(cx('messageIcon'), message?.icon)"></span>
                        } @else {
                            @switch (message.severity) {
                                @case ('success') {
                                    <svg [pBind]="ptm('messageIcon')" data-p-icon="check" [class]="cx('messageIcon')" [attr.aria-hidden]="true" />
                                }
                                @case ('info') {
                                    <svg [pBind]="ptm('messageIcon')" data-p-icon="info-circle" [class]="cx('messageIcon')" [attr.aria-hidden]="true" />
                                }
                                @case ('error') {
                                    <svg [pBind]="ptm('messageIcon')" data-p-icon="times-circle" [class]="cx('messageIcon')" [attr.aria-hidden]="true" />
                                }
                                @case ('warn') {
                                    <svg [pBind]="ptm('messageIcon')" data-p-icon="exclamation-triangle" [class]="cx('messageIcon')" [attr.aria-hidden]="true" />
                                }
                                @default {
                                    <svg [pBind]="ptm('messageIcon')" data-p-icon="info-circle" [class]="cx('messageIcon')" [attr.aria-hidden]="true" />
                                }
                            }
                        }
                        <div [pBind]="ptm('messageText')" [ngClass]="cx('messageText')" [attr.data-p]="dataP">
                            <div [pBind]="ptm('summary')" [ngClass]="cx('summary')" [attr.data-p]="dataP">
                                {{ message.summary }}
                            </div>
                            <div [pBind]="ptm('detail')" [ngClass]="cx('detail')" [attr.data-p]="dataP">{{ message.detail }}</div>
                        </div>
                    }
                    <ng-container *ngTemplateOutlet="template; context: { $implicit: message }"></ng-container>
                    @if (message?.closable !== false) {
                        <div>
                            <button
                                [pBind]="ptm('closeButton')"
                                type="button"
                                [attr.class]="cx('closeButton')"
                                (click)="onCloseIconClick($event)"
                                (keydown.enter)="onCloseIconClick($event)"
                                [attr.aria-label]="closeAriaLabel"
                                autofocus
                                [attr.data-p]="dataP"
                            >
                                @if (message.closeIcon) {
                                    @if (message.closeIcon) {
                                        <span [pBind]="ptm('closeIcon')" [class]="cn(cx('closeIcon'), message?.closeIcon)"></span>
                                    }
                                } @else {
                                    <svg [pBind]="ptm('closeIcon')" data-p-icon="times" [class]="cx('closeIcon')" [attr.aria-hidden]="true" />
                                }
                            </button>
                        </div>
                    }
                </div>
            }
        </div>
    `,
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [ToastStyle]
})
export class ToastItem extends BaseComponent<ToastPassThrough> {
    private zone = inject(NgZone);

    @Input() message: ToastMessageOptions | null | undefined;

    @Input({ transform: numberAttribute }) index: number | null | undefined;

    @Input({ transform: numberAttribute }) life: number;

    @Input() template: TemplateRef<ToastMessageTemplateContext> | undefined;

    @Input() headlessTemplate: TemplateRef<ToastHeadlessTemplateContext> | undefined;

    @Input() showTransformOptions: string | undefined;

    @Input() hideTransformOptions: string | undefined;

    @Input() showTransitionOptions: string | undefined;

    @Input() hideTransitionOptions: string | undefined;

    motionOptions = input<MotionOptions>();

    clearAll = input<any>(null);

    onAnimationStart = output<HTMLElement>();

    onAnimationEnd = output<HTMLElement>();

    onBeforeEnter(event: MotionEvent) {
        this.onAnimationStart.emit(event.element as HTMLElement);
    }

    onAfterLeave(event: MotionEvent) {
        if (!this.visible() && !this.isDestroyed) {
            this.onClose.emit({
                index: <number>this.index,
                message: <ToastMessageOptions>this.message
            });

            if (!this.isDestroyed) {
                this.onAnimationEnd.emit(event.element as HTMLElement);
            }
        }
    }

    @Output() onClose: EventEmitter<ToastItemCloseEvent> = new EventEmitter();

    _componentStyle = inject(ToastStyle);

    timeout: any;

    visible = signal<boolean | undefined>(undefined);

    private isDestroyed = false;

    private isClosing = false;

    constructor() {
        super();

        effect(() => {
            if (this.clearAll()) {
                this.visible.set(false);
            }
        });
    }

    onAfterViewInit() {
        this.message?.sticky && this.visible.set(true);
        this.initTimeout();
    }

    initTimeout() {
        if (!this.message?.sticky) {
            this.clearTimeout();
            this.zone.runOutsideAngular(() => {
                this.visible.set(true);
                this.timeout = setTimeout(
                    () => {
                        this.visible.set(false);
                    },
                    this.message?.life || this.life || 3000
                );
            });
        }
    }

    clearTimeout() {
        if (this.timeout) {
            clearTimeout(this.timeout);
            this.timeout = null;
        }
    }

    onMouseEnter() {
        this.clearTimeout();
    }

    onMouseLeave() {
        if (!this.isClosing) {
            this.initTimeout();
        }
    }

    onCloseIconClick = (event: Event) => {
        this.isClosing = true;
        this.clearTimeout();
        this.visible.set(false);
        event.preventDefault();
    };

    get closeAriaLabel() {
        return this.config.translation.aria ? this.config.translation.aria.close : undefined;
    }

    onDestroy() {
        this.isDestroyed = true;
        this.clearTimeout();
        this.visible.set(false);
    }

    get dataP() {
        return this.cn({
            [this.message?.severity as string]: this.message?.severity
        });
    }
}

/**
 * Toast is used to display messages in an overlay.
 * @group Components
 */
@Component({
    selector: 'p-toast',
    standalone: true,
    imports: [CommonModule, ToastItem, SharedModule],
    template: `
        @for (msg of messages; track msg; let i = $index) {
            <p-toastItem
                [message]="msg"
                [index]="i"
                [life]="life"
                [clearAll]="clearAllTrigger()"
                (onClose)="onMessageClose($event)"
                (onAnimationEnd)="onAnimationEnd()"
                (onAnimationStart)="onAnimationStart()"
                [template]="template() || _template"
                [headlessTemplate]="headlessTemplate() || _headlessTemplate"
                [pt]="pt"
                [unstyled]="unstyled()"
                [motionOptions]="computedMotionOptions()"
            ></p-toastItem>
        }
    `,
    changeDetection: ChangeDetectionStrategy.OnPush,
    encapsulation: ViewEncapsulation.None,
    providers: [ToastStyle, { provide: TOAST_INSTANCE, useExisting: Toast }, { provide: PARENT_INSTANCE, useExisting: Toast }],
    host: {
        '[class]': "cn(cx('root'), styleClass)",
        '[style]': "sx('root')",
        '[attr.data-p]': 'dataP'
    },
    hostDirectives: [Bind]
})
export class Toast extends BaseComponent<ToastPassThrough> {
    componentName = 'Toast';

    $pcToast: Toast | undefined = inject(TOAST_INSTANCE, { optional: true, skipSelf: true }) ?? undefined;

    bindDirectiveInstance = inject(Bind, { self: true });

    onAfterViewChecked(): void {
        this.bindDirectiveInstance.setAttrs(this.ptms(['host', 'root']));
    }
    /**
     * Key of the message in case message is targeted to a specific toast component.
     * @group Props
     */
    @Input() key: string | undefined;
    /**
     * Whether to automatically manage layering.
     * @group Props
     */
    @Input({ transform: booleanAttribute }) autoZIndex: boolean = true;
    /**
     * Base zIndex value to use in layering.
     * @group Props
     */
    @Input({ transform: numberAttribute }) baseZIndex: number = 0;
    /**
     * The default time to display messages for in milliseconds.
     * @group Props
     */
    @Input({ transform: numberAttribute }) life: number = 3000;
    /**
     * Inline class of the component.
     * @deprecated since v20.0.0, use `class` instead.
     * @group Props
     */
    @Input() styleClass: string | undefined;
    /**
     * Position of the toast in viewport.
     * @group Props
     */
    @Input() get position(): ToastPositionType {
        return this._position;
    }

    set position(value: ToastPositionType) {
        this._position = value;
        this.cd.markForCheck();
    }

    /**
     * It does not add the new message if there is already a toast displayed with the same content
     * @group Props
     */
    @Input({ transform: booleanAttribute }) preventOpenDuplicates: boolean = false;
    /**
     * Displays only once a message with the same content.
     * @group Props
     */
    @Input({ transform: booleanAttribute }) preventDuplicates: boolean = false;
    /**
     * Transform options of the show animation.
     * @group Props
     * @deprecated since v21.0.0. Use `motionOptions` instead.
     */
    @Input() showTransformOptions: string = 'translateY(100%)';
    /**
     * Transform options of the hide animation.
     * @group Props
     * @deprecated since v21.0.0. Use `motionOptions` instead.
     */
    @Input() hideTransformOptions: string = 'translateY(-100%)';
    /**
     * Transition options of the show animation.
     * @group Props
     * @deprecated since v21.0.0. Use `motionOptions` instead.
     */
    @Input() showTransitionOptions: string = '300ms ease-out';
    /**
     * Transition options of the hide animation.
     * @group Props
     * @deprecated since v21.0.0. Use `motionOptions` instead.
     */
    @Input() hideTransitionOptions: string = '250ms ease-in';
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
     * Object literal to define styles per screen size.
     * @group Props
     */
    @Input() breakpoints: { [key: string]: any } | undefined;
    /**
     * Callback to invoke when a message is closed.
     * @param {ToastCloseEvent} event - custom close event.
     * @group Emits
     */
    @Output() onClose: EventEmitter<ToastCloseEvent> = new EventEmitter<ToastCloseEvent>();
    /**
     * Custom message template.
     * @param {ToastMessageTemplateContext} context - message context.
     * @see {@link ToastMessageTemplateContext}
     * @group Templates
     */
    readonly template = contentChild<TemplateRef<ToastMessageTemplateContext>>('message');
    /**
     * Custom headless template.
     * @param {ToastHeadlessTemplateContext} context - headless context.
     * @see {@link ToastHeadlessTemplateContext}
     * @group Templates
     */
    readonly headlessTemplate = contentChild<TemplateRef<ToastHeadlessTemplateContext>>('headless');

    messageSubscription: Subscription | undefined;

    clearSubscription: Subscription | undefined;

    messages: ToastMessageOptions[] | null | undefined;

    messagesArchieve: ToastMessageOptions[] | undefined;

    _position: ToastPositionType = 'top-right';

    messageService: MessageService = inject(MessageService);

    _componentStyle = inject(ToastStyle);

    styleElement: any;

    id: string = uuid('pn_id_');

    readonly templates = contentChildren(PrimeTemplate);

    clearAllTrigger = signal<{} | null>(null);

    onInit() {
        this.messageSubscription = this.messageService.messageObserver.subscribe((messages) => {
            if (messages) {
                if (Array.isArray(messages)) {
                    const filteredMessages = messages.filter((m) => this.canAdd(m));
                    this.add(filteredMessages);
                } else if (this.canAdd(messages)) {
                    this.add([messages]);
                }
            }
        });

        this.clearSubscription = this.messageService.clearObserver.subscribe((key) => {
            if (key) {
                if (this.key === key) {
                    this.clearAll();
                }
            } else {
                this.clearAll();
            }

            this.cd.markForCheck();
        });
    }

    clearAll() {
        // trigger signal to clear all messages
        this.clearAllTrigger.set({});
    }

    _template: TemplateRef<ToastMessageTemplateContext> | undefined;

    _headlessTemplate: TemplateRef<ToastHeadlessTemplateContext> | undefined;

    onAfterContentInit() {
        this.templates()?.forEach((item) => {
            switch (item.getType()) {
                case 'message':
                    this._template = item.template;
                    break;
                case 'headless':
                    this._headlessTemplate = item.template;
                    break;

                default:
                    this._template = item.template;
                    break;
            }
        });
    }

    onAfterViewInit() {
        if (this.breakpoints) {
            this.createStyle();
        }
    }

    add(messages: ToastMessageOptions[]): void {
        this.messages = this.messages ? [...this.messages, ...messages] : [...messages];

        if (this.preventDuplicates) {
            this.messagesArchieve = this.messagesArchieve ? [...this.messagesArchieve, ...messages] : [...messages];
        }

        this.cd.markForCheck();
    }

    canAdd(message: ToastMessageOptions): boolean {
        let allow = this.key === message.key;

        if (allow && this.preventOpenDuplicates) {
            allow = !this.containsMessage(this.messages!, message);
        }

        if (allow && this.preventDuplicates) {
            allow = !this.containsMessage(this.messagesArchieve!, message);
        }

        return allow;
    }

    containsMessage(collection: ToastMessageOptions[], message: ToastMessageOptions): boolean {
        if (!collection) {
            return false;
        }

        return (
            collection.find((m) => {
                return m.summary === message.summary && m.detail == message.detail && m.severity === message.severity;
            }) != null
        );
    }

    onMessageClose(event: ToastItemCloseEvent) {
        this.messages?.splice(event.index, 1);

        this.onClose.emit({
            message: event.message
        });
        this.onAnimationEnd();
        this.cd.detectChanges();
    }

    onAnimationStart() {
        this.renderer.setAttribute(this.el?.nativeElement, this.id, '');
        if (this.autoZIndex && this.el?.nativeElement.style.zIndex === '') {
            ZIndexUtils.set('modal', this.el?.nativeElement, this.baseZIndex || this.config.zIndex.modal);
        }
    }

    onAnimationEnd() {
        if (this.autoZIndex && isEmpty(this.messages)) {
            ZIndexUtils.clear(this.el?.nativeElement);
        }
    }

    createStyle() {
        if (!this.styleElement) {
            this.styleElement = this.renderer.createElement('style');
            this.styleElement.type = 'text/css';
            setAttribute(this.styleElement, 'nonce', this.config?.csp()?.nonce);
            this.renderer.appendChild(this.document.head, this.styleElement);
            let innerHTML = '';
            for (let breakpoint in this.breakpoints) {
                let breakpointStyle = '';
                for (let styleProp in this.breakpoints[breakpoint]) {
                    breakpointStyle += styleProp + ':' + this.breakpoints[breakpoint][styleProp] + ' !important;';
                }
                innerHTML += `
                    @media screen and (max-width: ${breakpoint}) {
                        .p-toast[${this.id}] {
                           ${breakpointStyle}
                        }
                    }
                `;
            }

            this.renderer.setProperty(this.styleElement, 'innerHTML', innerHTML);
            setAttribute(this.styleElement, 'nonce', this.config?.csp()?.nonce);
        }
    }

    destroyStyle() {
        if (this.styleElement) {
            this.renderer.removeChild(this.document.head, this.styleElement);
            this.styleElement = null;
        }
    }

    onDestroy() {
        if (this.messageSubscription) {
            this.messageSubscription.unsubscribe();
        }

        if (this.el && this.autoZIndex) {
            ZIndexUtils.clear(this.el.nativeElement);
        }

        if (this.clearSubscription) {
            this.clearSubscription.unsubscribe();
        }

        this.destroyStyle();
    }

    get dataP() {
        return this.cn({
            [this.position]: this.position
        });
    }
}

@NgModule({
    imports: [Toast, SharedModule],
    exports: [Toast, SharedModule]
})
export class ToastModule {}
