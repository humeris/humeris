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
    expectTypeOf(42).toBe<number>(),
    expectTypeOf(42).toExtend<number>(),
  ]);

  typecheck("supports testing inequality", () => [
    // @ts-expect-error
    expectTypeOf(42).toBe<never>(),
    expectTypeOf(42).not.toBe<never>(),

    // @ts-expect-error
    expectTypeOf(42).toBe<unknown>(),
    expectTypeOf(42).not.toBe<unknown>(),

    // @ts-expect-error
    expectTypeOf(42).toBe<any>(),
    expectTypeOf(42).not.toBe<any>(),
  ]);

  typecheck("very subtle case", check => {
    // These types describe the same set of runtime values and
    // differ only in how type transformations may apply to them.
    const x: { [x: string]: 0 | undefined } = {};
    const y: { [x: string]: 0 | undefined; a?: 0 } = {};

    return check([
      expectTypeOf(x).toEqual(y),

      expectTypeOf<Required<typeof y>>().toExtend<Required<typeof x>>(),
      // @ts-expect-error
      expectTypeOf<Required<typeof x>>().toExtend<Required<typeof y>>(),

      // Explicit design decision to treat these types as the same
      expectTypeOf(x).toBe(y),
    ]);
  });

  typecheck("supports testing if types are the same", check => {
    // `toEqual` checks that two types are mutually assignable, but
    // assignability is not transitive.
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
      // `toEqual` checks mutual assignability
      expectTypeOf<typeof pair["x"]>().toEqual<typeof pair["y"]>(),
      // but `toBe` checks that they are "the same" type
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
      // `toEqual` checks mutual assignability
      expectTypeOf<typeof pair["x"]>().toEqual<typeof pair["y"]>(),
      // but `toBe` checks that they are "the same" type
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
      // `toEqual` checks mutual assignability
      expectTypeOf<typeof pair["x"]>().toEqual<typeof pair["y"]>(),
      // but `toBe` checks that they are "the same" type
      expectTypeOf<typeof pair["x"]>().not.toBe<typeof pair["y"]>(),

      // Sanity check that a type is the same as itself
      expectTypeOf<typeof pair["x"]>().toBe<typeof pair["x"]>(),
    ]);
  });

  typecheck("supports extension (see `toHaveProperty` declaration below)", () => [
    expectTypeOf(42).toHaveProperty("toString"),
    // @ts-expect-error
    expectTypeOf(42).not.toHaveProperty("toString"),

    // @ts-expect-error
    expectTypeOf(42).toHaveProperty("substring"),
    expectTypeOf(42).not.toHaveProperty("substring"),
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
