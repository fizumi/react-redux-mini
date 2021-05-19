type Listener = () => void
type Unsubscribe = () => void
interface Store<A> {
  getState: () => A
  subscribe: (l: Listener) => Unsubscribe
  dispatch: (modifier: (state: A) => A) => void
}

export const createStore = <A>(initialValue: A): Store<A> => {
  let currentState = initialValue
  let listener: Listener | undefined
  const store = {
    getState: () => currentState,
    subscribe: (l: Listener) => {
      listener = l
      return function unsubscribe() {
        listener = undefined
      }
    },
    dispatch: (modifier: (state: A) => A) => {
      currentState = modifier(currentState)
      listener?.()
    },
  }
  return store
}
