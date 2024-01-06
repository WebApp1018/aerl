import toFixedNumberString from "./to_fixed_number_string";

test("fixed number string conversion", () => {
  const output = toFixedNumberString(12.345, 3);
  expect(output.value).toBe("12.3");
  expect(output.prefix).toBe("");
});

test("fixed number string conversion with prefix", () => {
  const output = toFixedNumberString(12345, 3);
  expect(output.value).toBe("12.3");
  expect(output.prefix).toBe("k");
});

test("fixed number string conversion with many digits", () => {
  const output = toFixedNumberString(12345, 30);
  expect(output.value).toBe("12.345");
  expect(output.prefix).toBe("k");
});
