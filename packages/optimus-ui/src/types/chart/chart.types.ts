import type { PassThrough, PassThroughOption } from '@openng/optimus-ui/api';
import type { ActiveElement, ChartDataset, ChartTypeRegistry } from 'chart.js';

/**
 * Data selection event emitted when a chart element is clicked.
 *
 * @template T Chart.js chart type.
 * @group Events
 */
export interface ChartDataSelectEvent<T extends keyof ChartTypeRegistry = keyof ChartTypeRegistry> {
    /**
     * Browser click event.
     */
    originalEvent: MouseEvent;
    /**
     * Selected chart element.
     */
    element: ActiveElement;
    /**
     * Selected dataset.
     */
    dataset: ChartDataset<T>;
}

/**
 * Custom pass-through(pt) options.
 * @template I Type of instance.
 *
 * @see {@link UIChart.pt}
 * @group Interface
 */
export interface ChartPassThroughOptions<I = unknown> {
    /**
     * Used to pass attributes to the host's DOM element.
     */
    host?: PassThroughOption<HTMLElement, I>;
    /**
     * Used to pass attributes to the root's DOM element.
     */
    root?: PassThroughOption<HTMLElement, I>;
    /**
     * Used to pass attributes to the canvas DOM element.
     */
    canvas?: PassThroughOption<HTMLCanvasElement, I>;
}

/**
 * Defines valid pass-through options in Chart.
 * @see {@link ChartPassThroughOptions}
 *
 * @template I Type of instance.
 */
export type ChartPassThrough<I = unknown> = PassThrough<I, ChartPassThroughOptions<I>>;
