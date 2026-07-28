const DEFAULT_PADDING = 9;
const DEFAULT_TIMEOUT = 5000;

function ancestorsAreVisible(element) {
  let current = element;

  while (current && current !== document.documentElement) {
    const style = window.getComputedStyle(current);
    const opacity = Number.parseFloat(style.opacity);

    if (
      style.display === "none" ||
      style.visibility === "hidden" ||
      (Number.isFinite(opacity) && opacity < 0.98) ||
      current.getAttribute("aria-hidden") === "true"
    ) {
      return false;
    }

    current = current.parentElement;
  }

  return true;
}

export function findVisibleGuideTarget(name) {
  if (!name) return null;

  const elements = Array.from(document.querySelectorAll(`[data-guide="${name}"]`));
  return (
    elements.find((element) => {
      const rect = element.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0 && ancestorsAreVisible(element);
    }) || null
  );
}

export function getGuideSpotlightRect(targetName, padding = DEFAULT_PADDING) {
  const element = findVisibleGuideTarget(targetName);
  if (!element) return null;

  const rect = element.getBoundingClientRect();
  const top = Math.max(8, rect.top - padding);
  const left = Math.max(8, rect.left - padding);
  const right = Math.min(window.innerWidth - 8, rect.right + padding);
  const bottom = Math.min(window.innerHeight - 8, rect.bottom + padding);

  return {
    top,
    left,
    width: Math.max(0, right - left),
    height: Math.max(0, bottom - top),
  };
}

function nearlyEqual(previous, next) {
  if (!previous || !next) return false;
  return (
    Math.abs(previous.top - next.top) < 0.75 &&
    Math.abs(previous.left - next.left) < 0.75 &&
    Math.abs(previous.width - next.width) < 0.75 &&
    Math.abs(previous.height - next.height) < 0.75
  );
}

function nextFrame() {
  return new Promise((resolve) => window.requestAnimationFrame(resolve));
}

export async function waitForGuideTarget(
  targetName,
  {
    padding = DEFAULT_PADDING,
    timeout = DEFAULT_TIMEOUT,
    isCancelled = () => false,
  } = {},
) {
  if (!targetName) return null;

  const startedAt = window.performance.now();
  let previousRect = null;
  let stableFrames = 0;
  let scrolledElement = null;

  while (window.performance.now() - startedAt < timeout) {
    await nextFrame();
    if (isCancelled()) return null;

    const element = findVisibleGuideTarget(targetName);
    if (!element) {
      previousRect = null;
      stableFrames = 0;
      continue;
    }

    if (scrolledElement !== element) {
      element.scrollIntoView({ block: "center", inline: "nearest", behavior: "auto" });
      scrolledElement = element;
      previousRect = null;
      stableFrames = 0;
      continue;
    }

    const nextRect = getGuideSpotlightRect(targetName, padding);
    if (!nextRect) continue;

    stableFrames = nearlyEqual(previousRect, nextRect) ? stableFrames + 1 : 0;
    previousRect = nextRect;

    if (stableFrames >= 3) return nextRect;
  }

  return getGuideSpotlightRect(targetName, padding);
}
