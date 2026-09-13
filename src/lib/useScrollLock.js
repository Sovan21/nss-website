import { useEffect, useId } from 'react';

// Global ref-counted scroll lock: body & html scroll is disabled only when at least one lock is active.
// Multiple components can independently request a lock without conflicting with each other.
const activeLocks = new Set();
let previousBodyOverflow = '';
let previousHtmlOverflow = '';

function syncBodyOverflow() {
  if (typeof document === 'undefined') return;

  const isLocked = activeLocks.size > 0;
  
  if (isLocked) {
    if (activeLocks.size === 1) {
      // First lock: record original styles
      previousBodyOverflow = document.body.style.overflow;
      previousHtmlOverflow = document.documentElement.style.overflow;

      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    }
  } else {
    // All locks released: restore styles cleanly
    document.body.style.overflow = previousBodyOverflow;
    document.documentElement.style.overflow = previousHtmlOverflow;
  }
}

export default function useScrollLock(isLocked) {
  const id = useId();
  useEffect(() => {
    if (isLocked) {
      activeLocks.add(id);
    } else {
      activeLocks.delete(id);
    }
    syncBodyOverflow();

    return () => {
      activeLocks.delete(id);
      syncBodyOverflow();
    };
  }, [isLocked, id]);
}
