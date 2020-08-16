import { AllTrue, And, AnyTrue, Not } from "./boolean";

export declare type IsSubtype<T, U> = T extends U ? true : false;
export declare type IsAny<T> = IsSubtype<[T], T & []>;
export declare type IsNever<T> = IsSubtype<[T], [never]>;
export declare type IsUnknown<T> = And<Not<IsAny<T>>, IsSubtype<unknown, T>>;
export declare type IsReified<T> = Not<AnyTrue<[IsAny<T>, IsUnknown<T>, IsNever<T>]>>;

export declare type IsEqual<T, U> = AnyTrue<
  [
    And<IsAny<T>, IsAny<U>>,
    And<IsNever<T>, IsNever<U>>,
    And<IsUnknown<T>, IsUnknown<U>>,
    AllTrue<[IsReified<T>, IsReified<U>, IsSubtype<T, U>, IsSubtype<U, T>]>,
  ]
>;

type StructurallyEqual<T, U> = IsSubtype<
  { [K in keyof T]: K extends keyof U ? Is<T[K], U[K]> : never },
  { [K in keyof T]: true }
>;

type AnyFunction = (...args: Array<any>) => any;

type DeltaStructurallyEqual<T, U> = StructurallyEqual<Exclude<T, U>, Exclude<U, T>>;

// Weaken method equality slightly since methods
// are likely to circularly reference their types

type ParametersEqual<T, U> = DeltaStructurallyEqual<
  Parameters<T extends AnyFunction ? T : never>,
  Parameters<U extends AnyFunction ? U : never>
>;

type ReturnTypesEqual<T, U> = DeltaStructurallyEqual<
  ReturnType<T extends AnyFunction ? T : never>,
  ReturnType<U extends AnyFunction ? U : never>
>;

export declare type Is<T, U> = AnyTrue<
  [
    And<IsAny<T>, IsAny<U>>,
    And<IsNever<T>, IsNever<U>>,
    And<IsUnknown<T>, IsUnknown<U>>,
    AllTrue<
      [
        IsReified<T>,
        IsReified<U>,
        IsSubtype<T, U>,
        IsSubtype<U, T>,
        IsEqual<keyof Exclude<T, null | undefined>, keyof Exclude<U, null | undefined>>,
        StructurallyEqual<T, U>,
        ParametersEqual<T, U>,
        ReturnTypesEqual<T, U>,
      ]
    >,
  ]
>;
