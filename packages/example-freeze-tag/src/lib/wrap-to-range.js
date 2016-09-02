export default function wrapToRange(num, lowerBound, upperBound) {
  return num < lowerBound
    ? upperBound - (lowerBound - num)
    : num > upperBound
      ? lowerBound + num - upperBound
      : num;
}
