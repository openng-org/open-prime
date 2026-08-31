import { AfterViewChecked, AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, HostListener, inject, InjectionToken, Input, NgModule, OnDestroy, ViewEncapsulation, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { find } from '@openng/optimus-ui-utils';
import { SharedModule } from '@openng/optimus-ui/api';
import { BaseComponent, PARENT_INSTANCE } from '@openng/optimus-ui/basecomponent';
import { Bind } from '@openng/optimus-ui/bind';
import { TerminalPassThrough } from '@openng/optimus-ui/types/terminal';
import { Subscription } from 'rxjs';
import { TerminalStyle } from './style/terminalstyle';
import { TerminalService } from './terminalservice';

const TERMINAL_INSTANCE = new InjectionToken<Terminal>('TERMINAL_INSTANCE');

/**
 * Terminal is a text based user interface.
 * @group Components
 */
@Component({
    selector: 'p-terminal',
    standalone: true,
    imports: [FormsModule, SharedModule, Bind],
    template: `
        @if (welcomeMessage) {
            <div [class]="cx('welcomeMessage')" [pBind]="ptm('welcomeMessage')">{{ welcomeMessage }}</div>
        }
        <div [class]="cx('commandList')" [pBind]="ptm('commandList')">
            @for (command of commands; track command) {
                <div [class]="cx('command')" [pBind]="ptm('command')">
                    <span [class]="cx('promptLabel')" [pBind]="ptm('promptLabel')">{{ prompt }}</span>
                    <span [class]="cx('commandValue')" [pBind]="ptm('commandValue')">{{ command.text }}</span>
                    <div [class]="cx('commandResponse')" [pBind]="ptm('commandResponse')" [attr.aria-live]="'polite'">{{ command.response }}</div>
                </div>
            }
        </div>
        <div [class]="cx('prompt')" [pBind]="ptm('prompt')">
            <span [class]="cx('promptLabel')" [pBind]="ptm('promptLabel')">{{ prompt }}</span>
            <input #in type="text" [(ngModel)]="command" [ngModelOptions]="{ standalone: true }" [class]="cx('promptValue')" [pBind]="ptm('promptValue')" autocomplete="off" (keydown)="handleCommand($event)" autofocus />
        </div>
    `,
    changeDetection: ChangeDetectionStrategy.OnPush,
    encapsulation: ViewEncapsulation.None,
    providers: [TerminalStyle, { provide: TERMINAL_INSTANCE, useExisting: Terminal }, { provide: PARENT_INSTANCE, useExisting: Terminal }],
    host: {
        '[class]': "cn(cx('root'), styleClass)"
    },
    hostDirectives: [Bind]
})
export class Terminal extends BaseComponent<TerminalPassThrough> implements AfterViewInit, AfterViewChecked, OnDestroy {
    terminalService = inject(TerminalService);

    componentName = 'Terminal';
    $pcTerminal: Terminal | undefined = inject(TERMINAL_INSTANCE, { optional: true, skipSelf: true }) ?? undefined;

    bindDirectiveInstance = inject(Bind, { self: true });

    /**
     * Initial text to display on terminal.
     * @group Props
     */
    @Input() welcomeMessage: string | undefined;
    /**
     * Prompt text for each command.
     * @group Props
     */
    @Input() prompt: string | undefined;
    /**
     * Style class of the component.
     * @deprecated since v20.0.0, use `class` instead.
     * @group Props
     */
    @Input() styleClass: string | undefined;

    commands: any[] = [];

    command!: string;

    container!: Element;

    commandProcessed!: boolean;

    subscription: Subscription;

    _componentStyle = inject(TerminalStyle);

    readonly inputRef = viewChild.required<ElementRef<HTMLInputElement>>('in');

    @HostListener('click')
    onHostClick() {
        this.focus(this.inputRef().nativeElement);
    }

    constructor() {
        super();
        this.subscription = this.terminalService.responseHandler.subscribe((response) => {
            this.commands[this.commands.length - 1].response = response;
            this.commandProcessed = true;
        });
    }

    onAfterViewInit() {
        this.container = this.el.nativeElement;
    }

    onAfterViewChecked() {
        this.bindDirectiveInstance.setAttrs(this.ptms(['host', 'root']));

        if (this.commandProcessed) {
            this.container.scrollTop = this.container.scrollHeight;
            this.commandProcessed = false;
        }
    }

    @Input()
    set response(value: string) {
        if (value) {
            this.commands[this.commands.length - 1].response = value;
            this.commandProcessed = true;
        }
    }

    handleCommand(event: KeyboardEvent) {
        if (event.keyCode == 13) {
            this.commands.push({ text: this.command });
            this.terminalService.sendCommand(this.command);
            this.command = '';
        }
    }

    focus(element: HTMLElement) {
        element.focus();
    }

    onDestroy() {
        if (this.subscription) {
            this.subscription.unsubscribe();
        }
    }
}

@NgModule({
    exports: [Terminal, SharedModule],
    imports: [Terminal, SharedModule]
})
export class TerminalModule {}
