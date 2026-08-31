import { ChangeDetectionStrategy, Component, provideZonelessChangeDetection, inject } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DomHandler } from '@openng/optimus-ui/dom';
import { ZIndexUtils } from '@openng/optimus-ui/utils';
import { Subject } from 'rxjs';
import { DynamicDialog } from './dynamicdialog';
import { DynamicDialogConfig } from './dynamicdialog-config';
import { DynamicDialogRef } from './dynamicdialog-ref';

// Test components to be used in dynamic dialogs
@Component({
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false,
    template: `
        <div class="test-component">
            <h3>Test Component Content</h3>
            <p>Data: {{ data }}</p>
            <button class="test-button" (click)="closeDialog()">Close</button>
        </div>
    `
})
class TestDialogContentComponent {
    private dialogRef = inject(DynamicDialogRef);
    private config = inject(DynamicDialogConfig);

    data: any;

    constructor() {
        this.data = this.config.data;
    }

    closeDialog() {
        this.dialogRef.close('closed from component');
    }
}

@Component({
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false,
    template: `
        <div class="nested-dialog-content">
            <h3>Nested Dialog</h3>
            <p>Level: {{ level }}</p>
            <button class="close-nested" (click)="closeDialog()">Close</button>
        </div>
    `
})
class NestedDialogContentComponent {
    private dialogRef = inject(DynamicDialogRef);
    private config = inject(DynamicDialogConfig);

    level: number;

    constructor() {
        this.level = this.config.data?.level || 1;
    }

    closeDialog() {
        this.dialogRef.close(`closed from level ${this.level}`);
    }
}

@Component({
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false,
    template: `
        <div class="dialog-within-dialog-content">
            <h3>Dialog Within Dialog</h3>
            <button class="inner-dialog-trigger" (click)="closeDialog()">Close</button>
        </div>
    `
})
class DialogWithinDialogComponent {
    private dialogRef = inject(DynamicDialogRef);

    closeDialog() {
        this.dialogRef.close('inner dialog closed');
    }
}

@Component({
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false,
    template: `
        <div class="maximizable-content">
            <h3>Maximizable Dialog</h3>
            <p>This dialog can be maximized</p>
            <div style="height: 200px; overflow-y: auto;">
                @for (item of items; track item) {
                    <p>{{ item }}</p>
                }
            </div>
        </div>
    `
})
class MaximizableDialogComponent {
    items = Array.from({ length: 50 }, (_, i) => `Item ${i + 1}`);
}

@Component({
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false,
    template: `
        <div class="resizable-content">
            <h3>Resizable Dialog</h3>
            <p>This dialog can be resized</p>
            <textarea style="width: 100%; height: 150px;" placeholder="Resize me"></textarea>
        </div>
    `
})
class ResizableDialogComponent {}

@Component({
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false,
    template: `
        <div class="draggable-content">
            <h3>Draggable Dialog</h3>
            <p>Drag me around using the header</p>
        </div>
    `
})
class DraggableDialogComponent {}

