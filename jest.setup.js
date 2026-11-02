/**
 * jsdom has no canvas: its getContext() returns null, as a browser does for a
 * context it can't make, and since Jest 30 also logs that through
 * console.error, which the tests count as a failure. The tests give their own
 * canvas where they need one.
 */
window.HTMLCanvasElement.prototype.getContext = () => null;
