/**
 * Throttle function - limits a function to be called at most once in a specified time interval
 * @param func The function to throttle
 * @param delay The delay time in milliseconds
 * @returns The throttled function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  delay: number,
): (...args: Parameters<T>) => void {
  let lastCall = 0
  let timeoutId: NodeJS.Timeout | null = null

  return function throttled(this: any, ...args: Parameters<T>) {
    const now = Date.now()

    if (now - lastCall >= delay) {
      // If enough time has passed since the last call, execute immediately
      lastCall = now
      func.apply(this, args)
    }
    else {
      // Otherwise, schedule delayed execution
      if (timeoutId) {
        clearTimeout(timeoutId)
      }

      timeoutId = setTimeout(() => {
        lastCall = Date.now()
        func.apply(this, args)
        timeoutId = null
      }, delay - (now - lastCall))
    }
  }
}

/**
 * Debounce function - delays the execution of a function, resets the timer if called again during the delay
 * @param func The function to debounce
 * @param delay The delay time in milliseconds
 * @returns The debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number,
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null

  return function debounced(this: any, ...args: Parameters<T>) {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    timeoutId = setTimeout(() => {
      func.apply(this, args)
      timeoutId = null
    }, delay)
  }
}
