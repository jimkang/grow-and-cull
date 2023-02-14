import { tonalityDiamondPitches } from '../tonality-diamond';
import { range } from 'd3-array';
//import { scaleLinear } from 'd3-scale';
import { createProbable as Probable } from 'probable';
import seedrandom from 'seedrandom';
import {
  ScoreState,
  ScoreEvent,
  Riff,
  RiffStack,
  Relationship,
} from '../types';
import curry from 'lodash.curry';
import cloneDeep from 'lodash.clonedeep';

export function composeGeneticParts({
  numberOfParts,
  seed,
  tempoFactor,
  initialRiff = [1, 1, ((16 / 9) * 1) / 2, 6 / 5, 1],
  numberOfGenerations = 4,
}): ScoreState[] {
  var prob = Probable({ random: seedrandom(seed) });

  var riffStacks = range(numberOfGenerations).reduce(
    getNextGenerationOfRiffs,
    []
  );

  return riffStacks.map(getStatesForRiffStack).flat();

  function getNextGenerationOfRiffs(
    gens: RiffStack[],
    genIndex: number
  ): RiffStack[] {
    const prevIndex = genIndex - 1;
    const cull = genIndex % 2 === 0;
    if (prevIndex < 0) {
      // 0th generation is just the initial riff in the main voice and rests in the others.
      return [
        [initialRiff].concat(
          range(numberOfParts - 1).map(() => initialRiff.map(() => undefined))
        ),
      ];
    }

    var prevGen = gens[prevIndex];
    var gen = cloneDeep(prevGen);

    if (cull) {
      cullPitchesInChordsAcrossRiffstack(gen);
    } else {
      gen.forEach(growInRiffHoles);
    }

    gens.push(gen);
    return gens;
  }

  function cullPitchesInChordsAcrossRiffstack(riffStack: RiffStack) {
    for (let eventIndex = 0; eventIndex < riffStack[0].length; ++eventIndex) {
      let chord = riffStack.map((riff) => riff[eventIndex]);
      let relationships = getPossibleRelationships(chord);
      console.log('relationships', relationships);
      // TODO: Do threshold-based thing instead of top-n?
      //relationships.sort(comparePlatonicness);
      //bestRelationship = relationships[0];
      //bestRelationship.sort(compareOffness);
      //for (let i = 0; i < 2; i++) {
      //// TODO: Don't cull them if they're "good enough".
      //riffStack[bestRelationship[i].chordIndex][eventIndex] = undefined;
      //}
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
    return range(riffStack.length).map((eventIndex) => ({
      events: riffStack.map(curry(getEventFromRiff)(eventIndex)),
      tickIndex: eventIndex,
      tickLength: tempoFactor * 1,
    }));
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
