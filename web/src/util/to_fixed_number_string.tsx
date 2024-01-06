/**
  Formats a number with a given number of significant digits creating a
  pleasent representation of a number of unkown magnitude.
*/
const toFixedNumberString = (
  num: number,
  digits: number
): { value: string; prefix: string } => {
  if (num === 0) {
    return { value: "0", prefix: "" };
  }

  const units = ["", "k", "M", "G", "T", "P", "E", "Z", "Y"];
  let exponent = 0;
  while (Math.abs(num) >= 1000 && exponent < units.length - 1) {
    num /= 1000;
    exponent++;
  }

  const multiplier = Math.pow(
    10,
    digits - Math.floor(Math.log10(Math.abs(num))) - 1
  );
  const roundedNum = Math.round(num * multiplier) / multiplier;
  const formattedNum = roundedNum.toString();

  return { value: formattedNum, prefix: units[exponent] };
};

export default toFixedNumberString;
