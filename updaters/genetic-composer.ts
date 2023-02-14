import { range } from 'd3-array';
//import { scaleLinear } from 'd3-scale';
import { createProbable as Probable } from 'probable';
import seedrandom from 'seedrandom';
import { ScoreState, ScoreEvent, Riff, RiffStack } from '../types';
import curry from 'lodash.curry';
import cloneDeep from 'lodash.clonedeep';
import {
  getPossibleRelationships,
  compareWorseness,
} from '../tasks/relationships';
import { TonalityDiamond } from '../tonality-diamond';

var { diamondRatios } = TonalityDiamond(11);

export function composeGeneticParts({
  numberOfParts,
  seed,
  tempoFactor,
  // The decimals are a stupid hack to avoid having to change the director's
  // behavior, which only plays new events if the pitch is different from
  // what's already played.
  initialRiff = [1, 0.999, ((16 / 9) * 1) / 2, 6 / 5, 1.001],
  numberOfGenerations = 4,
  numberOfTimesToPlayCullRiff = 3,
  numberOfTimesToPlayGrowRiff = 2,
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
      // 0th generation is just the initial riff in the main voice and rests in the others.
      for (let i = 0; i < numberOfTimesToPlayCullRiff; ++i) {
        gens.push(
          [initialRiff.slice()].concat(
            range(numberOfParts - 1).map(() => initialRiff.map(() => undefined))
          )
        );
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
      gen.forEach(growInRiffHoles);
      for (let i = 0; i < numberOfTimesToPlayGrowRiff; ++i) {
        gens.push(gen.slice());
      }
    }

    return gens;
  }

  function cullPitchesInChordsAcrossRiffstack(riffStack: RiffStack) {
    for (let eventIndex = 0; eventIndex < riffStack[0].length; ++eventIndex) {
      let chord = riffStack.map((riff) => riff[eventIndex]);
      let relationships = getPossibleRelationships({ diamondRatios, chord });
      console.log('relationships', relationships);
      // TODO: Do threshold-based thing instead of top-n?
      relationships.sort(compareWorseness);
      for (let i = 0; i < Math.min(2, relationships.length); ++i) {
        let rel = relationships[i];
        // TODO: Don't cull them if they're "good enough".
        riffStack[rel.chordIndexes[0]][eventIndex] = undefined;
        riffStack[rel.chordIndexes[1]][eventIndex] = undefined;
      }
    }
  }

  function growInRiffHoles(riff: Riff) {
    for (let i = 0; i < riff.length; ++i) {
      const rate = riff[i];
      if (isNaN(rate)) {
        riff[i] = prob.roll(2) + prob.roll(1000) / 1000;
      }
    }
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
