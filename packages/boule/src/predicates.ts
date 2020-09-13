import { AllFalse, And, Not } from "./boolean";

export type IsSubtype<T, U> = T extends U ? true : false;
export type IsAny<T> = IsSubtype<[T], T & []>;
export type IsNever<T> = IsSubtype<[T], [never]>;
export type IsUnknown<T> = And<Not<IsAny<T>>, IsSubtype<unknown, T>>;
export type IsReified<T> = AllFalse<[IsAny<T>, IsUnknown<T>, IsNever<T>]>;
export type IsCompatible<T, U> = IsSubtype<[T, U], [U, T]>;
type Primitive = number | string | symbol | boolean | null | undefined | void;

declare const Any: unique symbol;
declare const Unknown: unique symbol;
declare const Never: unique symbol;

type Reify<T> = [T] extends T & []
  ? typeof Any
  : unknown extends T
  ? typeof Unknown
  : [T] extends [never]
  ? typeof Never
  : T extends Primitive
  ? T
  : { [K in keyof T]: Reify<T[K]> } &
      (T extends (...args: infer Parameters) => infer ReturnType
        ? (...args: { [K in keyof Parameters]: Reify<Parameters[K]> }) => Reify<ReturnType>
        : unknown) &
      (T extends new (...args: infer Parameters) => infer ReturnType
        ? new (...args: { [K in keyof Parameters]: Reify<Parameters[K]> }) => Reify<ReturnType>
        : unknown);

export type Is<T, U, MaxDepth extends number = 5> = _Is<Reify<T>, Reify<U>, [], MaxDepth>;

type _Is<
  T,
  U,
  DepthMeter extends never[],
  MaxDepth extends number
> = DepthMeter["length"] extends MaxDepth
  ? true
  : IsCompatible<T, U> extends true
  ? [T, U] extends [Primitive, Primitive]
    ? true
    : IsStructurallyEqual<Normalize<T>, Normalize<U>, [never, ...DepthMeter], MaxDepth>
  : false;

type IsStructurallyEqual<T, U, DepthMeter extends never[], MaxDepth extends number> = IsCompatible<
  keyof T,
  keyof U
> extends true
  ? IsSubtype<
      {
        [K in Exclude<keyof T & keyof U, typeof data>]: _Is<T[K], U[K], DepthMeter, MaxDepth>;
      },
      { [K in Exclude<keyof T & keyof U, typeof data>]: true }
    >
  : false;

declare const data: unique symbol;
declare const parameters: unique symbol;
declare const return_type: unique symbol;
declare const constructor_parameters: unique symbol;

type NormalizeConstructor<T> = T extends new (...args: infer P) => infer R
  ? T extends infer G & (new (...args: P) => R)
    ? { [constructor_parameters]: P } & G
    : never
  : T;

type Normalize<T> = T extends (...args: infer P) => infer R
  ? T extends infer G & ((...args: P) => R)
    ? NormalizeConstructor<G> & { [parameters]: P; [return_type]: R }
    : never
  : NormalizeConstructor<T>;
