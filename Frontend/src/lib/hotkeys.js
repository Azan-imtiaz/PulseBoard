import { useEffect, useLayoutEffect, useRef } from 'react';

function isTyping(target) {
  const el = target;
  return !!el && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName));
}

// Supports "k", "c" and "mod+k" (⌘ on macOS, Ctrl elsewhere). Single-key shortcuts
// are ignored while the user is typing; modifier shortcuts always fire.
export function useHotkey(combo, handler, enabled = true) {
  const handlerRef = useRef(handler);
  useLayoutEffect(() => {
    handlerRef.current = handler;
  });

  useEffect(() => {
    if (!enabled) return;
    const withMod = combo.startsWith('mod+');
    const key = withMod ? combo.slice(4) : combo;

    function onKeyDown(event) {
      const mod = event.metaKey || event.ctrlKey;
      if (event.key.toLowerCase() !== key || mod !== withMod || event.altKey) return;
      if (!withMod && isTyping(event.target)) return;
      event.preventDefault();
      handlerRef.current(event);
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [combo, enabled]);
}
