import { onMount, onDestroy } from 'svelte';
import { writable } from 'svelte/store';

export function onEvent<K extends keyof DocumentEventMap>(
  type: K,
  listener: (this: Document, ev: DocumentEventMap[K]) => any,
) {
  onMount(() => document.addEventListener<K>(type, listener));
  onDestroy(() => document.removeEventListener(type, listener));
}

export function onResize() {
  const size = writable({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  const onResize = () => {
    size.set({
      width: window.innerWidth,
      height: window.innerHeight,
    });
  };

  onMount(() => window.addEventListener('resize', onResize));
  onDestroy(() => window.removeEventListener('resize', onResize));

  return size;
}
