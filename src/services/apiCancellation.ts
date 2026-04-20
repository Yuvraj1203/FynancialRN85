// apiCancellation.ts
const activeControllers = new Set<AbortController>();

export function createAbortController() {
  const controller = new AbortController();
  activeControllers.add(controller);

  // cleanup when request completes or is cancelled
  controller.signal.addEventListener('abort', () => {
    activeControllers.delete(controller);
  });

  return controller;
}

export function cancelAllRequests() {
  for (const controller of activeControllers) {
    controller.abort();
  }
  activeControllers.clear();
}
