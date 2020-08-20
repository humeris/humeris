import { If, Is, IsSubtype } from "@humeris/boule";

const matcherRegistry: Record<string, () => {}> = {};

let _warnOnUnnecessaryExplicitRegistration = false;
export function warnOnUnnecessaryExplicitRegistration(): boolean;
export function warnOnUnnecessaryExplicitRegistration(value: boolean): void;
export function warnOnUnnecessaryExplicitRegistration(value?: boolean): boolean | void {
  if (value === undefined) {
    return _warnOnUnnecessaryExplicitRegistration;
  }
  _warnOnUnnecessaryExplicitRegistration = value;
}

let _defaultRunInTests = true;
export function runInTests(): boolean;
export function runInTests(value: boolean): void;
export function runInTests(value?: boolean): boolean | void {
  if (value === undefined) {
    return _defaultRunInTests;
  }
  _defaultRunInTests = value;
}

const uncheckedExpectations: Array<Expectation> = [];
function placeholderTypeMatcher(): Expectation {
  const error = new Error("Expectation was not typechecked. Did you forget to return it?");

  const { prepareStackTrace } = Error;
  Error.prepareStackTrace = (error, stack) => {
    stack.splice(0, 1);
    return prepareStackTrace?.(error, stack);
  };

  Error.captureStackTrace(error);
  error.stack;
  Error.prepareStackTrace = prepareStackTrace;

  const expectation = {} as Expectation;
  uncheckedExpectations.push(expectation);
  return Object.defineProperty(expectation, "__error__", {
    writable: false,
    value: error,
  });
}

function removeCheckedExpectations(expectations: Array<Expectation>): void {
  for (const expectation of expectations) {
    const index = uncheckedExpectations.indexOf(expectation);
    if (index === -1) {
      throw Error(
        "Typecheck function must return an array of expectations or the result of a `check` call, e.g. `typecheck(check => { return check([<expectations>]); }`",
      );
    }
    uncheckedExpectations.splice(index, 1);
  }
}

export function registerTypeMatcher<TName extends keyof EspressoShotConfig<never, never>>(
  name: TName extends "not" ? { ["error"]: "Cannot register reserved name `not`" } : TName,
) {
  if (typeof name !== "string") {
    throw Error("Type matcher names must be strings");
  }

  if (name === "not") {
    throw Error("Cannot register reserved name `not`");
  }

  const validatedName: TName = name as TName;

  const proxy = getProxy();
  if (proxy === null) {
    matcherRegistry[validatedName] = placeholderTypeMatcher;
  } else if (_warnOnUnnecessaryExplicitRegistration) {
    console.warn(
      "ES6 Proxy feature detected. Manual calls to `registerTypeMatcher` are not needed :)",
    );
  }
}

function getProxy<Source>(): ExpectTypeOf<Source> | null {
  try {
    let proxy: ExpectTypeOf<Source>;
    proxy = new Proxy({} as ExpectTypeOf<Source>, {
      get: (target, prop) => {
        if (prop === "not") {
          return proxy;
        }
        return placeholderTypeMatcher;
      },
    });
    return proxy;
  } catch (error) {
    if (!(error instanceof ReferenceError)) {
      throw error;
    }
    return null;
  }
}

export function expectTypeOf<Source>(...args: [] | [Source]): ExpectTypeOf<Source> {
  return (
    getProxy() ?? ({ ...matcherRegistry, not: { ...matcherRegistry } } as ExpectTypeOf<Source>)
  );
}

type TypeMatcherConfig = {
  condition: boolean;
  error: {};
  not: {
    error: {};
  };
};

declare const error: unique symbol;

type BuildResult<TConfig extends TypeMatcherConfig> = {
  [error]: If<TConfig["condition"], never, TConfig["error"]>;
};

type BuildNegatedResult<TConfig extends TypeMatcherConfig> = {
  [error]: If<TConfig["condition"], TConfig["not"]["error"], never>;
};

type ExpectTypeOf<Source> = {
  [K in Exclude<keyof EspressoShotConfig<Source, never>, "not">]: <Target>(
    ...args: [] | [Target]
  ) => K extends string ? BuildResult<EspressoShotConfig<Source, Target>[K]> : never;
} & {
  not: {
    [K in Exclude<keyof EspressoShotConfig<Source, never>, "not">]: <Target>(
      ...args: [] | [Target]
    ) => K extends string ? BuildNegatedResult<EspressoShotConfig<Source, Target>[K]> : never;
  };
};

