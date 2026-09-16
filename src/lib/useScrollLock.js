import { useEffect, useId } from 'react';

/**
 * Industry-Standard Reference-Counted Scroll Lock
 * 
 * Prevents scroll freezing caused by state race conditions or nested modals.
 * Only modifies body overflow when transitioning from 0 -> 1 locks,
 * and cleanly strips all lock styles when all locks reach 0.
 */

const activeLocks = new Set();
let isCurrentlyLocked = false;

function applyScrollLock() {
  if (typeof document === 'undefined') return;

  const shouldLock = activeLocks.size > 0;

  if (shouldLock && !isCurrentlyLocked) {
    // Transition from 0 -> 1: Engage lock
    isCurrentlyLocked = true;
    document.body.style.overflow = 'hidden';
    document.body.style.overscrollBehavior = 'none';
  } else if (!shouldLock && isCurrentlyLocked) {
    // Transition from 1 -> 0: Disengage lock and cleanly restore normal scrolling
    isCurrentlyLocked = false;
    document.body.style.overflow = '';
    document.body.style.overscrollBehavior = '';
    document.body.style.removeProperty('overflow');
    document.body.style.removeProperty('overscroll-behavior');
    document.documentElement.style.removeProperty('overflow');
  }
}

/**
 * Emergency reset to safely guarantee page scrollability on tab/route changes
 */
export function clearAllScrollLocks() {
  if (typeof document === 'undefined') return;
  activeLocks.clear();
  isCurrentlyLocked = false;
  document.body.style.overflow = '';
  document.body.style.overscrollBehavior = '';
  document.body.style.removeProperty('overflow');
  document.body.style.removeProperty('overscroll-behavior');
  document.documentElement.style.removeProperty('overflow');
}

/**
 * Hook to lock/unlock body scrolling for modals, lightboxes, and drawers.
 * 
 * @param {boolean} isLocked - Whether this component currently needs the scroll locked.
 */
export default function useScrollLock(isLocked) {
  const id = useId();

  useEffect(() => {
    if (isLocked) {
      activeLocks.add(id);
    } else {
      activeLocks.delete(id);
    }
    applyScrollLock();

    return () => {
      activeLocks.delete(id);
      applyScrollLock();
    };
  }, [isLocked, id]);
}
