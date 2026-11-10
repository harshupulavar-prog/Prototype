import { createContext, useContext } from 'react';
import { SHORT } from '../framework.js';

// When the "Data sources" lens is on, every card shows where its numbers
// come from. Off by default so the everyday view stays clean.
export const LensContext = createContext({ on: false, sources: [] });

export function Src({ ids, className = '' }) {
  const { on, sources } = useContext(LensContext);
  if (!on) return null;
  return (
    <span className={'src nx-in ' + className}>
      <span className="src-label">from</span>
      {ids.map((id) => {
        const s = sources.find((x) => x.id === id);
        return (
          <span key={id} className="src-chip" title={s ? s.name + ': ' + s.feeds + ' (' + s.every.toLowerCase() + ')' : SHORT[id]}>
            {SHORT[id]}
          </span>
        );
      })}
    </span>
  );
}
