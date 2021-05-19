import { getBatch } from './batch'

// encapsulates the subscription logic for connecting a component to the redux store, as
// well as nesting subscriptions of descendant components, so that we can ensure the
// ancestor components re-render before descendants

const nullListeners = { notify() {} }

function createListenerCollection() {
  const batch = getBatch() // { unstable_batchedUpdates as batch } from 'react-dom'
  let first = null
  let last = null

  return {
    clear() {
      first = null
      last = null
    },

    notify() {
      batch(() => {
        let listener = first
        while (listener) {
          listener.callback()
          listener = listener.next
        }
      })
    },

    // src 内を検索しても無い実行している箇所がない
    get() {
      let listeners = []
      let listener = first
      while (listener) {
        listeners.push(listener)
        listener = listener.next
      }
      return listeners
    },

    /**
     * the reason of using a linked list:
     * https://github.com/reduxjs/react-redux/pull/1523
     */
    subscribe(callback) {
      let isSubscribed = true

      let listener = (last = {
        callback,
        next: null,
        prev: last,
      })

      if (listener.prev) {
        listener.prev.next = listener
      } else {
        first = listener
      }

      return function unsubscribe() {
        if (!isSubscribed || first === null) return
        isSubscribed = false

        if (listener.next) {
          listener.next.prev = listener.prev
        } else {
          last = listener.prev
        }
        if (listener.prev) {
          listener.prev.next = listener.next
        } else {
          first = listener.next
        }
      }
    },
  }
}

export default class Subscription {
  constructor(store, parentSub) {
    this.store = store

    /**
     * Provider で new される Subscription の instance
     */
    this.parentSub = parentSub

    this.unsubscribe = null
    this.listeners = nullListeners

    this.handleChangeWrapper = this.handleChangeWrapper.bind(this)
  }

  /**
   * listeners (createListenerCollection instance)  に listener (checkForUpdates( useSelector 参照)) を追加
   */
  addNestedSub(listener) {
    this.trySubscribe()
    return this.listeners.subscribe(listener)
  }

  notifyNestedSubs() {
    this.listeners.notify()
  }

  handleChangeWrapper() {
    if (this.onStateChange) {
      this.onStateChange()
    }
  }

  isSubscribed() {
    return Boolean(this.unsubscribe)
  }

  /**
   * Provider / useSelector 等の useIsomorphicLayoutEffect にて呼び出される
   */
  trySubscribe() {
    if (!this.unsubscribe) {
      this.unsubscribe = this.parentSub
        ? this.parentSub.addNestedSub(this.handleChangeWrapper) // useSelector はこちらを使う /
        : this.store.subscribe(this.handleChangeWrapper) // Provider はこちらを使う

      this.listeners = createListenerCollection()
    }
  }

  tryUnsubscribe() {
    if (this.unsubscribe) {
      this.unsubscribe()
      this.unsubscribe = null
      this.listeners.clear()
      this.listeners = nullListeners
    }
  }
}
