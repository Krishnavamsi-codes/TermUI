// ─────────────────────────────────────────────────────
// shallow — one-level shallow equality comparison
//
// Compares two values by checking that:
//   1. They are the same reference (fast-path via Object.is)
//   2. Both are plain objects with the same key count
//   3. Every key in `a` is present in `b` with an Object.is-equal value
//
// Intended for use as the `equalityFn` argument of the selector hook:
//
//   const slice = useMyStore(s => ({ x: s.x, y: s.y }), shallow);
// ─────────────────────────────────────────────────────

/**
 * One-level shallow equality comparison.
 *
 * Returns `true` when `a` and `b` are the same reference OR when both are
 * plain objects whose keys and corresponding values are `Object.is`-equal.
 * Returns `false` in all other cases, including differing key counts.
 *
 * ```ts
 * shallow({ x: 1, y: 2 }, { x: 1, y: 2 }); // true
 * shallow({ x: 1, y: 2 }, { x: 1, y: 3 }); // false — value differs
 * shallow({ x: 1 },       { x: 1, y: 2 }); // false — key count differs
 * ```
 */
export function shallow<T>(a: T, b: T): boolean {
    // Fast path: identical reference or primitive equality
    if (Object.is(a, b)) return true;

    // Both must be non-null objects for a meaningful shallow comparison
    if (
        typeof a !== 'object' || a === null ||
        typeof b !== 'object' || b === null
    ) {
        return false;
    }

    const keysA = Object.keys(a as object);
    const keysB = Object.keys(b as object);

    // Key count must match
    if (keysA.length !== keysB.length) return false;

    // Every key in a must exist in b with an Object.is-equal value
    for (const key of keysA) {
        if (
            !Object.prototype.hasOwnProperty.call(b, key) ||
            !Object.is((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key])
        ) {
            return false;
        }
    }

    return true;
}
