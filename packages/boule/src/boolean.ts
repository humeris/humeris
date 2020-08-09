export declare type If<C extends boolean, A, B> = C extends true ? A : B;
export declare type Not<T> = T extends false ? true : false;
export declare type Or<A extends boolean, B extends boolean> = A extends true
  ? true
  : B extends true
  ? true
  : false;
export declare type And<A extends boolean, B extends boolean> = A extends false
  ? false
  : B extends false
  ? false
  : true;
export declare type AnyTrue<T extends Array<boolean>> = T extends Array<false> ? false : true;
export declare type AllTrue<T extends Array<boolean>> = T extends Array<true> ? true : false;
