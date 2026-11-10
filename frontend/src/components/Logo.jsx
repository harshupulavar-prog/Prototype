import React, { useState } from 'react';

/**
 * Kaara logo. Drop the official file at frontend/public/kaara-logo.svg (or .png)
 * and it is used automatically; until then a clean wordmark is shown.
 */
export default function Logo({ className = 'h-8' }) {
  const [sources] = useState(['/kaara-logo.svg', '/kaara-logo.png']);
  const [idx, setIdx] = useState(0);

  if (idx < sources.length) {
    return (
      <img
        src={sources[idx]}
        alt="Kaara"
        className={`${className} w-auto`}
        onError={() => setIdx((i) => i + 1)}
      />
    );
  }

  return (
    <span className="inline-flex items-baseline font-bold tracking-tight text-charcoal leading-none select-none" aria-label="Kaara">
      <span className="text-kaara-500 text-[1.7em]">K</span>
      <span className="text-[1.3em] -ml-0.5">aara</span>
    </span>
  );
}
