/**
 * Scrolls the first element marked with [data-error="true"] (or [aria-invalid="true"])
 * into view and focuses it. Use after a form validation failure so the user
 * doesn't have to hunt for the broken field — especially important on mobile
 * where the keyboard hides most of the screen.
 */
export function scrollToFirstError(container?: HTMLElement | null) {
  // Defer so the DOM has applied the error attributes first.
  requestAnimationFrame(() => {
    const root: ParentNode = container ?? document;
    const target =
      (root.querySelector('[data-error="true"]') as HTMLElement | null) ??
      (root.querySelector('[aria-invalid="true"]') as HTMLElement | null);
    if (!target) return;

    target.scrollIntoView({ behavior: "smooth", block: "center" });

    // Try to focus the input itself (might be the target or inside it)
    const focusable =
      target.matches("input, textarea, select, button")
        ? target
        : (target.querySelector("input, textarea, select, button") as HTMLElement | null);
    focusable?.focus({ preventScroll: true });
  });
}
