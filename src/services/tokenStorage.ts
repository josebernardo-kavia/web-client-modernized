type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

/**
 * In-memory storage fallback for environments where Web Storage is unavailable or blocked.
 * (e.g., privacy mode / blocked third-party storage in some setups)
 */
class MemoryStorage implements StorageLike {
  private map = new Map<string, string>()

  getItem(key: string): string | null {
    return this.map.has(key) ? (this.map.get(key) as string) : null
  }

  setItem(key: string, value: string): void {
    this.map.set(key, value)
  }

  removeItem(key: string): void {
    this.map.delete(key)
  }
}

const memoryStorage = new MemoryStorage()

function canUseSessionStorage(): boolean {
  try {
    if (typeof window === 'undefined') return false
    if (!window.sessionStorage) return false
    const k = '__storage_test__'
    window.sessionStorage.setItem(k, '1')
    window.sessionStorage.removeItem(k)
    return true
  } catch {
    return false
  }
}

// PUBLIC_INTERFACE
export function getSessionPreferredStorage(): StorageLike {
  /** Returns sessionStorage when available; otherwise an in-memory fallback. */
  return canUseSessionStorage() ? window.sessionStorage : memoryStorage
}
