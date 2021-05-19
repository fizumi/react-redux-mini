# About

`redux` use `reducer` to change a state.

```typescript
type Reducer = <B, A>(b: B, a: A) => B
```

`react-redux-mini` use `endomorphism` to change a state.

```typescript
type CreateEndomorphism = <A, B>(a: A) => Endomorphism<B>
type Endomorphism = <B>(b: B) => B
```
