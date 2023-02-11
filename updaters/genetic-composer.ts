import { tonalityDiamondPitches } from '../tonality-diamond';
import { range } from 'd3-array';
//import { scaleLinear } from 'd3-scale';
import { createProbable as Probable } from 'probable';
import seedrandom from 'seedrandom';
import { ScoreState, ScoreEvent } from '../types';
import curry from 'lodash.curry';

export function composeGeneticParts({
  numberOfParts,
  seed,
  tempoFactor,
  initialRiff = [1, 1, ((16 / 9) * 1) / 2, 6 / 5, 1],
}): ScoreState[] {
  var riffs = range(numberOfParts).map(() => initialRiff.slice());
  var states: ScoreState[] = [];
  for (let eventIndex = 0; eventIndex < riffs[0].length; ++eventIndex) {
    states.push({
      events: riffs.map(curry(getEventFromRiff)(eventIndex)),
      tickIndex: eventIndex,
      tickLength: tempoFactor * 1,
    });
  }

  return states;

  function getEventFromRiff(eventIndex, riff, riffIndex, riffs): ScoreEvent {
    return {
      rate: riff[eventIndex],
      delay: 0,
      peakGain: 1,
      pan:
        riffIndex === 0 ? 0 : ((riffIndex - 1) / (riffs.length - 2)) * 2.0 - 1,
    };
  }
}
