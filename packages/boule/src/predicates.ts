import { AllFalse, AllTrue, And, AnyTrue, Not } from "./boolean";

export type IsSubtype<T, U> = T extends U ? true : false;
export type IsAny<T> = IsSubtype<[T], T & []>;
export type IsNever<T> = IsSubtype<[T], [never]>;
export type IsUnknown<T> = And<Not<IsAny<T>>, IsSubtype<unknown, T>>;
export type IsReified<T> = AllFalse<[IsAny<T>, IsUnknown<T>, IsNever<T>]>;
export type IsCompatible<T, U> = IsSubtype<[T, U], [U, T]>;
type NonNilable<T> = T extends null | undefined | void ? never : T;

type MAX_DEPTH = 8;

export type Is<T, U, DepthMeter extends never[] = []> = DepthMeter["length"] extends MAX_DEPTH
  ? true
  : And<IsReified<T>, IsReified<U>> extends true
  ? CompareNormalized<Normalize<T>, Normalize<U>, [never, never, ...DepthMeter]>
  : AnyTrue<
      [And<IsAny<T>, IsAny<U>>, And<IsNever<T>, IsNever<U>>, And<IsUnknown<T>, IsUnknown<U>>]
    >;

type CompareNormalized<
  T extends NormalizedData,
  U extends NormalizedData,
  DepthMeter extends never[]
> = IsCompatible<keyof T, keyof U> extends true
  ? And<
      IsSubtype<
        { [K in Exclude<keyof T & keyof U, typeof data>]: Is<T[K], U[K], [never, ...DepthMeter]> },
        { [K in Exclude<keyof T & keyof U, typeof data>]: true }
      >,
      CompareData<T[typeof data], U[typeof data], [never, ...DepthMeter]>
    >
  : false;

type CompareData<T, U, DepthMeter extends never[]> = AllTrue<
  [IsSubtype<T, object>, IsSubtype<U, object>, IsCompatible<T, U>]
> extends true
  ? StructurallyEqual<NonNilable<T>, NonNilable<U>, [never, ...DepthMeter]>
  : IsCompatible<T, U>;

type StructurallyEqual<T, U, DepthMeter extends never[]> = IsCompatible<
  keyof T,
  keyof U
> extends true
  ? IsSubtype<
      {
        [K in keyof T & keyof U]: Is<T[K], U[K], [never, ...DepthMeter]>;
      },
      { [K in keyof T & keyof U]: true }
    >
  : false;

declare const data: unique symbol;
declare const parameters: unique symbol;
declare const return_type: unique symbol;
declare const constructor_parameters: unique symbol;

type NormalizedData = {
  [data]?: any;
  [parameters]?: any;
  [return_type]?: any;
  [constructor_parameters]?: any;
  // constructor return type not necessary since the "prototype" property provides the same information
};

type NormalizeConstructor<T> = T extends new (...args: infer P) => infer R
  ? T extends infer G & (new (...args: P) => R)
    ? { [data]: G; [constructor_parameters]: P }
    : never
  : { [data]: T };

type Normalize<T> = T extends (...args: infer P) => infer R
  ? T extends infer G & ((...args: P) => R)
    ? NormalizeConstructor<G> & { [parameters]: P; [return_type]: R }
    : never
  : NormalizeConstructor<T>;
