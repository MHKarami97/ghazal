export function randomInt(maxExclusive: number): number {
  return Math.floor(Math.random() * maxExclusive);
}

/** Fisher-Yates shuffle; returns a new array and never mutates the input. */
export function shuffle<T>(items: T[]): T[] {
  var result = items.slice();
  for (var i = result.length - 1; i > 0; i--) {
    var j = randomInt(i + 1);
    var temp = result[i];
    result[i] = result[j];
    result[j] = temp;
  }
  return result;
}
