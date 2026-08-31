import { Component, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { Steps } from './steps';

@Component({
    standalone: true,
    imports: [Steps],
    template: ` <p-steps [model]="model" [readonly]="false"></p-steps> `
})
class StepsQueryApiHostComponent {
    model = [{ label: 'One' }, { label: 'Two' }];
}

describe('Steps Signal Query API', () => {
    it('should resolve the list viewChild after render', async () => {
        TestBed.configureTestingModule({
            imports: [StepsQueryApiHostComponent],
            providers: [provideRouter([]), provideZonelessChangeDetection(), provideNoopAnimations()]
        });
        const fixture = TestBed.createComponent(StepsQueryApiHostComponent);
        fixture.detectChanges();
        await fixture.whenStable();

        const instance = fixture.debugElement.query(By.directive(Steps)).componentInstance;
        expect(instance.listViewChild().nativeElement).toBeDefined();
    });
});