type Expectation = { [error]: never };
type CheckFunction = (
  check: (_: Expectation | Array<Expectation>) => void,
) => void | Expectation | Array<Expectation>;
type AsyncCheckFunction = (
  ...args: Parameters<CheckFunction>
) => PromiseLike<ReturnType<CheckFunction>>;

function isPromiseLike<T>(obj: T | PromiseLike<T>): obj is PromiseLike<T> {
  return (
    (typeof obj === "object" || typeof obj === "function") &&
    "then" in obj &&
    typeof obj.then === "function"
  );
}

interface Thenable<T> {
  then<TResult = T extends PromiseLike<infer U> ? U : T>(
    onfulfilled?: ((value: T extends PromiseLike<infer U> ? U : T) => TResult) | undefined | null,
  ): T extends PromiseLike<any> ? PromiseLike<TResult> : TResult;
}

function thenable<T>(value: T | PromiseLike<T>): Thenable<T> {
  if (isPromiseLike(value)) {
    return value as Thenable<T>;
  } else {
    return {
      then<U>(callback: (value: T) => U) {
        return callback(value);
      },
    } as Thenable<T>;
  }
}

function typecheckImpl(callback: CheckFunction | AsyncCheckFunction) {
  if (typeof callback !== "function") {
    throw Error("Last argument to `typecheck` must be a callback function.");
  }

  const checkFunction = (expectationOrExpectations: Expectation | Array<Expectation>) => {
    removeCheckedExpectations(
      Array.isArray(expectationOrExpectations)
        ? expectationOrExpectations
        : [expectationOrExpectations],
    );
  };

  return thenable(callback(checkFunction)).then(
    (expectationOrExpectations: Expectation | Array<Expectation> | void): void => {
      if (Array.isArray(expectationOrExpectations)) {
        removeCheckedExpectations(expectationOrExpectations);
      } else if (expectationOrExpectations) {
        removeCheckedExpectations([expectationOrExpectations]);
      }

      if (uncheckedExpectations.length > 0) {
        throw Object.getOwnPropertyDescriptor(uncheckedExpectations.splice(0)[0], "__error__")!
          .value;
      }
    },
  );
}

function isRunningCompatibleTest(): boolean {
  return [typeof afterEach, typeof beforeEach, typeof describe, typeof it].every(
    result => result !== undefined,
  );
}

export function typecheck(
  description: string,
  callback: CheckFunction | AsyncCheckFunction,
  options?: { runInTest?: true },
): void;
export function typecheck<TCheckFunction extends CheckFunction | AsyncCheckFunction>(
  description: string,
  callback: TCheckFunction,
  options: { runInTest: false },
): ReturnType<TCheckFunction> extends PromiseLike<any> ? PromiseLike<void> : void;
export function typecheck<TCheckFunction extends CheckFunction | AsyncCheckFunction>(
  description: string,
  callback: TCheckFunction,
  { runInTest = _defaultRunInTests }: { runInTest?: boolean } = {},
) {
  if (runInTest) {
    if (isRunningCompatibleTest()) {
      return test(description, () => typecheckImpl(callback));
    } else {
      const result = typecheckImpl(callback);
      if (isPromiseLike(result)) {
        throw Error(
          "Callback argument returned a promise. Either call `typecheck` with `runInTest` equal to `false` and await the result, or run the test with a Jest-compatible test runner.",
        );
      }
      return result;
    }
  }
  return typecheckImpl(callback);
}

export declare interface EspressoShotConfig<Source, Target> {
  not: { [error]: "Cannot register reserved name `not`" };
}

registerTypeMatcher("toBe");
export declare interface EspressoShotConfig<Source, Target> {
  toBe: {
    condition: Is<Source, Target>;
    error: { expected: Source; to_be: Target };
    not: {
      error: { received_unexpected: Source };
    };
  };
}

registerTypeMatcher("toExtend");
export declare interface EspressoShotConfig<Source, Target> {
  toExtend: {
    condition: IsSubtype<Source, Target>;
    error: { expected: Source; to_extend: Target };
    not: {
      error: { expected: Source; not_to_extend: Target };
    };
  };
}
