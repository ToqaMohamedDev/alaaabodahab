// Performance optimization utilities

// Preload critical resources
export function preloadResource(href: string, as: string) {
  if (typeof window !== "undefined") {
    const link = document.createElement("link");
    link.rel = "preload";
    link.href = href;
    link.as = as;
    document.head.appendChild(link);
  }
}

// Prefetch resources for faster navigation
export function prefetchResource(href: string) {
  if (typeof window !== "undefined") {
    const link = document.createElement("link");
    link.rel = "prefetch";
    link.href = href;
    document.head.appendChild(link);
  }
}

// Optimize images loading
export function optimizeImageLoading() {
  if (typeof window !== "undefined" && "loading" in HTMLImageElement.prototype) {
    // Native lazy loading is supported
    const images = document.querySelectorAll("img[data-src]");
    images.forEach((img) => {
      (img as HTMLImageElement).loading = "lazy";
    });
  }
}

// Reduce motion for users who prefer it
export function prefersReducedMotion(): boolean {
  if (typeof window !== "undefined") {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }
  return false;
}

// Get device type for optimization
export function getDeviceType(): "mobile" | "tablet" | "desktop" {
  if (typeof window === "undefined") return "desktop";
  
  const width = window.innerWidth;
  if (width < 768) return "mobile";
  if (width < 1024) return "tablet";
  return "desktop";
}

// Check if connection is slow
export function isSlowConnection(): boolean {
  if (typeof navigator !== "undefined" && "connection" in navigator) {
    const connection = (navigator as any).connection;
    if (connection) {
      return (
        connection.effectiveType === "slow-2g" ||
        connection.effectiveType === "2g" ||
        connection.saveData === true
      );
    }
  }
  return false;
}

// Batch DOM updates for better performance
export function batchDOMUpdates(callback: () => void) {
  if (typeof window !== "undefined" && "requestIdleCallback" in window) {
    requestIdleCallback(callback, { timeout: 2000 });
  } else {
    setTimeout(callback, 0);
  }
}

// Memoize expensive functions
export function memoize<T extends (...args: any[]) => any>(fn: T): T {
  const cache = new Map();
  
  return ((...args: Parameters<T>) => {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key);
    }
    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as T;
}

