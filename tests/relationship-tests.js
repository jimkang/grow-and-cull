var test = require('tape');
var { getPossibleRelationships } = require('../tasks/relationships.ts');
import { TonalityDiamond } from '../tonality-diamond';

var { diamondRatios } = TonalityDiamond(11);

var testCases = [
  {
    name: 'Simple',
    opts: { diamondRatios, chord: [1, 1.5, 3] },
    expected: [
      {
        pair: [1, 1.5],
        chordIndexes: [0, 1],
        ratio: { numerator: 1, denominator: 1.5 },
        closestDiamondRatio: { numerator: 3, denominator: 2 },
        distance: 0,
        weightedDistance: 0,
      },
      {
        pair: [1, 3],
        chordIndexes: [0, 2],
        ratio: { numerator: 1, denominator: 3 },
        closestDiamondRatio: { numerator: 1, denominator: 2 },
        distance: 0.16666666666666669,
        weightedDistance: 0.33333333333333337,
      },
      {
        pair: [1.5, 3],
        chordIndexes: [1, 2],
        ratio: { numerator: 1, denominator: 2 },
        closestDiamondRatio: { numerator: 2, denominator: 1 },
        distance: 0,
        weightedDistance: 0,
      },
    ],
  },
  {
    name: 'Five pitches',
    opts: { diamondRatios, chord: [0.05, 0.17, 0.96, 0.15, 0.74] },
    expected: [
      {
        pair: [0.05, 0.17],
        chordIndexes: [0, 1],
        ratio: { numerator: 0.05, denominator: 0.17 },
        closestDiamondRatio: { numerator: 1, denominator: 2 },
        distance: 0.20588235294117646,
        weightedDistance: 0.4117647058823529,
      },
      {
        pair: [0.05, 0.96],
        chordIndexes: [0, 2],
        ratio: { numerator: 0.05, denominator: 0.96 },
        closestDiamondRatio: { numerator: 1, denominator: 2 },
        distance: 0.4479166666666667,
        weightedDistance: 0.8958333333333334,
      },
      {
        pair: [0.05, 0.15],
        chordIndexes: [0, 3],
        ratio: { numerator: 0.05, denominator: 0.15 },
        closestDiamondRatio: { numerator: 1, denominator: 2 },
        distance: 0.16666666666666663,
        weightedDistance: 0.33333333333333326,
      },
      {
        pair: [0.05, 0.74],
        chordIndexes: [0, 4],
        ratio: { numerator: 0.05, denominator: 0.74 },
        closestDiamondRatio: { numerator: 1, denominator: 2 },
        distance: 0.43243243243243246,
        weightedDistance: 0.8648648648648649,
      },
      {
        pair: [0.17, 0.96],
        chordIndexes: [1, 2],
        ratio: { numerator: 0.17, denominator: 0.96 },
        closestDiamondRatio: { numerator: 1, denominator: 2 },
        distance: 0.32291666666666663,
        weightedDistance: 0.6458333333333333,
      },
      {
        pair: [0.15, 0.17],
        chordIndexes: [1, 3],
        ratio: { numerator: 0.15, denominator: 0.17 },
        closestDiamondRatio: { numerator: 8, denominator: 9 },
        distance: 0.0065359477124183885,
        weightedDistance: 0.058823529411765496,
      },
      {
        pair: [0.17, 0.74],
        chordIndexes: [1, 4],
        ratio: { numerator: 0.17, denominator: 0.74 },
        closestDiamondRatio: { numerator: 1, denominator: 2 },
        distance: 0.2702702702702703,
        weightedDistance: 0.5405405405405406,
      },
      {
        pair: [0.15, 0.96],
        chordIndexes: [2, 3],
        ratio: { numerator: 0.15, denominator: 0.96 },
        closestDiamondRatio: { numerator: 1, denominator: 2 },
        distance: 0.34375,
        weightedDistance: 0.6875,
      },
      {
        pair: [0.74, 0.96],
        chordIndexes: [2, 4],
        ratio: { numerator: 0.74, denominator: 0.96 },
        closestDiamondRatio: { numerator: 7, denominator: 9 },
        distance: 0.00694444444444442,
        weightedDistance: 0.06249999999999978,
      },
      {
        pair: [0.15, 0.74],
        chordIndexes: [3, 4],
        ratio: { numerator: 0.15, denominator: 0.74 },
        closestDiamondRatio: { numerator: 1, denominator: 2 },
        distance: 0.2972972972972973,
        weightedDistance: 0.5945945945945946,
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
