import type { ActiveElement, ChartDataset } from 'chart.js';
import { describe, expect, it } from 'vitest';
import type { ChartDataSelectEvent } from '@openng/optimus-ui/types/chart';

describe('ChartDataSelectEvent', () => {
    it('should expose the typed Chart.js selection payload', () => {
        const event: ChartDataSelectEvent<'bar'> = {
            originalEvent: new MouseEvent('click'),
            element: {} as ActiveElement,
            dataset: {} as ChartDataset<'bar'>
        };

        expect(event.dataset).toBeDefined();
    });
});
