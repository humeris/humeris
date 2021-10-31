import { AllFalse, And, Not } from "./boolean";

export type Is<T, U> = (<_>() => _ extends T ? 0 : 1) extends <_>() => _ extends U ? 0 : 1
  ? true
  : false;

export type IsSubtype<T, U> = T extends U ? true : false;
export type IsAny<T> = IsSubtype<[T], T & []>;
export type IsNever<T> = IsSubtype<[T], [never]>;
export type IsUnknown<T> = And<Not<IsAny<T>>, IsSubtype<unknown, T>>;
export type IsReified<T> = AllFalse<[IsAny<T>, IsUnknown<T>, IsNever<T>]>;
export type IsCompatible<T, U> = IsSubtype<[T, U], [U, T]>;
