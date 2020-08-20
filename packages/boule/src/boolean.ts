export type If<C extends boolean, A, B> = C extends true ? A : B;
export type Not<T> = T extends false ? true : false;
export type Or<A extends boolean, B extends boolean> = A extends true
  ? true
  : B extends true
  ? true
  : false;
export type And<A extends boolean, B extends boolean> = A extends false
  ? false
  : B extends false
  ? false
  : true;
export type AnyTrue<T extends Array<boolean>> = T extends Array<false> ? false : true;
export type AnyFalse<T extends Array<boolean>> = T extends Array<true> ? false : true;
export type AllTrue<T extends Array<boolean>> = T extends Array<true> ? true : false;
export type AllFalse<T extends Array<boolean>> = T extends Array<false> ? true : false;
