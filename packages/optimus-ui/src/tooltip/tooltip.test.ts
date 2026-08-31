import { ChangeDetectionStrategy, Component, ElementRef, TemplateRef, provideZonelessChangeDetection, viewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { TooltipOptions } from '@openng/optimus-ui/api';
import { Tooltip } from './tooltip';

@Component({
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false,
    template: `
        <input
            #inputElement
            pTooltip="Default tooltip text"
            [tooltipPosition]="tooltipPosition"
            [tooltipEvent]="tooltipEvent"
            [positionStyle]="positionStyle"
            [tooltipStyleClass]="tooltipStyleClass"
            [tooltipZIndex]="tooltipZIndex"
            [escape]="escape"
            [showDelay]="showDelay"
            [hideDelay]="hideDelay"
            [life]="life"
            [positionTop]="positionTop"
            [positionLeft]="positionLeft"
            [autoHide]="autoHide"
            [fitContent]="fitContent"
            [hideOnEscape]="hideOnEscape"
            [tooltipDisabled]="tooltipDisabled"
            [tooltipOptions]="tooltipOptions"
            type="text"
            placeholder="Hover me"
        />
    `
})
class TestBasicTooltipComponent {
    readonly inputElement = viewChild.required('inputElement', { read: ElementRef });

    tooltipPosition: 'right' | 'left' | 'top' | 'bottom' = 'right';
    tooltipEvent: 'hover' | 'focus' | 'both' = 'hover';
    positionStyle: string | undefined;
    tooltipStyleClass: string | undefined;
    tooltipZIndex: string | undefined;
    escape = true;
    showDelay: number | undefined;
    hideDelay: number | undefined;
    life: number | undefined;
    positionTop: number | undefined;
    positionLeft: number | undefined;
    autoHide = true;
    fitContent = true;
    hideOnEscape = true;
    tooltipDisabled = false;
    tooltipOptions: TooltipOptions | undefined;
}

@Component({
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false,
    template: `
        <input #templateElement [pTooltip]="tooltipTemplate" type="text" placeholder="Template tooltip" />
        <ng-template #tooltipTemplate>
            <div class="custom-tooltip">
                <strong>Custom Template</strong>
                <p>This is a custom tooltip template</p>
            </div>
        </ng-template>
    `
})
class TestTemplateTooltipComponent {
    readonly templateElement = viewChild.required('templateElement', { read: ElementRef });
    readonly tooltipTemplate = viewChild.required<TemplateRef<any>>('tooltipTemplate');
}

@Component({
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false,
    template: ` <button #buttonElement pTooltip="Button tooltip" [tooltipOptions]="options" type="button">Click me</button> `
})
class TestTooltipOptionsComponent {
    readonly buttonElement = viewChild.required('buttonElement', { read: ElementRef });

    options: TooltipOptions = {
        tooltipLabel: 'Options tooltip',
        tooltipPosition: 'top',
        tooltipEvent: 'hover',
        showDelay: 100,
        hideDelay: 50,
        life: 2000,
        tooltipStyleClass: 'custom-options-tooltip'
    };
}

describe('Tooltip', () => {
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [Tooltip],
            declarations: [TestBasicTooltipComponent, TestTemplateTooltipComponent, TestTooltipOptionsComponent],
            providers: [provideZonelessChangeDetection()]
        }).compileComponents();
    });

    describe('Directive Initialization', () => {
        let fixture: ComponentFixture<TestBasicTooltipComponent>;
        let component: TestBasicTooltipComponent;
        let tooltipDirective: Tooltip;
        let inputElement: HTMLElement;

        beforeEach(() => {
            fixture = TestBed.createComponent(TestBasicTooltipComponent);
            component = fixture.componentInstance;
            fixture.detectChanges();

            const debugElement = fixture.debugElement.query(By.directive(Tooltip));
            tooltipDirective = debugElement.injector.get(Tooltip);
            inputElement = component.inputElement().nativeElement;
        });

        it('should create the directive', () => {
            expect(tooltipDirective).toBeTruthy();
        });

        it('should have default values', () => {
            expect(tooltipDirective.tooltipPosition).toBe('right');
            expect(tooltipDirective.tooltipEvent).toBe('hover');
            expect(tooltipDirective.escape).toBe(true);
            expect(tooltipDirective.autoHide).toBe(true);
            expect(tooltipDirective.fitContent).toBe(true);
            expect(tooltipDirective.hideOnEscape).toBe(true);
            expect(tooltipDirective.content).toBe('Default tooltip text');
            expect(tooltipDirective.disabled).toBeFalsy();
        });

        it('should accept custom values', async () => {
            component.tooltipPosition = 'top';
            component.tooltipEvent = 'focus';
            component.escape = false;
            component.showDelay = 500;
            component.hideDelay = 300;
            component.life = 2000;
            component.autoHide = false;
            component.tooltipStyleClass = 'custom-tooltip';
            fixture.changeDetectorRef.markForCheck();
            await fixture.whenStable();
            fixture.detectChanges();

            expect(tooltipDirective.tooltipPosition).toBe('top');
            expect(tooltipDirective.tooltipEvent).toBe('focus');
            expect(tooltipDirective.escape).toBe(false);
            expect(tooltipDirective.showDelay).toBe(500);
            expect(tooltipDirective.hideDelay).toBe(300);
            expect(tooltipDirective.life).toBe(2000);
            expect(tooltipDirective.autoHide).toBe(false);
            expect(tooltipDirective.tooltipStyleClass).toBe('custom-tooltip');
        });

        it('should disable tooltip when disabled is true', async () => {
            component.tooltipDisabled = true;
            fixture.changeDetectorRef.markForCheck();
            await fixture.whenStable();
            fixture.detectChanges();

            expect(tooltipDirective.disabled).toBe(true);
        });
    });

    describe('Tooltip Display and Hide Behavior', () => {
        let fixture: ComponentFixture<TestBasicTooltipComponent>;
        let component: TestBasicTooltipComponent;
        let tooltipDirective: Tooltip;

        beforeEach(() => {
            fixture = TestBed.createComponent(TestBasicTooltipComponent);
            component = fixture.componentInstance;
            fixture.detectChanges();

            const debugElement = fixture.debugElement.query(By.directive(Tooltip));
            tooltipDirective = debugElement.injector.get(Tooltip);
        });

        it('should show tooltip on activation', () => {
            vi.spyOn(tooltipDirective, 'show');

            tooltipDirective.activate();

            expect(tooltipDirective.show).toHaveBeenCalled();
            expect(tooltipDirective.active).toBe(true);
        });

        it('should hide tooltip on deactivation', () => {
            vi.spyOn(tooltipDirective, 'hide');

            tooltipDirective.activate();
            tooltipDirective.deactivate();

            expect(tooltipDirective.hide).toHaveBeenCalled();
            expect(tooltipDirective.active).toBe(false);
        });

        it('should not show tooltip when disabled', async () => {
            component.tooltipDisabled = true;
            fixture.changeDetectorRef.markForCheck();
            await fixture.whenStable();
            fixture.detectChanges();

            tooltipDirective.activate();
            await new Promise((resolve) => setTimeout(resolve, 100));
            await fixture.whenStable();

            expect(tooltipDirective.container).toBeFalsy();
        });

        it('should not show tooltip when content is empty', async () => {
            tooltipDirective.setOption({ tooltipLabel: '' });
            fixture.changeDetectorRef.markForCheck();
            await fixture.whenStable();
            fixture.detectChanges();

            tooltipDirective.activate();
            await new Promise((resolve) => setTimeout(resolve, 100));
            await fixture.whenStable();

            expect(tooltipDirective.container).toBeFalsy();
        });
    });

    describe('Event Handling', () => {
        let fixture: ComponentFixture<TestBasicTooltipComponent>;
        let component: TestBasicTooltipComponent;
        let tooltipDirective: Tooltip;
        let inputElement: HTMLElement;

        beforeEach(() => {
            fixture = TestBed.createComponent(TestBasicTooltipComponent);
            component = fixture.componentInstance;
            fixture.detectChanges();

            const debugElement = fixture.debugElement.query(By.directive(Tooltip));
            tooltipDirective = debugElement.injector.get(Tooltip);
            inputElement = component.inputElement().nativeElement;
        });

        it('should activate on mouse enter for hover event', () => {
            vi.spyOn(tooltipDirective, 'activate').mockImplementation(() => {});

            tooltipDirective.onMouseEnter(new MouseEvent('mouseenter'));

            expect(tooltipDirective.activate).toHaveBeenCalled();
        });

        it('should deactivate on mouse leave for hover event', () => {
            vi.spyOn(tooltipDirective, 'deactivate').mockImplementation(() => {});

            tooltipDirective.onMouseLeave(new MouseEvent('mouseleave') as any);

            expect(tooltipDirective.deactivate).toHaveBeenCalled();
        });

        it('should activate on focus for focus event', () => {
            vi.spyOn(tooltipDirective, 'activate').mockImplementation(() => {});

            tooltipDirective.onFocus(new FocusEvent('focus'));

            expect(tooltipDirective.activate).toHaveBeenCalled();
        });

        it('should deactivate on blur for focus event', () => {
            vi.spyOn(tooltipDirective, 'deactivate').mockImplementation(() => {});

            tooltipDirective.onBlur(new FocusEvent('blur'));

            expect(tooltipDirective.deactivate).toHaveBeenCalled();
        });

        it('should deactivate on input click', () => {
            vi.spyOn(tooltipDirective, 'deactivate').mockImplementation(() => {});

            tooltipDirective.onInputClick(new MouseEvent('click'));

            expect(tooltipDirective.deactivate).toHaveBeenCalled();
        });
    });

    describe('Re-entrant Mouse Enter', () => {
        let fixture: ComponentFixture<TestBasicTooltipComponent>;
        let component: TestBasicTooltipComponent;
        let tooltipDirective: Tooltip;
        let inputElement: HTMLElement;

        // Chrome dispatches a fresh mouseenter on the host when the element under the pointer is
        // detached - for instance an overlay rendered inside the host closing on click. The pointer
        // never moved, so no mouseleave precedes it. See issue #950.
        const enter = () => inputElement.dispatchEvent(new MouseEvent('mouseenter'));
        const leave = () => inputElement.dispatchEvent(new MouseEvent('mouseleave'));
        const click = () => inputElement.dispatchEvent(new MouseEvent('click'));

        beforeEach(() => {
            fixture = TestBed.createComponent(TestBasicTooltipComponent);
            component = fixture.componentInstance;
            fixture.detectChanges();

            const debugElement = fixture.debugElement.query(By.directive(Tooltip));
            tooltipDirective = debugElement.injector.get(Tooltip);
            inputElement = component.inputElement().nativeElement;
        });

        afterEach(() => {
            tooltipDirective.deactivate();
        });

        it('should activate on the first mouse enter', () => {
            const activateSpy = vi.spyOn(tooltipDirective, 'activate');

            enter();

            expect(activateSpy).toHaveBeenCalledTimes(1);
            expect(document.querySelector('.p-tooltip')).toBeTruthy();
        });

        it('should ignore a mouse enter that is not preceded by a mouse leave', () => {
            enter();
            tooltipDirective.deactivate();

            const activateSpy = vi.spyOn(tooltipDirective, 'activate');
            enter();

            expect(activateSpy).not.toHaveBeenCalled();
        });

        it('should activate again once the pointer has really left', () => {
            const activateSpy = vi.spyOn(tooltipDirective, 'activate');

            enter();
            leave();
            enter();

            expect(activateSpy).toHaveBeenCalledTimes(2);
        });

        it('should stay hidden when a click is followed by a re-entrant mouse enter', () => {
            enter();
            expect(document.querySelector('.p-tooltip')).toBeTruthy();

            // clicking the host dismisses the tooltip, then the detached-element enter arrives
            click();
            expect(document.querySelector('.p-tooltip')).toBeFalsy();

            enter();

            expect(document.querySelector('.p-tooltip')).toBeFalsy();
        });

        it('should show again after the pointer leaves and returns following a click', () => {
            enter();
            click();
            enter();
            expect(document.querySelector('.p-tooltip')).toBeFalsy();

            leave();
            enter();

            expect(document.querySelector('.p-tooltip')).toBeTruthy();
        });

        it('should reset the pointer state when the events are unbound', () => {
            enter();
            expect(tooltipDirective.pointerInside).toBe(true);

            tooltipDirective.unbindEvents();

            expect(tooltipDirective.pointerInside).toBe(false);
        });
    });

    describe('Positioning', () => {
        let fixture: ComponentFixture<TestBasicTooltipComponent>;
        let component: TestBasicTooltipComponent;
        let tooltipDirective: Tooltip;

        beforeEach(() => {
            fixture = TestBed.createComponent(TestBasicTooltipComponent);
            component = fixture.componentInstance;
            fixture.detectChanges();

            const debugElement = fixture.debugElement.query(By.directive(Tooltip));
            tooltipDirective = debugElement.injector.get(Tooltip);
        });

        it('should get option values correctly', () => {
            tooltipDirective.setOption({ tooltipPosition: 'top' });
            tooltipDirective.setOption({ showDelay: 500 });

            expect(tooltipDirective.getOption('tooltipPosition')).toBe('top');
            expect(tooltipDirective.getOption('showDelay')).toBe(500);
        });

        it('should handle position changes', async () => {
            component.tooltipPosition = 'left';
            fixture.changeDetectorRef.markForCheck();
            await fixture.whenStable();
            fixture.detectChanges();

            expect(tooltipDirective.tooltipPosition).toBe('left');
        });

        it('should handle out of bounds check', () => {
            // Create a mock container for bounds testing
            const mockContainer = document.createElement('div');
            mockContainer.getBoundingClientRect = () =>
                ({
                    top: -100,
                    left: -100,
                    width: 200,
                    height: 50,
                    right: 100,
                    bottom: -50
                }) as any;

            tooltipDirective.container = mockContainer;

            expect(tooltipDirective.isOutOfBounds()).toBe(true);
        });
    });

    describe('Delay and Life Timeout', () => {
        let fixture: ComponentFixture<TestBasicTooltipComponent>;
        let component: TestBasicTooltipComponent;
        let tooltipDirective: Tooltip;

        beforeEach(() => {
            fixture = TestBed.createComponent(TestBasicTooltipComponent);
            component = fixture.componentInstance;
            fixture.detectChanges();

            const debugElement = fixture.debugElement.query(By.directive(Tooltip));
            tooltipDirective = debugElement.injector.get(Tooltip);
        });

        it('should show tooltip after show delay', async () => {
            tooltipDirective.setOption({ showDelay: 500 });
            fixture.changeDetectorRef.markForCheck();
            await fixture.whenStable();
            fixture.detectChanges();

            vi.spyOn(tooltipDirective, 'show').mockImplementation(() => {});

            tooltipDirective.activate();
            await new Promise((resolve) => setTimeout(resolve, 300));
            await fixture.whenStable();
            expect(tooltipDirective.show).not.toHaveBeenCalled();

            await new Promise((resolve) => setTimeout(resolve, 200));
            await fixture.whenStable();
            expect(tooltipDirective.show).toHaveBeenCalled();
        });

        it('should hide tooltip after hide delay', async () => {
            tooltipDirective.setOption({ hideDelay: 300 });
            fixture.changeDetectorRef.markForCheck();
            await fixture.whenStable();
            fixture.detectChanges();

            tooltipDirective.activate();

            vi.spyOn(tooltipDirective, 'hide').mockImplementation(() => {});
            tooltipDirective.deactivate();

            await new Promise((resolve) => setTimeout(resolve, 200));
            await fixture.whenStable();
            expect(tooltipDirective.hide).not.toHaveBeenCalled();

            await new Promise((resolve) => setTimeout(resolve, 100));
            await fixture.whenStable();
            expect(tooltipDirective.hide).toHaveBeenCalled();
        });

        it('should clear timeouts correctly', () => {
            tooltipDirective.showTimeout = setTimeout(() => {}, 1000);
            tooltipDirective.hideTimeout = setTimeout(() => {}, 1000);

            tooltipDirective.clearTimeouts();

            expect(tooltipDirective.showTimeout).toBeNull();
            expect(tooltipDirective.hideTimeout).toBeNull();
        });
    });

    describe('Accessibility and Keyboard Navigation', () => {
        let fixture: ComponentFixture<TestBasicTooltipComponent>;
        let component: TestBasicTooltipComponent;
        let tooltipDirective: Tooltip;

        beforeEach(() => {
            fixture = TestBed.createComponent(TestBasicTooltipComponent);
            component = fixture.componentInstance;
            fixture.detectChanges();

            const debugElement = fixture.debugElement.query(By.directive(Tooltip));
            tooltipDirective = debugElement.injector.get(Tooltip);
        });

        it('should handle escape key when hideOnEscape is true', async () => {
            vi.spyOn(tooltipDirective, 'deactivate').mockImplementation(() => {});
            tooltipDirective.setOption({ hideOnEscape: true });
            fixture.changeDetectorRef.markForCheck();
            await fixture.whenStable();
            fixture.detectChanges();

            // Simulate document escape listener setup
            tooltipDirective.activate();

            expect(tooltipDirective.deactivate).not.toHaveBeenCalled();
        });

        it('should find correct target element', () => {
            const mockElement = document.createElement('div');
            mockElement.classList.add('p-inputwrapper');
            const input = document.createElement('input');
            mockElement.appendChild(input);

            const target = tooltipDirective.getTarget(mockElement);
            expect(target!.tagName.toLowerCase()).toBe('input');
        });

        it('should return element itself if not p-inputwrapper', () => {
            const mockElement = document.createElement('button');

            const target = tooltipDirective.getTarget(mockElement);
            expect(target).toBe(mockElement);
        });
    });

    describe('Styling and Custom Options', () => {
        let fixture: ComponentFixture<TestBasicTooltipComponent>;
        let component: TestBasicTooltipComponent;
        let tooltipDirective: Tooltip;

        beforeEach(() => {
            fixture = TestBed.createComponent(TestBasicTooltipComponent);
            component = fixture.componentInstance;
            fixture.detectChanges();

            const debugElement = fixture.debugElement.query(By.directive(Tooltip));
            tooltipDirective = debugElement.injector.get(Tooltip);
        });

        it('should handle autoHide option correctly', async () => {
            tooltipDirective.setOption({ autoHide: false });
            fixture.changeDetectorRef.markForCheck();
            await fixture.whenStable();
            fixture.detectChanges();
            expect(tooltipDirective.isAutoHide()).toBe(false);

            tooltipDirective.setOption({ autoHide: true });
            fixture.changeDetectorRef.markForCheck();
            await fixture.whenStable();
            fixture.detectChanges();
            expect(tooltipDirective.isAutoHide()).toBe(true);
        });

        it('should update text content correctly', async () => {
            tooltipDirective.tooltipText = document.createElement('div');
            tooltipDirective.setOption({ escape: true });
            fixture.changeDetectorRef.markForCheck();
            await fixture.whenStable();
            fixture.detectChanges();

            vi.spyOn(document, 'createTextNode');

            tooltipDirective.setOption({ tooltipLabel: 'Test content' });
            fixture.changeDetectorRef.markForCheck();
            await fixture.whenStable();
            fixture.detectChanges();

            tooltipDirective.updateText();

            expect(document.createTextNode).toHaveBeenCalledWith('Test content');
        });

        it('should reset previous content without assigning innerHTML when escape is true', async () => {
            const tooltipText = document.createElement('div');
            tooltipText.appendChild(document.createTextNode('Previous content'));
            Object.defineProperty(tooltipText, 'innerHTML', {
                configurable: true,
                get: () => '',
                set: () => {
                    // Mimics a Trusted Types enabled document rejecting plain string assignments
                    throw new TypeError("Failed to set the 'innerHTML' property on 'Element': This document requires 'TrustedHTML' assignment.");
                }
            });

            tooltipDirective.tooltipText = tooltipText;
            tooltipDirective.setOption({ escape: true });
            tooltipDirective.setOption({ tooltipLabel: 'New content' });
            fixture.changeDetectorRef.markForCheck();
            await fixture.whenStable();
            fixture.detectChanges();

            expect(() => tooltipDirective.updateText()).not.toThrow();
            expect(tooltipText.childNodes.length).toBe(1);
            expect(tooltipText.textContent).toBe('New content');
        });

        it('should handle HTML content when escape is false', async () => {
            tooltipDirective.tooltipText = document.createElement('div');
            tooltipDirective.setOption({ escape: false });
            tooltipDirective.setOption({ tooltipLabel: '<strong>Bold</strong>' });
            fixture.changeDetectorRef.markForCheck();
            await fixture.whenStable();
            fixture.detectChanges();

            tooltipDirective.updateText();

            expect(tooltipDirective.tooltipText.innerHTML).toBe('<strong>Bold</strong>');
        });
    });

    describe('Template Content', () => {
        let fixture: ComponentFixture<TestTemplateTooltipComponent>;
        let component: TestTemplateTooltipComponent;
        let tooltipDirective: Tooltip;

        beforeEach(() => {
            fixture = TestBed.createComponent(TestTemplateTooltipComponent);
            component = fixture.componentInstance;
            fixture.detectChanges();

            const debugElement = fixture.debugElement.query(By.directive(Tooltip));
            tooltipDirective = debugElement.injector.get(Tooltip);
        });

        it('should handle template content', () => {
            expect(tooltipDirective.content).toEqual(component.tooltipTemplate());
        });
    });

    describe('Tooltip Options', () => {
        let fixture: ComponentFixture<TestTooltipOptionsComponent>;
        let component: TestTooltipOptionsComponent;
        let tooltipDirective: Tooltip;

        beforeEach(() => {
            fixture = TestBed.createComponent(TestTooltipOptionsComponent);
            component = fixture.componentInstance;
            fixture.detectChanges();

            const debugElement = fixture.debugElement.query(By.directive(Tooltip));
            tooltipDirective = debugElement.injector.get(Tooltip);
        });

        it('should apply tooltip options configuration', () => {
            expect(tooltipDirective.getOption('tooltipLabel')).toBe('Options tooltip');
            expect(tooltipDirective.getOption('tooltipPosition')).toBe('top');
            expect(tooltipDirective.getOption('showDelay')).toBe(100);
            expect(tooltipDirective.getOption('hideDelay')).toBe(50);
            expect(tooltipDirective.getOption('life')).toBe(2000);
            expect(tooltipDirective.getOption('tooltipStyleClass')).toBe('custom-options-tooltip');
        });

        it('should update options when tooltipOptions changes', async () => {
            component.options = {
                ...component.options,
                tooltipLabel: 'Updated tooltip',
                tooltipPosition: 'bottom'
            };
            fixture.changeDetectorRef.markForCheck();
            await fixture.whenStable();
            fixture.detectChanges();

            expect(tooltipDirective.getOption('tooltipLabel')).toBe('Updated tooltip');
            expect(tooltipDirective.getOption('tooltipPosition')).toBe('bottom');
        });
    });

    describe('Edge Cases and Cleanup', () => {
        let fixture: ComponentFixture<TestBasicTooltipComponent>;
        let component: TestBasicTooltipComponent;
        let tooltipDirective: Tooltip;

        beforeEach(() => {
            fixture = TestBed.createComponent(TestBasicTooltipComponent);
            component = fixture.componentInstance;
            fixture.detectChanges();

            const debugElement = fixture.debugElement.query(By.directive(Tooltip));
            tooltipDirective = debugElement.injector.get(Tooltip);
        });

        it('should prevent multiple activations during interaction', () => {
            vi.spyOn(tooltipDirective, 'show').mockImplementation(() => {});

            tooltipDirective.activate();
            tooltipDirective.activate(); // Second activation should be ignored

            expect(tooltipDirective.show).toHaveBeenCalledTimes(1);
        });

        it('should handle container removal safely', () => {
            expect(() => {
                tooltipDirective.remove();
            }).not.toThrow();
        });

        it('should handle window resize events', () => {
            vi.spyOn(tooltipDirective, 'hide').mockImplementation(() => {});

            tooltipDirective.onWindowResize(new Event('resize'));

            expect(tooltipDirective.hide).toHaveBeenCalled();
        });

        it('should unbind all event listeners on destroy', () => {
            vi.spyOn(tooltipDirective, 'unbindEvents').mockImplementation(() => {});

            tooltipDirective.ngOnDestroy();

            expect(tooltipDirective.unbindEvents).toHaveBeenCalled();
        });

        it('should clear all timeouts on destroy', () => {
            tooltipDirective.showTimeout = setTimeout(() => {}, 500);

            vi.spyOn(tooltipDirective, 'clearTimeouts');
            tooltipDirective.ngOnDestroy();

            expect(tooltipDirective.clearTimeouts).toHaveBeenCalled();
        });

        it('should handle mouseenter without existing container', () => {
            vi.spyOn(tooltipDirective, 'activate').mockImplementation(() => {});

            tooltipDirective.container = null as any;
            tooltipDirective.showTimeout = null as any;

            tooltipDirective.onMouseEnter(new MouseEvent('mouseenter'));

            expect(tooltipDirective.activate).toHaveBeenCalled();
        });

        it('should handle mouseleave with non-autoHide tooltip', () => {
            vi.spyOn(tooltipDirective, 'deactivate').mockImplementation(() => {});

            const mouseLeaveEvent = new MouseEvent('mouseleave', {
                relatedTarget: document.createElement('div')
            });

            tooltipDirective.onMouseLeave(mouseLeaveEvent as any);

            expect(tooltipDirective.deactivate).toHaveBeenCalled();
        });

        it('should handle options updates correctly', async () => {
            const initialOptions = { ...tooltipDirective._tooltipOptions };

            tooltipDirective.setOption({ tooltipLabel: 'New label' });
            fixture.changeDetectorRef.markForCheck();
            await fixture.whenStable();
            fixture.detectChanges();

            expect(tooltipDirective.getOption('tooltipLabel')).toBe('New label');
            expect(tooltipDirective._tooltipOptions).not.toEqual(initialOptions);
        });
    });

    describe('PassThrough', () => {
        @Component({
            changeDetection: ChangeDetectionStrategy.Eager,
            standalone: false,
            template: ` <input #inputElement pTooltip="PT Test Tooltip" [pt]="pt" type="text" /> `
        })
        class TestPTTooltipComponent {
            readonly inputElement = viewChild.required('inputElement', { read: ElementRef });
            testValue = false;
            pt: any = {};
        }

        let fixture: ComponentFixture<TestPTTooltipComponent>;
        let component: TestPTTooltipComponent;
        let tooltipDirective: Tooltip;
        let inputEl: HTMLElement;

        beforeEach(async () => {
            await TestBed.configureTestingModule({
                imports: [Tooltip],
                declarations: [TestPTTooltipComponent],
                providers: [provideZonelessChangeDetection()]
            }).compileComponents();

            fixture = TestBed.createComponent(TestPTTooltipComponent);
            component = fixture.componentInstance;
            fixture.detectChanges();

            const debugElement = fixture.debugElement.query(By.directive(Tooltip));
            tooltipDirective = debugElement.injector.get(Tooltip);
            inputEl = component.inputElement().nativeElement;
        });

        // Case 1: Simple string classes
        it('should apply simple string classes via PT', async () => {
            component.pt = {
                root: 'ROOT_CLASS'
            };
            fixture.changeDetectorRef.markForCheck();
            await fixture.whenStable();
            fixture.detectChanges();

            tooltipDirective.activate();
            await new Promise((resolve) => setTimeout(resolve, 100));
            await fixture.whenStable();

            const tooltipContainer = document.querySelector('.p-tooltip');
            expect(tooltipContainer?.classList.contains('ROOT_CLASS')).toBeTruthy();

            tooltipDirective.deactivate();
        });

        it('should apply PT classes to dynamically created elements', async () => {
            component.pt = {
                root: 'ROOT_CLASS',
                arrow: 'ARROW_CLASS',
                text: 'TEXT_CLASS'
            };
            fixture.changeDetectorRef.markForCheck();
            await fixture.whenStable();
            fixture.detectChanges();

            tooltipDirective.activate();
            await new Promise((resolve) => setTimeout(resolve, 100));
            await fixture.whenStable();

            const tooltipContainer = document.querySelector('.p-tooltip');
            const tooltipArrow = document.querySelector('.p-tooltip-arrow');
            const tooltipText = document.querySelector('.p-tooltip-text');

            expect(tooltipContainer?.classList.contains('ROOT_CLASS')).toBeTruthy();
            expect(tooltipArrow?.classList.contains('ARROW_CLASS')).toBeTruthy();
            expect(tooltipText?.classList.contains('TEXT_CLASS')).toBeTruthy();

            tooltipDirective.deactivate();
        });

        // Case 2: Objects with class, style, data attributes
        it('should apply PT object attributes', async () => {
            component.pt = {
                root: {
                    class: 'PT_ROOT_CLASS',
                    style: { 'background-color': 'yellow' },
                    'data-test-id': 'host-test',
                    'aria-label': 'Host Aria Label'
                }
            };
            fixture.changeDetectorRef.markForCheck();
            await fixture.whenStable();
            fixture.detectChanges();

            tooltipDirective.activate();
            await new Promise((resolve) => setTimeout(resolve, 100));
            await fixture.whenStable();

            const tooltipContainer = document.querySelector('.p-tooltip') as HTMLElement;

            expect(tooltipContainer?.classList.contains('PT_ROOT_CLASS')).toBeTruthy();
            expect(tooltipContainer?.style.backgroundColor).toBe('yellow');
            expect(tooltipContainer?.getAttribute('data-test-id')).toBe('host-test');
            expect(tooltipContainer?.getAttribute('aria-label')).toBe('Host Aria Label');

            tooltipDirective.deactivate();
        });

        it('should apply PT object to dynamic elements', async () => {
            component.pt = {
                root: {
                    class: 'ROOT_PT_CLASS',
                    style: { border: '2px solid blue' },
                    'data-root-id': 'root-test'
                },
                text: {
                    class: 'TEXT_PT_CLASS',
                    'aria-label': 'Tooltip Text'
                }
            };
            fixture.changeDetectorRef.markForCheck();
            await fixture.whenStable();
            fixture.detectChanges();

            tooltipDirective.activate();
            await new Promise((resolve) => setTimeout(resolve, 100));
            await fixture.whenStable();

            const tooltipContainer = document.querySelector('.p-tooltip') as HTMLElement;
            const tooltipText = document.querySelector('.p-tooltip-text') as HTMLElement;

            expect(tooltipContainer?.classList.contains('ROOT_PT_CLASS')).toBeTruthy();
            expect(tooltipContainer?.style.border).toBe('2px solid blue');
            expect(tooltipContainer?.getAttribute('data-root-id')).toBe('root-test');
            expect(tooltipText?.classList.contains('TEXT_PT_CLASS')).toBeTruthy();
            expect(tooltipText?.getAttribute('aria-label')).toBe('Tooltip Text');

            tooltipDirective.deactivate();
        });

        // Case 3: Mixed object and string values
        it('should handle mixed PT values', async () => {
            component.pt = {
                root: 'SIMPLE_ROOT_CLASS',
                arrow: {
                    class: 'OBJECT_ARROW_CLASS'
                }
            };
            fixture.changeDetectorRef.markForCheck();
            await fixture.whenStable();
            fixture.detectChanges();

            tooltipDirective.activate();
            await new Promise((resolve) => setTimeout(resolve, 100));
            await fixture.whenStable();

            const tooltipContainer = document.querySelector('.p-tooltip');
            const tooltipArrow = document.querySelector('.p-tooltip-arrow');

            expect(tooltipContainer?.classList.contains('SIMPLE_ROOT_CLASS')).toBeTruthy();
            expect(tooltipArrow?.classList.contains('OBJECT_ARROW_CLASS')).toBeTruthy();

            tooltipDirective.deactivate();
        });

        // Case 5: Event binding
        it('should handle PT event bindings', async () => {
            let clicked = false;
            component.pt = {
                root: {
                    onclick: () => {
                        clicked = true;
                    }
                }
            };
            fixture.changeDetectorRef.markForCheck();
            await fixture.whenStable();
            fixture.detectChanges();

            tooltipDirective.activate();
            await new Promise((resolve) => setTimeout(resolve, 100));
            await fixture.whenStable();

            const tooltipContainer = document.querySelector('.p-tooltip') as HTMLElement;
            tooltipContainer.click();
            expect(clicked).toBeTruthy();

            tooltipDirective.deactivate();
        });

        // Additional test: PT on all tooltip sections
        it('should apply PT to all tooltip sections', async () => {
            component.pt = {
                root: 'ROOT_PT',
                arrow: 'ARROW_PT',
                text: 'TEXT_PT'
            };
            fixture.changeDetectorRef.markForCheck();
            await fixture.whenStable();
            fixture.detectChanges();
            await new Promise((resolve) => setTimeout(resolve, 100));
            await fixture.whenStable();

            tooltipDirective.activate();
            await new Promise((resolve) => setTimeout(resolve, 100));
            await fixture.whenStable();

            const container = document.querySelector('.p-tooltip');
            const arrow = document.querySelector('.p-tooltip-arrow');
            const text = document.querySelector('.p-tooltip-text');

            expect(container?.classList.contains('ROOT_PT')).toBeTruthy();
            expect(arrow?.classList.contains('ARROW_PT')).toBeTruthy();
            expect(text?.classList.contains('TEXT_PT')).toBeTruthy();

            tooltipDirective.deactivate();
        });

        // Test PT attribute removal
        it('should remove attributes when PT value is null', async () => {
            const container = document.querySelector('.p-tooltip');
            component.pt = {
                root: {
                    'data-test': null
                }
            };
            fixture.changeDetectorRef.markForCheck();
            await fixture.whenStable();
            fixture.detectChanges();
            await new Promise((resolve) => setTimeout(resolve, 100));
            await fixture.whenStable();

            expect(container?.hasAttribute('data-test')).toBeFalsy();
        });
    });
});
