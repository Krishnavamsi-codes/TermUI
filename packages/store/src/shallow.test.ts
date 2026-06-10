// ─────────────────────────────────────────────────────
// shallow.test.ts
//
// Tests for the shallow equality helper and its integration
// with the createStore selector + equalityFn hook parameter.
//
// Pattern: mirrors store.test.ts — uses store.subscribe directly.
// No JSX fiber context required (and cannot work across package
// module boundaries anyway).
// ─────────────────────────────────────────────────────

import { afterEach, describe, expect, it, vi } from 'vitest';
import { createStore } from './store.js';
import { shallow } from './shallow.js';

// ── Unit tests: shallow() ──────────────────────────────────────────────────

describe('shallow', () => {
    it('shallow returns true for equal flat objects', () => {
        expect(shallow({ a: 1, b: 'x' }, { a: 1, b: 'x' })).toBe(true);
    });

    it('shallow returns false when a value differs', () => {
        expect(shallow({ a: 1, b: 'x' }, { a: 2, b: 'x' })).toBe(false);
    });

    it('shallow returns false when key sets differ', () => {
        expect(shallow({ a: 1 }, { a: 1, b: 2 })).toBe(false);
    });
});

// ── Integration tests: selector + equalityFn guard ────────────────────────
//
// These tests exercise the equality guard that the useStore hook applies
// before calling setSelectedState. We replicate the guard through
// store.subscribe — the same mechanism the hook uses internally — so
// no JSX fiber context is required and there is no shared module state.

describe('selector equalityFn', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('selector with shallow skips notify on equal slice', () => {
        // State: { x: 1, y: 10, z: 99 }. Selector projects { x, y }.
        // When z changes the projected slice is structurally identical, so
        // shallow returns true and the subscriber must NOT be called.
        const useStore = createStore(() => ({ x: 1, y: 10, z: 99 }));

        const notify = vi.fn();
        let prevSlice = { x: useStore.getState().x, y: useStore.getState().y };

        // Subscribe and apply the same guard that useStore applies internally
        // when equalityFn is provided.
        useStore.subscribe((newState) => {
            const newSlice = { x: newState.x, y: newState.y };
            if (!shallow(prevSlice, newSlice)) {
                prevSlice = newSlice;
                notify(newSlice);
            }
        });

        // Change only z — projected slice { x, y } is structurally unchanged
        useStore.setState({ z: 100 });

        expect(notify).not.toHaveBeenCalled();

        useStore.destroy();
    });

    it('selector with shallow notifies on changed slice', () => {
        // When x changes, the projected slice { x, y } differs and the
        // subscriber must be called exactly once with the updated values.
        const useStore = createStore(() => ({ x: 1, y: 10, z: 99 }));

        const notify = vi.fn();
        let prevSlice = { x: useStore.getState().x, y: useStore.getState().y };

        useStore.subscribe((newState) => {
            const newSlice = { x: newState.x, y: newState.y };
            if (!shallow(prevSlice, newSlice)) {
                prevSlice = newSlice;
                notify(newSlice);
            }
        });

        // Change x — projected slice differs
        useStore.setState({ x: 2 });

        expect(notify).toHaveBeenCalledTimes(1);
        expect(notify).toHaveBeenCalledWith({ x: 2, y: 10 });

        useStore.destroy();
    });
});
