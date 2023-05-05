type Flatten<T> = { [K in keyof T]: T[K] } & unknown

type Writable<Type> = {
  -readonly [Key in keyof Type]: Type[Key]
}
