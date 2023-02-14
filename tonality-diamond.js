import { diamondLimit } from './consts';
const diamondSideLength = Math.ceil(diamondLimit / 2);
import { factorDown } from './tasks/factors';

var diamondRatioMap = new Map();

for (let row = 0; row < diamondSideLength; ++row) {
  const rawDenominator = diamondLimit - row;
  for (let col = 0; col < diamondSideLength; ++col) {
    const rawNumerator = diamondLimit - col;
    let { numerator, denominator } = factorDown({
      numerator: rawNumerator,
      denominator: rawDenominator,
    });
    diamondRatioMap.set(`${numerator}/${denominator}`, {
      numerator,
      denominator,
    });
  }
}

diamondRatioMap.set('1/2', { numerator: 1, denominator: 2 });
diamondRatioMap.set('2/1', { numerator: 2, denominator: 1 });

// [...diamondRatioMap.values()] will yield [] in Node 14.
export var diamondRatios = Array.from(diamondRatioMap.values());
diamondRatios.sort((a, b) => a.denominator - b.denominator);
console.log('diamondRatios', diamondRatios);

export var tonalityDiamondPitches = [1, 2].concat(
  diamondRatios
    .slice(1)
    .map(({ numerator, denominator }) => numerator / denominator)
);

console.log(tonalityDiamondPitches);
