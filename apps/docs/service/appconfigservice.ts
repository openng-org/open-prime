import { AppState } from '@/domain/appstate';
import { DOCUMENT } from '@angular/common';
import { computed, effect, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';

const LOCAL_STORAGE_KEY = 'optimus-ui-app-state';

@Injectable({
    providedIn: 'root'
})
export class AppConfigService {
    appState = signal<AppState>(this.getStateFromLocalStorage());

    newsActive = signal(false);

    document = inject(DOCUMENT);

    platformId = inject(PLATFORM_ID);

    transitionComplete = signal<boolean>(false);

    darkMode = computed(() => this.appState().darkTheme);

    primaryPalette = computed(() => this.appState().primary);

    surfacePalette = computed(() => this.appState().surface);

    constructor() {
        effect(() => {
            this.toggleDarkMode(this.darkMode());
            this.onTransitionEnd();
        });

        effect(() => {
            this.saveStateToLocalStorage(this.appState());
        });
    }

    private toggleDarkMode(darkMode: boolean): void {
        if (darkMode) {
            this.document.documentElement.classList.add('p-dark');
        } else {
            this.document.documentElement.classList.remove('p-dark');
        }
    }

    private onTransitionEnd() {
        this.transitionComplete.set(true);
        setTimeout(() => {
            this.transitionComplete.set(false);
        });
    }

    private saveStateToLocalStorage(state: AppState): void {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
    }

    private getStateFromLocalStorage(): AppState {
        const savedState = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (savedState) {
            return JSON.parse(savedState) as AppState;
        }

        return {
            preset: 'Aura',
            primary: 'noir',
            surface: null,
            darkTheme: false,
            menuActive: false,
            RTL: false
        };
    }

    hideMenu() {
        this.appState.update((state) => ({
            ...state,
            menuActive: false
        }));
    }

    showMenu() {
        this.appState.update((state) => ({
            ...state,
            menuActive: true
        }));
    }

    hideNews() {
        this.newsActive.set(false);
    }

    showNews() {
        this.newsActive.set(true);
    }
}
