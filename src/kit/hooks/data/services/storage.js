const storage = () => {
  const isBrowser = (() => typeof window !== 'undefined')()

  return {
    // eslint-disable-next-line  @typescript-eslint/no-explicit-any
    setItem: (key, data) => {
      if (isBrowser) {
        if (typeof data === 'object') {
          localStorage.setItem(key, JSON.stringify(data))
        } else {
          localStorage.setItem(key, data)
        }
      }
    },
    getItem: (key, onlyString, type) => {
      const storageType = `${type ?? 'local'}Storage`
      let item = isBrowser ? window[storageType][key] : ''
      if (onlyString) {
        return item
      }
      try {
        item = JSON.parse(item)
      } catch (e) {
        return item
      }

      return item
    },
    removeItem: (key, type) => {
      const storageType = `${type ?? 'local'}Storage`
      if (isBrowser) {
        window[storageType].removeItem(key)
      }
    },
    clearAll: (type) => {
      const storageType = `${type ?? 'local'}Storage`
      if (isBrowser) {
        window[storageType].clear()
      }
    }
  }
}

export default storage()