describe('DynamicDialog', () => {
    let mockDialogRef: Record<string, any>;
    let mockConfig: DynamicDialogConfig;

    beforeEach(async () => {
        // Create spy objects
        mockDialogRef = {
            close: vi.fn(),
            destroy: vi.fn(),
            dragStart: vi.fn(),
            dragEnd: vi.fn(),
            resizeInit: vi.fn(),
            resizeEnd: vi.fn(),
            maximize: vi.fn(),
            onClose: new Subject(),
            onDestroy: new Subject(),
            onDragStart: new Subject(),
            onDragEnd: new Subject(),
            onResizeInit: new Subject(),
            onResizeEnd: new Subject(),
            onMaximize: new Subject(),
            onChildComponentLoaded: new Subject()
        };

        mockConfig = new DynamicDialogConfig();

        await TestBed.configureTestingModule({
            imports: [DynamicDialog],
            declarations: [TestDialogContentComponent, NestedDialogContentComponent, DialogWithinDialogComponent, MaximizableDialogComponent, ResizableDialogComponent, DraggableDialogComponent],
            providers: [{ provide: DynamicDialogRef, useValue: mockDialogRef }, { provide: DynamicDialogConfig, useValue: mockConfig }, provideZonelessChangeDetection()]
        }).compileComponents();
    });

    afterEach(async () => {
        // Clean up any pending animations/timers
        await new Promise((resolve) => setTimeout(resolve, 0));
    });

    describe('Component Initialization', () => {
        let fixture: ComponentFixture<DynamicDialog>;
        let component: DynamicDialog;

        beforeEach(async () => {
            mockConfig.header = 'Test Dialog';
            mockConfig.width = '500px';
            mockConfig.height = '400px';

            fixture = TestBed.createComponent(DynamicDialog);
            component = fixture.componentInstance;
            component.childComponentType = TestDialogContentComponent;
            fixture.changeDetectorRef.markForCheck();
            await fixture.whenStable();
        });

        it('should create the component', () => {
            expect(component).toBeTruthy();
        });

        it('should have default values', () => {
            expect(component.visible).toBe(true);
            expect(component.maximized).toBeUndefined();
            expect(component.dragging).toBeUndefined();
            expect(component.resizing).toBeUndefined();
        });

        it('should initialize with config values', () => {
            expect(component.header).toBe('Test Dialog');
            expect(component.ddconfig.width).toBe('500px');
            expect(component.ddconfig.height).toBe('400px');
        });

        it('should generate unique dialog ID', () => {
            expect(component.dialogId).toBeTruthy();
            expect(component.id).toBeTruthy();
        });

        it('should create aria-labelledby when header is present', async () => {
            mockConfig.showHeader = true;
            component.visible = true;
            fixture.changeDetectorRef.markForCheck();
            await fixture.whenStable();
            component.ngAfterViewInit();

            expect(component.ariaLabelledBy).toBeTruthy();
            expect(component.ariaLabelledBy).toContain('_header');
        });

        it('should not create aria-labelledby when header is null', async () => {
            mockConfig.header = null as any;
            mockConfig.showHeader = false;
            component.visible = true;
            fixture.changeDetectorRef.markForCheck();
            await fixture.whenStable();
            component.ngAfterViewInit();
            expect(component.ariaLabelledBy).toBeNull();
        });

        it('should not create aria-labelledby when showHeader is false', async () => {
            mockConfig.showHeader = false;
            component.visible = true;
            fixture.changeDetectorRef.markForCheck();
            await fixture.whenStable();
            component.ngAfterViewInit();
            expect(component.ariaLabelledBy).toBeNull();
        });

        it('should use ariaLabelledBy from config when provided', async () => {
            mockConfig.showHeader = true;
            mockConfig.ariaLabelledBy = 'custom-label-id';
            component.visible = true;
            fixture.changeDetectorRef.markForCheck();
            await fixture.whenStable();
            component.ngAfterViewInit();

            expect(component.ariaLabelledBy).toBe('custom-label-id');
        });

        it('should prioritize ariaLabelledBy from config over header when showHeader is false', async () => {
            mockConfig.header = null as any;
            mockConfig.showHeader = false;
            mockConfig.ariaLabelledBy = 'custom-label-id';
            component.visible = true;
            fixture.changeDetectorRef.markForCheck();
            await fixture.whenStable();
            component.ngAfterViewInit();

            expect(component.ariaLabelledBy).toBe('custom-label-id');
        });
    });

    describe('Dialog Display and Hide Behavior', () => {
        let fixture: ComponentFixture<DynamicDialog>;
        let component: DynamicDialog;

        beforeEach(async () => {
            mockConfig.header = 'Test Dialog';
            mockConfig.closable = true;
            mockConfig.showHeader = true;

            fixture = TestBed.createComponent(DynamicDialog);
            component = fixture.componentInstance;
            component.childComponentType = TestDialogContentComponent;
            component.visible = true; // Make dialog visible so template renders
            fixture.changeDetectorRef.markForCheck();
            await fixture.whenStable();
        });

        it('should be visible by default', () => {
            expect(component.visible).toBe(true);
        });

        it('should hide dialog when close is called', () => {
            component.hide();
            expect(mockDialogRef.close).toHaveBeenCalled();
        });

        it('should close dialog when close method is called', () => {
            component.close();
            expect(component.visible).toBe(false);
        });

        it('should handle close button click', async () => {
            // Close button is now handled by Dialog component
            // Test onDialogHide which gets called when dialog closes

            // Simulate the onHide event from Dialog
            component.onDialogHide({});
            await new Promise((resolve) => setTimeout(resolve, 100));

            expect(mockDialogRef.destroy).toHaveBeenCalled();
        });

        it('should call close on dialogRef on close icon click', async () => {
            component.visible = true;
            const closeButton = fixture.debugElement.query(By.css('.p-dialog-close-button'));
            closeButton.nativeElement.click();
            expect(mockDialogRef.close).toHaveBeenCalled();
            expect(component.visible).toBe(false);
        });

        it('should call close on dialogRef on Escape key press', async () => {
            mockConfig.closeOnEscape = true;
            component.container = document.createElement('div');
            component.visible = true;

            const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', keyCode: 27 });
            component.bindDocumentEscapeListener();

            // Simulate escape key press on document
            document.dispatchEvent(escapeEvent);
            expect(mockDialogRef.close).toHaveBeenCalled();
        });
    });

    describe('Drag and Drop Functionality', () => {
        let fixture: ComponentFixture<DynamicDialog>;
        let component: DynamicDialog;

        beforeEach(async () => {
            mockConfig.draggable = true;
            mockConfig.header = 'Draggable Dialog';
            mockConfig.showHeader = true;

            fixture = TestBed.createComponent(DynamicDialog);
            component = fixture.componentInstance;
            component.childComponentType = DraggableDialogComponent;

            // Setup container with parent element for drag functionality
            const parentElement = document.createElement('div');
            const containerElement = document.createElement('div');
            parentElement.appendChild(containerElement);
            document.body.appendChild(parentElement); // Add to DOM so parentElement is accessible
            component.container = containerElement;
            component.visible = true;

            fixture.changeDetectorRef.markForCheck();
            await fixture.whenStable();
        });

        it('should initialize drag on header mousedown', () => {
            const targetElement = document.createElement('div');
            const parentElement = document.createElement('div');
            parentElement.appendChild(targetElement);

            const mouseEvent = new MouseEvent('mousedown');
            Object.defineProperty(mouseEvent, 'target', { value: targetElement });
            Object.defineProperty(mouseEvent, 'pageX', { value: 100 });
            Object.defineProperty(mouseEvent, 'pageY', { value: 100 });

            // Mock DomHandler.getOffset to avoid parentElement issues
            vi.spyOn(DomHandler, 'getOffset').mockReturnValue({ left: 50, top: 50 });
            vi.spyOn(component, 'bindDocumentDragListener').mockImplementation(() => {});
            vi.spyOn(component, 'bindDocumentDragEndListener').mockImplementation(() => {});

            component.initDrag(mouseEvent);

            expect(component.dragging).toBe(true);
            expect(component.lastPageX).toBe(100);
            expect(component.lastPageY).toBe(100);
            expect(mockDialogRef.dragStart).toHaveBeenCalledWith(mouseEvent);
        });

        it('should not initialize drag when clicking on header icons', () => {
            const iconElement = document.createElement('i');
            iconElement.className = 'p-dialog-header-icon';
            const mouseEvent = new MouseEvent('mousedown');
            Object.defineProperty(mouseEvent, 'pageX', { value: 100 });
            Object.defineProperty(mouseEvent, 'pageY', { value: 100 });
            Object.defineProperty(mouseEvent, 'target', { value: iconElement });

            component.initDrag(mouseEvent);

            expect(component.dragging).toBeUndefined();
        });

        it('should handle drag movement', () => {
            component.dragging = true;
            component.lastPageX = 100;
            component.lastPageY = 100;
            component.container = document.createElement('div');
            component.container.style.position = 'absolute';

            // Mock getBoundingClientRect
            vi.spyOn(component.container, 'getBoundingClientRect').mockReturnValue({
                left: 50,
                top: 50,
                width: 200,
                height: 150,
                right: 250,
                bottom: 200
            } as any);

            const mouseEvent = new MouseEvent('mousemove');
            Object.defineProperty(mouseEvent, 'pageX', { value: 150 });
            Object.defineProperty(mouseEvent, 'pageY', { value: 120 });
            component.onDrag(mouseEvent);

            expect(component.lastPageX).toBe(150);
            expect(component.lastPageY).toBe(120);
        });

        it('should handle drag with keepInViewport constraint', () => {
            mockConfig.keepInViewport = true;
            component.dragging = true;
            component.lastPageX = 100;
            component.lastPageY = 100;
            component.container = document.createElement('div');

            vi.spyOn(component.container, 'getBoundingClientRect').mockReturnValue({
                left: 50,
                top: 50,
                width: 200,
                height: 150,
                right: 250,
                bottom: 200
            } as any);

            const mouseEvent = new MouseEvent('mousemove');
            Object.defineProperty(mouseEvent, 'pageX', { value: 150 });
            Object.defineProperty(mouseEvent, 'pageY', { value: 120 });
            component.onDrag(mouseEvent);

            expect(component.container.style.position).toBe('fixed');
        });

        it('should end drag properly', () => {
            component.dragging = true;
            const mouseEvent = new MouseEvent('mouseup');

            vi.spyOn(component.cd, 'detectChanges').mockImplementation(() => {});

            component.endDrag(mouseEvent);

            expect(component.dragging).toBe(false);
            expect(mockDialogRef.dragEnd).toHaveBeenCalledWith(mouseEvent);
            expect(component.cd.detectChanges).toHaveBeenCalled();
        });

        it('should reset position correctly', () => {
            component.container = document.createElement('div');
            component.container.style.position = 'absolute';
            component.container.style.left = '100px';
            component.container.style.top = '50px';
            component.container.style.margin = '10px';

            component.resetPosition();

            expect(component.container.style.position).toBe('' as any);
            expect(component.container.style.left).toBe('' as any);
            expect(component.container.style.top).toBe('' as any);
            expect(component.container.style.margin).toBe('' as any);
        });

        afterEach(() => {
            // Cleanup DOM elements
            const containers = document.body.querySelectorAll('div:not(.jasmine-results):not(#jasmine-content)');
            containers.forEach((container) => {
                if (container.parentElement === document.body && !container.classList.contains('jasmine-results')) {
                    document.body.removeChild(container);
                }
            });
        });
    });

    describe('Resize Functionality', () => {
        let fixture: ComponentFixture<DynamicDialog>;
        let component: DynamicDialog;

        beforeEach(async () => {
            mockConfig.resizable = true;
            mockConfig.header = 'Resizable Dialog';

            fixture = TestBed.createComponent(DynamicDialog);
            component = fixture.componentInstance;
            component.childComponentType = ResizableDialogComponent;
            fixture.changeDetectorRef.markForCheck();
            await fixture.whenStable();
        });

        it('should initialize resize on handle mousedown', () => {
            const mouseEvent = new MouseEvent('mousedown');
            Object.defineProperty(mouseEvent, 'pageX', { value: 100 });
            Object.defineProperty(mouseEvent, 'pageY', { value: 100 });

            vi.spyOn(component, 'bindDocumentResizeListeners').mockImplementation(() => {});

            component.initResize(mouseEvent);

            expect(component.resizing).toBe(true);
            expect(component.lastPageX).toBe(100);
            expect(component.lastPageY).toBe(100);
            expect(mockDialogRef.resizeInit).toHaveBeenCalledWith(mouseEvent);
        });

        it('should handle resize movement', () => {
            component.resizing = true;
            component.lastPageX = 100;
            component.lastPageY = 100;
            component.container = document.createElement('div');
            component.contentViewChild = { nativeElement: document.createElement('div') } as any;

            // Mock element dimensions
            vi.spyOn(component.container, 'getBoundingClientRect').mockReturnValue({
                left: 50,
                top: 50,
                width: 200,
                height: 150,
                right: 250,
                bottom: 200
            } as any);

            const mouseEvent = new MouseEvent('mousemove');
            Object.defineProperty(mouseEvent, 'pageX', { value: 150 });
            Object.defineProperty(mouseEvent, 'pageY', { value: 130 });
            component.onResize(mouseEvent);

            expect(component.lastPageX).toBe(150);
            expect(component.lastPageY).toBe(130);
        });

        it('should respect minimum dimensions during resize', () => {
            component.resizing = true;
            component.lastPageX = 100;
            component.lastPageY = 100;
            component.container = document.createElement('div');
            component.container.style.minWidth = '300px';
            component.container.style.minHeight = '200px';
            component.contentViewChild = { nativeElement: document.createElement('div') } as any;

            vi.spyOn(component.container, 'getBoundingClientRect').mockReturnValue({
                left: 50,
                top: 50,
                width: 280,
                height: 180,
                right: 330,
                bottom: 230
            } as any);

            const mouseEvent = new MouseEvent('mousemove');
            Object.defineProperty(mouseEvent, 'pageX', { value: 90 });
            Object.defineProperty(mouseEvent, 'pageY', { value: 90 });
            component.onResize(mouseEvent);

            // Should not resize below minimum dimensions
            expect(component._style.width).toBeUndefined();
        });

        it('should end resize properly', () => {
            component.resizing = true;
            const mouseEvent = new MouseEvent('mouseup');

            component.resizeEnd(mouseEvent);

            expect(component.resizing).toBe(false);
            expect(mockDialogRef.resizeEnd).toHaveBeenCalledWith(mouseEvent);
        });
    });

    describe('Maximize and Minimize', () => {
        let fixture: ComponentFixture<DynamicDialog>;
        let component: DynamicDialog;

        beforeEach(async () => {
            mockConfig.maximizable = true;
            mockConfig.header = 'Maximizable Dialog';
            mockConfig.showHeader = true;

            fixture = TestBed.createComponent(DynamicDialog);
            component = fixture.componentInstance;
            component.childComponentType = MaximizableDialogComponent;
            component.visible = true; // Make dialog visible so template renders
            fixture.changeDetectorRef.markForCheck();
            await fixture.whenStable();
        });

        it('should toggle maximize state', () => {
            expect(component.maximized).toBeUndefined();

            component.maximize();

            expect(component.maximized).toBe(true);
            expect(mockDialogRef.maximize).toHaveBeenCalledWith({ maximized: true });

            component.maximize();

            expect(component.maximized).toBe(false);
            expect(mockDialogRef.maximize).toHaveBeenCalledWith({ maximized: false });
        });

        it('should handle maximize button click', async () => {
            const maximizeButton = fixture.debugElement.query(By.css('.p-dialog-maximize-button'));
            expect(maximizeButton).toBeTruthy();

            maximizeButton.nativeElement.click();
            await new Promise((resolve) => setTimeout(resolve, 100));

            expect(component.maximized).toBe(true);
        });

        it('should apply maximized class when maximized', async () => {
            // Get the dialog element from Dialog component
            const dialogElement = fixture.debugElement.query(By.css('p-dialog'));
            expect(dialogElement).toBeTruthy();

            // Click the maximize button which is in the Dialog component
            const maximizeButton = fixture.debugElement.query(By.css('.p-dialog-maximize-button'));
            expect(maximizeButton).toBeTruthy();

            maximizeButton.nativeElement.click();
            await new Promise((resolve) => setTimeout(resolve, 100));
            fixture.changeDetectorRef.markForCheck();
            await fixture.whenStable();

            // Check that maximized state is set
            expect(component.maximized).toBe(true);
        });
    });

    describe('Focus Management and Accessibility', () => {
        let fixture: ComponentFixture<DynamicDialog>;
        let component: DynamicDialog;

        beforeEach(async () => {
            mockConfig.focusOnShow = true;
            mockConfig.focusTrap = true;
            mockConfig.header = 'Accessible Dialog';
            mockConfig.closeAriaLabel = 'Close Dialog';

            fixture = TestBed.createComponent(DynamicDialog);
            component = fixture.componentInstance;
            component.childComponentType = TestDialogContentComponent;
            fixture.changeDetectorRef.markForCheck();
            await fixture.whenStable();
        });

        it('should have correct ARIA attributes', async () => {
            component.ngAfterViewInit();
            fixture.changeDetectorRef.markForCheck();
            await fixture.whenStable();

            const dialogElement = fixture.debugElement.query(By.css('[role="dialog"]'));
            expect(dialogElement).toBeTruthy();
            expect(dialogElement.nativeElement.getAttribute('role')).toBe('dialog');
            expect(dialogElement.nativeElement.getAttribute('aria-modal')).toBe('true');
        });

        it('should pass ariaLabelledBy from config to the dialog', async () => {
            mockConfig.ariaLabelledBy = 'custom-label-id';
            fixture.changeDetectorRef.markForCheck();
            await fixture.whenStable();

            const dialogElement = fixture.debugElement.query(By.css('[role="dialog"]'));
            expect(dialogElement.nativeElement.getAttribute('aria-labelledby')).toBe('custom-label-id');
        });

        // Focus management is now handled by Dialog component, removing focus tests

        it('should handle escape key press', () => {
            mockConfig.closeOnEscape = true;
            component.container = document.createElement('div');
            component.container.style.zIndex = '1000';

            vi.spyOn(component, 'hide').mockImplementation(() => {});
            vi.spyOn(ZIndexUtils, 'getCurrent').mockReturnValue(1000);

            const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', keyCode: 27 });
            component.bindDocumentEscapeListener();

            // Simulate escape key press on document
            document.dispatchEvent(escapeEvent);

            expect(component.hide).toHaveBeenCalled();
        });
    });

    describe('Modal and Mask Interaction', () => {
        let fixture: ComponentFixture<DynamicDialog>;
        let component: DynamicDialog;

        beforeEach(async () => {
            mockConfig.modal = true;
            mockConfig.dismissableMask = true;
            mockConfig.header = 'Modal Dialog';

            fixture = TestBed.createComponent(DynamicDialog);
            component = fixture.componentInstance;
            component.childComponentType = TestDialogContentComponent;
            fixture.changeDetectorRef.markForCheck();
            await fixture.whenStable();
        });

        it('should enable modality when modal is true', () => {
            mockConfig.modal = true;
            const wrapperElement = document.createElement('div');
            document.body.appendChild(wrapperElement);
            component.wrapper = wrapperElement;
            vi.spyOn(component, 'enableModality');

            // const animationEvent: AnimationEvent = {
            //     element: document.createElement('div'),
            //     toState: 'visible',
            //     fromState: 'void',
            //     totalTime: 150,
            //     phaseName: 'start',
            //     triggerName: 'animation',
            //     disabled: false
            // };

            // component.onAnimationStart(animationEvent);

            // expect(component.enableModality).toHaveBeenCalled();

            // // Cleanup
            // document.body.removeChild(wrapperElement);
        });

        it('should handle dismissable mask click', () => {
            component.wrapper = document.createElement('div');
            vi.spyOn(component, 'hide').mockImplementation(() => {});

            component.enableModality();

            // Simulate mask click
            const mouseEvent = new MouseEvent('mousedown');
            Object.defineProperty(mouseEvent, 'target', { value: component.wrapper });
            vi.spyOn(component.wrapper, 'isSameNode').mockReturnValue(true);

            component.wrapper.dispatchEvent(mouseEvent);

            expect(component.hide).toHaveBeenCalled();
        });

        it('should not close on mask click when dismissableMask is false', () => {
            mockConfig.dismissableMask = false;
            component.wrapper = document.createElement('div');
            vi.spyOn(component, 'hide').mockImplementation(() => {});

            component.enableModality();

            const mouseEvent = new MouseEvent('mousedown');
            component.wrapper.dispatchEvent(mouseEvent);

            expect(component.hide).not.toHaveBeenCalled();
        });

        it('should disable modality properly', () => {
            component.wrapper = document.createElement('div');
            component.enableModality();

            vi.spyOn(component, 'unbindMaskClickListener').mockImplementation(() => {});
            vi.spyOn(component.cd, 'detectChanges').mockImplementation(() => {});

            component.disableModality();

            expect(component.unbindMaskClickListener).toHaveBeenCalled();
            expect(component.cd.detectChanges).toHaveBeenCalled();
        });
    });

    describe('Template and Content Projection', () => {
        let fixture: ComponentFixture<DynamicDialog>;
        let component: DynamicDialog;

        beforeEach(async () => {
            mockConfig.header = 'Template Dialog';
            mockConfig.footer = 'Footer Content';
            mockConfig.showHeader = true;

            fixture = TestBed.createComponent(DynamicDialog);
            component = fixture.componentInstance;
            component.childComponentType = TestDialogContentComponent;
            component.visible = true; // Make dialog visible
        });

        it('should load child component correctly', () => {
            const mockViewContainer = {
                clear: vi.fn(),
                createComponent: vi.fn(() => ({
                    setInput: vi.fn(),
                    instance: {
                        data: mockConfig.data,
                        closeDialog: vi.fn()
                    } as unknown as TestDialogContentComponent
                }))
            };

            component.insertionPoint = {
                viewContainerRef: mockViewContainer as any
            } as any;

            component.loadChildComponent(TestDialogContentComponent);

            expect(mockViewContainer.clear).toHaveBeenCalled();
            expect(mockViewContainer.createComponent).toHaveBeenCalledWith(TestDialogContentComponent);
        });

        it('should display header content', async () => {
            fixture.changeDetectorRef.markForCheck();
            await fixture.whenStable();

            const headerElement = fixture.debugElement.query(By.css('.p-dialog-title'));
            expect(headerElement).toBeTruthy();
            expect(headerElement.nativeElement.textContent.trim()).toBe('Template Dialog');
        });

        it('should display footer content', async () => {
            fixture.changeDetectorRef.markForCheck();
            await fixture.whenStable();

            // Footer is rendered as a plain div, not with .p-dialog-footer class in dynamic dialog
            const dialogContent = fixture.nativeElement;
            expect(dialogContent.textContent).toContain('Footer Content');
        });

        it('should hide header when showHeader is false', async () => {
            mockConfig.showHeader = false;
            fixture.changeDetectorRef.markForCheck();
            await fixture.whenStable();

            const headerElement = fixture.debugElement.query(By.css('.p-dialog-header'));
            expect(headerElement).toBeFalsy();
        });
    });

    describe('Dialog Within Dialog Edge Cases', () => {
        let fixture: ComponentFixture<DynamicDialog>;
        let component: DynamicDialog;

        beforeEach(async () => {
            mockConfig.header = 'Container Dialog';

            fixture = TestBed.createComponent(DynamicDialog);
            component = fixture.componentInstance;
            component.childComponentType = DialogWithinDialogComponent;
            fixture.changeDetectorRef.markForCheck();
            await fixture.whenStable();
        });

        it('should handle dialog opened within another dialog component', async () => {
            // Simulate opening a dialog within the current dialog component
            const innerDialogRef = new DynamicDialogRef();
            const innerDialogSpy = vi.spyOn(innerDialogRef, 'close');

            expect(innerDialogRef).toBeTruthy();
            expect(innerDialogRef.onClose).toBeTruthy();

            // Close the inner dialog
            innerDialogRef.close('inner closed');

            expect(innerDialogSpy).toHaveBeenCalledWith('inner closed');

            await new Promise((resolve) => setTimeout(resolve, 100));
        });

        it('should maintain separate dialog contexts', () => {
            // Each dialog should have its own config and ref
            expect(component.ddconfig).toBe(mockConfig);
            expect(component.ddconfig).toBe(mockConfig);

            // Inner dialogs should have their own contexts
            const innerDialogRef = new DynamicDialogRef();
            const innerConfig = new DynamicDialogConfig();
            innerConfig.header = 'Inner Dialog';

            expect(innerDialogRef).not.toBe(mockDialogRef);
            expect(innerConfig).not.toBe(mockConfig);
        });

        it('should handle mask clicks correctly with nested dialogs', () => {
            component.wrapper = document.createElement('div');
            mockConfig.dismissableMask = true;

            vi.spyOn(component, 'hide').mockImplementation(() => {});

            component.enableModality();

            // Simulate mask click on outer dialog
            const mouseEvent = new MouseEvent('mousedown');
            Object.defineProperty(mouseEvent, 'target', { value: component.wrapper });
            vi.spyOn(component.wrapper, 'isSameNode').mockReturnValue(true);

            component.wrapper.dispatchEvent(mouseEvent);

            expect(component.hide).toHaveBeenCalled();
        });
    });

    describe('Cleanup and Memory Leak Prevention', () => {
        let fixture: ComponentFixture<DynamicDialog>;
        let component: DynamicDialog;

        beforeEach(async () => {
            mockConfig.header = 'Test Dialog';

            fixture = TestBed.createComponent(DynamicDialog);
            component = fixture.componentInstance;
            component.childComponentType = TestDialogContentComponent;
            fixture.changeDetectorRef.markForCheck();
            await fixture.whenStable();
        });

        it('should cleanup all listeners on destroy', () => {
            vi.spyOn(component, 'onContainerDestroy').mockImplementation(() => {});
            vi.spyOn(component, 'destroyStyle').mockImplementation(() => {});

            // Simulate component ref
            component.componentRef = {
                destroy: vi.fn()
            } as any;

            component.ngOnDestroy();

            expect(component.onContainerDestroy).toHaveBeenCalled();
            expect(component.componentRef!.destroy).toHaveBeenCalled();
            expect(component.destroyStyle).toHaveBeenCalled();
        });

        it('should unbind all global listeners', () => {
            vi.spyOn(component, 'unbindDocumentEscapeListener').mockImplementation(() => {});
            vi.spyOn(component, 'unbindDocumentResizeListeners').mockImplementation(() => {});
            vi.spyOn(component, 'unbindDocumentDragListener').mockImplementation(() => {});
            vi.spyOn(component, 'unbindDocumentDragEndListener').mockImplementation(() => {});

            component.unbindGlobalListeners();

            expect(component.unbindDocumentEscapeListener).toHaveBeenCalled();
            expect(component.unbindDocumentResizeListeners).toHaveBeenCalled();
            expect(component.unbindDocumentDragListener).toHaveBeenCalled();
            expect(component.unbindDocumentDragEndListener).toHaveBeenCalled();
        });

        it('should clear z-index utilities on container destroy', () => {
            component.container = document.createElement('div');
            mockConfig.autoZIndex = true;
            mockConfig.modal = true; // Enable modal so disableModality gets called

            vi.spyOn(component, 'unbindGlobalListeners').mockImplementation(() => {});
            vi.spyOn(component, 'disableModality').mockImplementation(() => {});

            component.onContainerDestroy();

            expect(component.unbindGlobalListeners).toHaveBeenCalled();
            expect(component.disableModality).toHaveBeenCalled();
            expect(component.container).toBeNull();
        });

        it('should destroy style element on destroy', () => {
            component.styleElement = document.createElement('style');
            document.head.appendChild(component.styleElement);

            vi.spyOn(component.renderer, 'removeChild').mockImplementation(() => {});
            const styleElement = component.styleElement;

            component.destroyStyle();

            expect(component.renderer.removeChild).toHaveBeenCalledWith(document.head, styleElement);
            expect(component.styleElement).toBeNull();
        });

        it('should unbind mask click listener', () => {
            const mockListener = vi.fn();
            component.maskClickListener = mockListener;

            component.unbindMaskClickListener();

            expect(mockListener).toHaveBeenCalled();
            expect(component.maskClickListener).toBeNull();
        });

        it('should unbind document listeners correctly', () => {
            const mockResizeListener = vi.fn();
            const mockResizeEndListener = vi.fn();

            component.documentResizeListener = mockResizeListener;
            component.documentResizeEndListener = mockResizeEndListener;

            component.unbindDocumentResizeListeners();

            expect(mockResizeListener).toHaveBeenCalled();
            expect(mockResizeEndListener).toHaveBeenCalled();
            expect(component.documentResizeListener).toBeNull();
            expect(component.documentResizeEndListener).toBeNull();
        });

        it('should unbind drag listeners correctly', () => {
            // Set up actual listeners first
            const mockDragListener = vi.fn();
            const mockDragEndListener = vi.fn();

            component.documentDragListener = mockDragListener;
            component.documentDragEndListener = mockDragEndListener;

            expect(component.documentDragListener).not.toBeNull();
            expect(component.documentDragEndListener).not.toBeNull();

            component.unbindDocumentDragListener();
            component.unbindDocumentDragEndListener();

            // Check that listeners were called (they are removal functions)
            expect(mockDragListener).toHaveBeenCalled();
            expect(mockDragEndListener).toHaveBeenCalled();

            // Check that references were nullified
            expect(component.documentDragListener).toBeNull();
            expect(component.documentDragEndListener).toBeNull();
        });
    });

    describe('Breakpoints and Responsive Design', () => {
        let fixture: ComponentFixture<DynamicDialog>;
        let component: DynamicDialog;

        beforeEach(async () => {
            mockConfig.breakpoints = {
                '960px': '75vw',
                '640px': '90vw'
            };

            fixture = TestBed.createComponent(DynamicDialog);
            component = fixture.componentInstance;
            component.childComponentType = TestDialogContentComponent; // Set child component

            // Mock platform to be browser for createStyle to work
            Object.defineProperty(component, 'platformId', { value: 'browser' });

            fixture.changeDetectorRef.markForCheck();
            await fixture.whenStable();
        });

        it('should create style element for breakpoints', () => {
            // Reset styleElement so createStyle can run again
            component.styleElement = null as any;

            vi.spyOn(component.renderer, 'createElement').mockReturnValue(document.createElement('style'));
            vi.spyOn(component.renderer, 'appendChild').mockImplementation(() => {});
            vi.spyOn(component.renderer, 'setProperty').mockImplementation(() => {});

            // Call createStyle directly
            component.createStyle();

            expect(component.renderer.createElement).toHaveBeenCalledWith('style');
            expect(component.renderer.appendChild).toHaveBeenCalled();
            expect(component.renderer.setProperty).toHaveBeenCalled();
        });

        it('should generate correct CSS for breakpoints', () => {
            // Reset styleElement so createStyle can run again
            component.styleElement = null as any;

            // Call createStyle directly
            component.createStyle();

            expect(component.styleElement).toBeTruthy();
            expect(component.styleElement.type).toBe('text/css');
        });
    });
});
