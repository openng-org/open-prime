export type MotionType = 'transition' | 'animation';
export type MotionPhase = 'enter' | 'leave';
export type MotionStage = 'Before' | 'Start' | 'After' | 'Cancelled';

/**
 * Defines the duration of motion effects.
 * It can be a single number representing the duration in milliseconds,
 * or an object specifying different durations for 'enter' and 'leave' phases.
 */
export type MotionDuration = number | { [P in MotionPhase]?: number } | undefined;

/**
 * Options for specifying class names during different phases of motion.
 * These class names are applied at the start, during, and at the end of the motion.
 */
export type ClassNameOptions = {
    /**
     * The class name to apply at the start of the motion.
     */
    from?: string | undefined;
    /**
     * The class name to apply while the motion is active.
     */
    active?: string | undefined;
    /**
     * The class name to apply at the end of the motion.
     */
    to?: string | undefined;
};

/**
 * Defines class names for both 'enter' and 'leave' motion phases.
 */
export interface MotionClassNames {
    /**
     * Class names for the 'enter' motion phase.
     * @see ClassNameOptions
     */
    enterClass?: ClassNameOptions | undefined;
    /**
     * Class names for the 'leave' motion phase.
     * @see ClassNameOptions
     */
    leaveClass?: ClassNameOptions | undefined;
}

/**
 * Metadata about the motion effect, including its type, timeout, and count.
 */
export type MotionMetadata = {
    /**
     * The type of motion effect, either 'transition' or 'animation'.
     * @see MotionType
     */
    type: MotionType | undefined;
    /**
     * The timeout duration for the motion effect in milliseconds.
     */
    timeout: number | 0;
    /**
     * The count of transition or animation properties involved in the motion.
     */
    count: number | 0;
};

/**
 * Event object passed to motion hooks, containing the target element.
 */
export interface MotionEvent {
    /**
     * The target element of the motion event.
     */
    element: Element;
}

/**
 * Hooks for various stages of the motion lifecycle.
 */
export interface MotionHooks {
    /**
     * Called before the enter motion starts.
     * @param event - The motion event object.
     * @returns
     */
    onBeforeEnter?: (event: MotionEvent) => void;
    /**
     * Called when the enter motion starts.
     * @param event - The motion event object.
     * @returns
     */
    onEnter?: (event: MotionEvent) => void;
    /**
     * Called after the enter motion ends.
     * @param event - The motion event object.
     * @returns
     */
    onAfterEnter?: (event: MotionEvent) => void;
    /**
     * Called if the enter motion is cancelled.
     * @param event - The motion event object.
     * @returns
     */
    onEnterCancelled?: (event: MotionEvent) => void;
    /**
     * Called before the leave motion starts.
     * @param event - The motion event object.
     * @returns
     */
    onBeforeLeave?: (event: MotionEvent) => void;
    /**
     * Called when the leave motion starts.
     * @param event - The motion event object.
     * @returns
     */
    onLeave?: (event: MotionEvent) => void;
    /**
     * Called after the leave motion ends.
     * @param event - The motion event object.
     * @returns
     */
    onAfterLeave?: (event: MotionEvent) => void;
    /**
     * Called if the leave motion is cancelled.
     * @param event - The motion event object.
     * @returns
     */
    onLeaveCancelled?: (event: MotionEvent) => void;
}

/**
 * Hooks organized by motion phase and stage.
 */
export type MotionHooksWithPhase = {
    [P in MotionPhase]?: {
        [S in MotionStage as `on${S}`]?: (MotionHooks & { [key: string]: unknown })[`on${S extends 'Start' | 'Cancelled' ? '' : S}${Capitalize<P>}${S extends 'Cancelled' ? S : ''}`];
    };
};

/**
 * Class names organized by motion phase.
 */
export type MotionClassNamesWithPhase = {
    [P in MotionPhase]: Required<ClassNameOptions>;
};

/**
 * Options for configuring motion effects.
 */
export interface MotionOptions extends MotionClassNames, MotionHooks {
    /**
     * The base name used for generating default class names.
     */
    name?: string | undefined;
    /**
     * The type of motion effect to use.
     * @see MotionType
     */
    type?: MotionType | undefined;
    /**
     * Indicates whether to respect the user's reduced motion preference.
     */
    safe?: boolean | undefined;
    /**
     * Indicates whether motion effects are disabled.
     */
    disabled?: boolean | undefined;
    /**
     * Indicates whether the motion should run on the initial render (appear phase).
     */
    appear?: boolean | undefined;
    /**
     * Indicates whether to perform enter motions.
     */
    enter?: boolean | undefined;
    /**
     * Indicates whether to perform leave motions.
     */
    leave?: boolean | undefined;
    /**
     * The duration of the motion effect.
     * @see MotionDuration
     */
    duration?: MotionDuration | undefined;
    /**
     * Indicates whether to automatically adjust height during the motion.
     */
    autoHeight?: boolean | undefined;
    /**
     * Indicates whether to automatically adjust width during the motion.
     */
    autoWidth?: boolean | undefined;
}

/**
 * Represents an instance of a motion effect applied to an element.
 */
export type MotionInstance = {
    /**
     * Starts the enter motion.
     * @returns - A promise that resolves to a cancellation function or void.
     */
    enter: () => Promise<(() => void) | void>;
    /**
     * Starts the leave motion.
     * @returns - A promise that resolves to a cancellation function or void.
     */
    leave: () => Promise<(() => void) | void>;
    /**
     * Cancels the motion.
     * @returns
     */
    cancel: () => void;
    /**
     * Updates the motion instance with a new element and options.
     * @param element - The target element.
     * @param options - The motion options.
     * @returns
     */
    update: (element: Element, options?: MotionOptions) => void;
};
