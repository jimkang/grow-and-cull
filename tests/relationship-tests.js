var test = require('tape');
var { getPossibleRelationships } = require('../tasks/relationships.ts');

var testCases = [
  {
    name: 'Simple',
    opts: [1, 1.5, 3],
    expected: [
      {
        pair: [1, 1.5],
        ratio: { numerator: 1, denominator: 1.5 },
        closestDiamondRatio: { numerator: 3, denominator: 2 },
        distance: 0,
      },
      {
        pair: [1, 3],
        ratio: { numerator: 1, denominator: 3 },
        closestDiamondRatio: { numerator: 1, denominator: 2 },
        distance: 0.16666666666666669,
      },
      {
        pair: [1.5, 3],
        ratio: { numerator: 1, denominator: 2 },
        closestDiamondRatio: { numerator: 2, denominator: 1 },
        distance: 0,
      },
    ],
  },
];

testCases.forEach(runTest);

function runTest({ name, opts, expected }) {
  test(name, testFn);

  function testFn(t) {
    t.deepEqual(getPossibleRelationships(opts), expected);
    t.end();
  }
}
