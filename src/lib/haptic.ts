export function tap(ms = 8): void {
  if ('vibrate' in navigator) {
    try {
      navigator.vibrate(ms)
    } catch {
      // ignored
    }
  }
}
