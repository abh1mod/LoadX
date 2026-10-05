import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * Reusable polling hook that executes every intervalMs (default 1000ms).
 * Avoids overlapping requests by waiting for completion before queuing the next tick.
 * Automatically cleans up on unmount and halts when enabled === false.
 *
 * @param {Function} asyncCallback - async function returning data
 * @param {number} intervalMs - delay between requests (default 1000ms)
 * @param {boolean} enabled - whether polling is active
 */
export const usePolling = (asyncCallback, intervalMs = 1000, enabled = true) => {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(enabled);

  const isPendingRef = useRef(false);
  const timerRef = useRef(null);
  const isMountedRef = useRef(true);
  const callbackRef = useRef(asyncCallback);

  useEffect(() => {
    callbackRef.current = asyncCallback;
  }, [asyncCallback]);

  const executePoll = useCallback(async () => {
    if (!isMountedRef.current || !enabled || isPendingRef.current) {
      return;
    }

    isPendingRef.current = true;
    try {
      const result = await callbackRef.current();
      if (isMountedRef.current) {
        setData(result);
        setError(null);
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
        isPendingRef.current = false;
        // Schedule next execution if still enabled
        if (enabled) {
          timerRef.current = setTimeout(executePoll, intervalMs);
        }
      }
    }
  }, [enabled, intervalMs]);

  useEffect(() => {
    isMountedRef.current = true;
    setIsLive(enabled);

    if (enabled) {
      executePoll();
    } else {
      if (timerRef.current) clearTimeout(timerRef.current);
      isPendingRef.current = false;
      setLoading(false);
    }

    return () => {
      isMountedRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [enabled, executePoll]);

  const refreshNow = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    isPendingRef.current = false;
    return executePoll();
  }, [executePoll]);

  return {
    data,
    loading,
    error,
    isLive,
    refreshNow
  };
};

export default usePolling;
