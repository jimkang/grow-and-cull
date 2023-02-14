import { Relationship, Ratio } from '../types';
import { factorDown } from './factors';
import curry from 'lodash.curry';

export function getPossibleRelationships({
  diamondRatios,
  chord,
}: {
  diamondRatios: Ratio[];
  chord: number[];
}): Relationship[] {
  return chord.reduce(addRelationships, []);

  function addRelationships(
    rels: Relationship[],
    pitch: number,
    pitchIndex: number
  ) {
    for (let i = pitchIndex + 1; i < chord.length; ++i) {
      const otherPitch = chord[i];
      let pair = [pitch, otherPitch].sort(compareNumbers);
      let ratioObj = factorDown({ numerator: pair[0], denominator: pair[1] });
      let { closestDiamondRatio, distance, weightedDistance } =
        diamondRatios.reduce(curry(compareRatio)(ratioObj), {
          closestDiamondRatio: { numerator: Infinity, denominator: Infinity },
          distance: Infinity,
          weightedDistance: Infinity,
        });

      let rel: Relationship = {
        pair,
        chordIndexes: [pitchIndex, i],
        ratio: ratioObj,
        closestDiamondRatio,
        distance,
        weightedDistance,
      };
      rels.push(rel);
    }

    return rels;
  }
}

function compareNumbers(a, b) {
  return a < b ? -1 : 1;
}

function compareRatio(
  ratio: Ratio,
  { closestDiamondRatio, distance, weightedDistance },
  diamondRatio: Ratio
) {
  const diamondRatioSingleNumber = ratioToSingleNumber(diamondRatio);
  var currentDistance = Math.abs(
    ratioToSingleNumber(ratio) - diamondRatioSingleNumber
  );
  const inverseDistance = Math.abs(
    ratioToSingleNumber(invertRatio(ratio)) - diamondRatioSingleNumber
  );
  if (inverseDistance < currentDistance) {
    currentDistance = inverseDistance;
  }
  //console.log(
  //'ratio',
  //ratio,
  //'closestDiamondRatio',
  //closestDiamondRatio,
  //'distance',
  //distance,
  //'inverseDistance',
  //inverseDistance,
  //'currentDistance',
  //currentDistance,
  //'diamondRatio',
  //diamondRatio
  //);
  if (currentDistance < distance) {
    return {
      closestDiamondRatio: diamondRatio,
      distance: currentDistance,
      weightedDistance: currentDistance * diamondRatio.denominator,
    };
  }
  return { closestDiamondRatio, distance, weightedDistance };
}

function ratioToSingleNumber(ratio: Ratio): number {
  return ratio.numerator / ratio.denominator;
}

function invertRatio(ratio: Ratio): Ratio {
  return { numerator: ratio.denominator, denominator: ratio.numerator };
}

export function compareWorseness(a: Relationship, b: Relationship) {
  if (a.weightedDistance > b.weightedDistance) {
    return -1;
  }
  return 1;
}
