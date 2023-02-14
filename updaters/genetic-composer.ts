import { range } from 'd3-array';
//import { scaleLinear } from 'd3-scale';
import { createProbable as Probable } from 'probable';
import seedrandom from 'seedrandom';
import { ScoreState, ScoreEvent, Riff, RiffStack } from '../types';
import curry from 'lodash.curry';
import cloneDeep from 'lodash.clonedeep';
import {
  getPossibleRelationships,
  compareGoodness,
} from '../tasks/relationships';
import { TonalityDiamond } from '../tonality-diamond';

var selectionDiamond = TonalityDiamond(6);
var guideDiamond = TonalityDiamond(5);

export function composeGeneticParts({
  numberOfParts,
  seed,
  tempoFactor,
  //initialRiff = [1, 1, ((16 / 9) * 1) / 2, 6 / 5, 1],
  numberOfGenerations = 4,
  numberOfTimesToPlayCullRiff = 2,
  numberOfGrowRiffsPerGrowthPeriodRiff = 2,
}): ScoreState[] {
  var random = seedrandom(seed);
  var prob = Probable({ random });

  var riffStacks = range(numberOfGenerations).reduce(
    getNextGenerationOfRiffs,
    []
  );

  return riffStacks.map(getStatesForRiffStack).flat();

  function getNextGenerationOfRiffs(
    gens: RiffStack[],
    genIndex: number
  ): RiffStack[] {
    const prevIndex = gens.length - 1;
    const cull = genIndex % 2 === 0;

    if (prevIndex < 0) {
      for (let i = 0; i < numberOfTimesToPlayCullRiff; ++i) {
        gens.push(range(numberOfParts).map(() => growNewRiff(5)));
      }
      return gens;
    }

    var prevGenInstance = gens[prevIndex];
    var gen = cloneDeep(prevGenInstance);

    if (cull) {
      cullPitchesInChordsAcrossRiffstack(gen);
      for (let i = 0; i < numberOfTimesToPlayCullRiff; ++i) {
        gens.push(gen.slice());
      }
    } else {
      for (let i = 0; i < numberOfGrowRiffsPerGrowthPeriodRiff; ++i) {
        gen = gen.slice();
        if (genIndex % 4 === 0) {
          const changeFactor = prob.pick(guideDiamond.tonalityDiamondPitches);
          if (prob.roll(2) === 0) {
            gen[0] = gen[0].map((pitch) => pitch / changeFactor);
          } else {
            gen[0] = gen[0].map((pitch) => pitch * changeFactor);
          }
        }
        gen.forEach(growInRiffHoles);
        //gen.push(growNewRiff(gen[0].length));
        gens.push(gen);
      }
    }

    return gens;
  }

  function cullPitchesInChordsAcrossRiffstack(riffStack: RiffStack) {
    for (let eventIndex = 0; eventIndex < riffStack[0].length; ++eventIndex) {
      let chord = riffStack.map((riff) => riff[eventIndex]);
      let relationships = getPossibleRelationships({
        diamondRatios: guideDiamond.diamondRatios,
        chord,
        //filterPitchIndex: 0, // Only consider relationships with the root.
      });
      console.log('relationships', relationships);
      let goodRelationships = relationships.filter(
        (rel) => rel.weightedDistance < 0.3
      );
      let goodIndexes = [];
      if (goodRelationships.length > 0) {
        let bestRelationship = goodRelationships.sort(compareGoodness)[0];
        //console.log('bestRelationship', bestRelationship);
        goodIndexes = goodIndexes.concat(bestRelationship.chordIndexes);
      }
      for (let stackIndex = 0; stackIndex < riffStack.length; ++stackIndex) {
        if (goodIndexes.includes(stackIndex)) {
          continue;
        }
        riffStack[stackIndex][eventIndex] = undefined;
      }
    }
  }

  function growInRiffHoles(riff: Riff) {
    for (let i = 0; i < riff.length; ++i) {
      const rate = riff[i];
      if (
        isNaN(rate) &&
        prob.roll(numberOfGrowRiffsPerGrowthPeriodRiff) === 0
      ) {
        //riff[i] = prob.roll(2) + prob.roll(1000) / 1000;
        riff[i] = prob.pick(selectionDiamond.tonalityDiamondPitches);
      }
    }
  }

  function growNewRiff(len): Riff {
    return range(len).map(() =>
      prob.pick(selectionDiamond.tonalityDiamondPitches)
    );
  }

  function getStatesForRiffStack(riffStack: RiffStack): ScoreState[] {
    var states: ScoreState[] = range(riffStack.length).map((eventIndex) => {
      let state: ScoreState = {
        events: riffStack.map(curry(getEventFromRiff)(eventIndex)),
        tickIndex: eventIndex,
        tickLength: tempoFactor * 1,
      };
      return state;
    });
    // Add a pause at the end of each riff.
    states.push({
      events: riffStack.map(() => ({
        rest: true,
        rate: 1,
        delay: 0,
        peakGain: 0,
      })),
      tickIndex: 0,
      tickLength: tempoFactor * 1,
    });
    return states;
  }

  function getEventFromRiff(eventIndex, riff, riffIndex, riffs): ScoreEvent {
    const rate = riff[eventIndex];
    if (isNaN(rate)) {
      return {
        rest: true,
        rate: 1,
        delay: 0,
        peakGain: 0,
      };
    }
    return {
      rate,
      delay: 0,
      peakGain: 1,
      pan:
        riffIndex === 0 ? 0 : ((riffIndex - 1) / (riffs.length - 2)) * 2.0 - 1,
    };
  }
}
