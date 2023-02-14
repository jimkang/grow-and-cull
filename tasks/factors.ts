export function factorDown({ numerator, denominator }) {
  var commonFactor = findCommonFactor(numerator, denominator);
  if (commonFactor) {
    return {
      numerator: numerator / commonFactor,
      denominator: denominator / commonFactor,
    };
  }
  return { numerator, denominator };
}

// Assumes whole numbers for a and b.
function findCommonFactor(a, b) {
  for (let factor = a; factor > 0; --factor) {
    if ((a / factor) % 1 === 0 && (b / factor) % 1 === 0) {
      return factor;
    }
  }
}
