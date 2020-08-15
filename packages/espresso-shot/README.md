# Espresso-Shot
Espresso-Shot is a tiny, but strong, library for testing typed code using TypeScript. It's also the only such library that's designed to be [extensible](#adding-your-own-checks).

## Installation
with npm:
> `npm install @humeris/espresso-shot`

with yarn:
> `yarn add @humeris/espresso-shot`

## Basic usage
Espresso-Shot tests use a similar structure as familiar JavaScript testing frameworks. The following would be a complete and valid test file.
```ts
import { expectTypeOf, typecheck } from "@humeris/espresso-shot";

typecheck("Test the types of values by passing them as arguments", () => [
  expectTypeOf(42).toBe(42),
]);

typecheck("Or test types directly by passing them as type arguments", () => [
  expectTypeOf<42>().toBe<42>(),
]);

typecheck("And you can mix them both", () => [
  expectTypeOf(42).not.toBe<666>(),
]);

typecheck("Alternative syntax", check => {
  check(expectTypeOf(42).not.toBe<any>());

  const whatsMyType = 42;
  check([
    expectTypeOf(whatsMyType).not.toBe<unknown>(),
    expectTypeOf<typeof whatsMyType>().not.toBe<never>(),
  ]);
);
```

## Running tests
Note that Espresso-Shot does not ship with a test runner, because the tests don't actually need to "run". However, there are a couple of reasons why you still might want to run tests.
```ts
import { expectTypeOf, runInTests, typecheck } from "@humeris/espresso-shot";

typecheck(
  "Espresso-Shot tests will be run by compatible test-runners such as Jest",
  () => {
    // Performs a check at runtime
    expect(42).toBe(42);

    return expectTypeOf(42).toExtend<number>();
  },
);

test.only("There's no `typecheck.only` or `done` function as with Jest", done => {
  typecheck("but they can still be used together", check => {
    ...
    done();

  }, { runInTest: false });
})

typecheck("Runtime error if `expectTypeOf` call was not returned or wrapped in `check`", () => {
  // This will not be typechecked!
  expectTypeOf(42).toExtend<number>();
});
// Error will be thrown if running in tests!
```
You can disable automatic test-running for all tests with the following declaration.
```ts
runInTests(false);
```
They can still opt-in by calling `typecheck` with `{ runInTest: true }`.

Experimental API: This may be deprecated in a future version.
```ts
const doTypechecksRunInTestsByDefault = runInTests();
```

## Error messages
Espresso-Shot was designed to avoid cryptic type-error messages. You can expect to see error messages like the following.
```ts
typecheck("Very helpful", () => [
  expectTypeOf(42).toBe<number>(),
  ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Type '{ expected: 42; to_equal: number; }' is not assignable to type 'never'

  expectTypeOf(42).not.toExtend<number>(),
  ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Type '{ expected: 42; not_to_extend: number; }' is not assignable to type 'never'
]);
```
# Adding your own checks
Espresso-Shot only comes with two checks `toBe` and `toExtend`. This minimal offering is intentional, as adding new checks was designed to be straightforward.

```ts
// Add this to a TypeScript global type declaration file,
// or just in the test file you want to use it in.
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

typecheck("Your custom check will now be callable", () => [
  expectTypeOf(42).toHaveProperty("toString"),
  expectTypeOf(42).not.toHaveProperty("substring"),

  expectTypeOf(42).not.toHaveProperty("toString"),
  ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Type '{ [error]: { expected: 42; not_to_have_property: "toString"; }; }' is not assignable to type '{ [error]: never; }'
])
```

Note that if you're running on a JavaScript runtime that doesn't support ES6 proxies, you'll also need to add the following line:
```ts
registerTypeMatcher("toHaveProperty");
```