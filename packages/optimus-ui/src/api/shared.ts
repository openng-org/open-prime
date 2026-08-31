import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Directive, Input, NgModule, TemplateRef, inject } from '@angular/core';

@Component({
    changeDetection: ChangeDetectionStrategy.Eager,
    selector: 'p-header',
    template: '<ng-content></ng-content>',
    standalone: false
})
export class Header {}

@Component({
    changeDetection: ChangeDetectionStrategy.Eager,
    selector: 'p-footer',
    template: '<ng-content></ng-content>',
    standalone: false
})
export class Footer {}

@Directive({
    selector: '[pTemplate]',
    standalone: true
})
export class PrimeTemplate {
    template = inject<TemplateRef<any>>(TemplateRef);

    @Input() type: string | undefined;

    @Input('pTemplate') name: string | undefined;

    getType(): string {
        return this.name!;
    }
}

@NgModule({
    imports: [CommonModule, PrimeTemplate],
    exports: [Header, Footer, PrimeTemplate],
    declarations: [Header, Footer]
})
export class SharedModule {}
