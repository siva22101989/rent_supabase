
import { useEffect } from 'react';

/**
 * Hook to prevent browser navigation (refresh, back button, close tab)
 * when a critical action is pending.
 * 
 * @param isDirtyOrPending - Boolean indicating if navigation should be prevented
 */
export function usePreventNavigation(isDirtyOrPending: boolean) {
  useEffect(() => {
    if (!isDirtyOrPending) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = ''; // Standard for Chrome/Firefox
      return '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isDirtyOrPending]);
}
