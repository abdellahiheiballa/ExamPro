import React from 'react';
import './Timer.css';

export default function Timer({ timeLeft, totalTime }) {
  const pct = totalTime > 0 ? timeLeft / totalTime : 0;
  const isLow = pct < 0.15;
  const isMid = pct < 0.33;

  const h = Math.floor(timeLeft / 3600);
  const m = Math.floor((timeLeft % 3600) / 60);
  const s = timeLeft % 60;

  const label = h > 0
    ? `${h}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`
    : `${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;

  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - pct);

  return (
    <div className={`timer ${isLow ? 'timer-low' : isMid ? 'timer-mid' : ''}`}>
      <svg width="56" height="56" viewBox="0 0 56 56">
        <circle cx="28" cy="28" r={radius} className="timer-track" />
        <circle
          cx="28" cy="28" r={radius}
          className="timer-ring"
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: offset,
          }}
        />
      </svg>
      <div className="timer-inner">
        <span className="timer-label">{label}</span>
      </div>
    </div>
  );
}
