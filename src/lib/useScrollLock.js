import { useEffect, useId } from 'react';

// Global ref-counted scroll lock: body scroll is disabled only when at least one lock is active.
// Multiple components can independently request a lock without conflicting with each other.
const activeLocks = new Set();

function syncBodyOverflow() {
  document.body.style.overflow = activeLocks.size > 0 ? 'hidden' : '';
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
