import { expectTypeOf, registerTypeMatcher, typecheck } from "./index";

describe("packages/espresso-shot", () => {
  describe("`typecheck`", () => {
    test("with synchronous callback returns `undefined`", () => {
      expect(typecheck("test case", () => [], { runInTest: false })).toBeUndefined;
      expect(
        typecheck("test case", () => expectTypeOf(null).toBe(null), { runInTest: false }),
      ).toBeUndefined();
    });

    test("with asynchronous callback returns promise", async () => {
      await expect(
        typecheck("test case", async () => [], { runInTest: false }),
      ).resolves.toBeUndefined();
      await expect(
        typecheck("test case", async () => expectTypeOf(null).toBe(null), { runInTest: false }),
      ).resolves.toBeUndefined();
    });
  });

  typecheck("expectation methods just return empty object", check => {
    const checks = [
      expectTypeOf(null).toBe(null),
      expectTypeOf(null).toExtend(null),
      expectTypeOf(null).not.toBe(null),
      expectTypeOf(null).not.toExtend(null),
    ];

    // @ts-expect-error
    check(checks);

    expect(checks).toEqual([{}, {}, {}, {}]);
  });

  typecheck("supports either arguments or type arguments", () => [
    expectTypeOf<42>().toBe<42>(),
    expectTypeOf(42).toBe(42),
  ]);

  typecheck("supports testing subtypes", () => [
    // @ts-expect-error
    expectTypeOf(42 as const).toBe<number>(),
    expectTypeOf(42 as const).toExtend<number>(),
  ]);

  typecheck("supports testing inequality", () => [
    // @ts-expect-error
    expectTypeOf(42 as const).toBe<never>(),
    expectTypeOf(42 as const).not.toBe<never>(),

    // @ts-expect-error
    expectTypeOf(42 as const).toBe<unknown>(),
    expectTypeOf(42 as const).not.toBe<unknown>(),

    // @ts-expect-error
    expectTypeOf(42 as const).toBe<any>(),
    expectTypeOf(42 as const).not.toBe<any>(),
  ]);

  typecheck("various regressions", check => {
    check(expectTypeOf<{ a: () => void }>().not.toBe<{ a: (a?: number) => void }>());
    check(expectTypeOf<() => void>().not.toBe<(a?: number) => void>());

    check(expectTypeOf<Promise<number>>().not.toBe<Promise<string>>());
    check(expectTypeOf<[any] | undefined>().not.toBe<[42] | undefined>());
    check(expectTypeOf<() => [any]>().not.toBe<() => [42]>());
  });

  typecheck("supports testing if types are the same", check => {
    // `toBe` checks that two types are "the same", which means that
    // both types are assignable to all the same types and both types
    // have all the same types assignable to them.

    const x: {} | null = {} as const;
    const y: { a?: number } | null = x;
    const z: { a?: string } | null = x;
    let pair = { x, y } as const;

    // No type error here since `x` and `y` are mutually assignable
    pair = { x: y, y: x };

    // `z` is assignable to `x`, but incompatible with `y`
    pair = {
      x: z,
      // @ts-expect-error
      y: z,
    };

    return check([
      expectTypeOf<typeof pair["x"]>().not.toBe<typeof pair["y"]>(),

      // Sanity check that a type is the same as itself
      expectTypeOf<typeof pair["x"]>().toBe<typeof pair["x"]>(),
    ]);
  });

  typecheck("supports testing if functions are the same with respect to arguments", check => {
    const x: (() => void) | null = () => {};
    const y: (a?: number) => void | null = () => {};
    const z: ((a?: string) => void) | null = () => {};
    let pair = { x, y } as const;

    // No type error here since `x` and `y` are mutually assignable
    pair = { x: y, y: x };

    // `z` is assignable to `x`, but incompatible with `y`
    pair = {
      x: z,
      // @ts-expect-error
      y: z,
    };

    return check([
      expectTypeOf<typeof pair["x"]>().not.toBe<typeof pair["y"]>(),

      // Sanity check that a type is the same as itself
      expectTypeOf<typeof pair["x"]>().toBe<typeof pair["x"]>(),
    ]);
  });

  typecheck("supports testing if functions are the same with respect to return value", check => {
    const x: (() => void) | null = () => {};
    const y: (() => void | number) | null = () => {};
    const z: (() => void | string) | null = () => {};
    let pair = { x, y } as const;

    // No type error here since `x` and `y` are mutually assignable
    pair = { x: y, y: x };

    // `z` is assignable to `x`, but incompatible with `y`
    pair = {
      x: z,
      // @ts-expect-error
      y: z,
    };

    return check([
      expectTypeOf<typeof pair["x"]>().not.toBe<typeof pair["y"]>(),

      // Sanity check that a type is the same as itself
      expectTypeOf<typeof pair["x"]>().toBe<typeof pair["x"]>(),
    ]);
  });

  typecheck("common types that reference themselves", () => [
    expectTypeOf<RegExp>().toBe<RegExp>(),
    expectTypeOf<Promise<number>>().toBe<Promise<number>>(),
    expectTypeOf<PromiseLike<number>>().toBe<PromiseLike<number>>(),
    expectTypeOf<typeof fetch>().toBe<typeof fetch>(),
  ]);

  typecheck("various constructor", check => {
    check(expectTypeOf<PromiseConstructor>().toBe<PromiseConstructor>());
    check(expectTypeOf<ArrayBufferConstructor>().toBe<ArrayBufferConstructor>());
    check(expectTypeOf<FunctionConstructor>().toBe<FunctionConstructor>());
    check(expectTypeOf<MapConstructor>().toBe<MapConstructor>());
  });

  typecheck("supports extension (see `toHaveProperty` declaration below)", () => [
    expectTypeOf(42).toHaveProperty("toString" as const),
    // @ts-expect-error
    expectTypeOf(42).not.toHaveProperty("toString" as const),

    // @ts-expect-error
    expectTypeOf(42).toHaveProperty("substring" as const),
    expectTypeOf(42).not.toHaveProperty("substring" as const),
  ]);

  test("Cannot register reserved name `not` (see attempted `not` declaration below)", () => {
    expect(() => {
      // @ts-expect-error
      registerTypeMatcher("not");
    }).toThrowError("Cannot register reserved name `not`");
  });
});

declare module "./index" {
  interface EspressoShotConfig<Source, Target> {
    toHaveProperty: {
      condition: Target extends keyof Source ? true : false;
      error: { expected: Source; to_have_property: Target };
      not: {
        error: { expected: Source; not_to_have_property: Target };
      };
    };
  }
}

declare module "./index" {
  interface EspressoShotConfig<Source, Target> {
    // @ts-expect-error
    not: {
      condition: Source extends Target ? true : false;
      error: { expected: Source; to_equal: Target };
      not: {
        error: { received_unexpected: Source };
      };
    };
  }
}
