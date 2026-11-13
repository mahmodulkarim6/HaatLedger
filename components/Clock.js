'use client';
import { useEffect, useState } from 'react';

const TZ = 'Asia/Dhaka';
const timeFmt = new Intl.DateTimeFormat('en-US', { timeZone: TZ, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
const dateFmt = new Intl.DateTimeFormat('en-GB', { timeZone: TZ, weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

export default function Clock() {
  const [now, setNow] = useState(null);
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="clock" role="timer" aria-label="Current time in Bangladesh">
      <time dateTime={now ? now.toISOString() : undefined}>{now ? timeFmt.format(now) : '--:--:--'}</time>
      <span>{now ? dateFmt.format(now) : '\u00a0'}</span>
    </div>
  );
}
