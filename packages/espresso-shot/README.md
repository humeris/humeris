```ts
typecheck("supports either arguments or type arguments", () => [
  expectTypeOf<42>().toBe<42>(),
  expectTypeOf(42).toBe(42),
]);

typecheck("supports testing subtypes", () => [
  // @ts-expect-error "Type '{ expected: 42; to_equal: number; }' is not assignable to type 'never'"
  expectTypeOf(42).toBe<number>(),

  expectTypeOf(42).toExtend<number>(),
]);

typecheck("supports testing inequality", () => [
  expectTypeOf(42).not.toBe<never>(),
  expectTypeOf(42).not.toBe<unknown>(),
  expectTypeOf(42).not.toBe<any>(),
]);

// Easily define your own custom checks!

declare module "@humeris/espresso-shot" {
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

typecheck("supports custom checks!", () => [
  expectTypeOf(42).toHaveProperty("toString"),
  expectTypeOf(42).not.toHaveProperty("substring"),
])

```