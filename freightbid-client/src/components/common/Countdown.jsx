import React, { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';

export const Countdown = ({
  secondsRemaining = 0,
  isLive = true,
  onExpire = null,
  compact = false
}) => {
  const [seconds, setSeconds] = useState(secondsRemaining);

  useEffect(() => {
    setSeconds(secondsRemaining);
  }, [secondsRemaining]);

  useEffect(() => {
    if (seconds <= 0) {
      if (onExpire) onExpire();
      return;
    }

    const interval = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          if (onExpire) onExpire();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [seconds, onExpire]);

  const formatParts = () => {
    if (seconds <= 0) return { h: '00', m: '00', s: '00', expired: true };

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    return {
      h: String(hours).padStart(2, '0'),
      m: String(minutes).padStart(2, '0'),
      s: String(secs).padStart(2, '0'),
      expired: false
    };
  };

  const { h, m, s, expired } = formatParts();

  if (compact) {
    return (
      <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-mono font-medium ${expired ? 'bg-slate-100 text-slate-500' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
        <Clock className="w-3 h-3" />
        <span>{expired ? 'Ended' : `${h}:${m}:${s}`}</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium ${
      expired
        ? 'bg-slate-100 text-slate-500 border-slate-200'
        : 'bg-amber-50/80 text-amber-800 border-amber-200 shadow-sm'
    }`}>
      {isLive && !expired && (
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
      )}
      <Clock className="w-4 h-4 text-amber-600 shrink-0" />
      <span className="text-xs text-slate-600 font-sans font-medium">Closes in:</span>
      <span className="font-mono font-bold tracking-wider">
        {expired ? 'Auction Ended' : `${h}h ${m}m ${s}s`}
      </span>
    </div>
  );
};

export default Countdown;
