import { SynthNode } from './synths/synth-node';

export interface ScoreState {
  events: ScoreEvent[];
  tickIndex: number;
  tickLength: number;
  meta?: EventMetadata;
}

export interface Loop {
  loopStartSeconds: number;
  loopEndSeconds: number;
}

export interface ScoreEvent {
  rate: number;
  delay: number;
  peakGain: number;
  pan?: number;
  fadeLength?: number;

  // By default, it is assumed that ScoreEvent will always be using the same sample.
  // variableSampleIndex allows the specification of different samples per event.
  variableSampleIndex?: number;
  loop?: Loop;
  meta?: EventMetadata;
  rest?: boolean;
  id?: string;
}

export interface EventMetadata {
  chordPitchCount?: number;
  sourceDatum?;
}

export interface PlayEvent {
  scoreEvent: ScoreEvent;
  nodes: SynthNode[];
  started: boolean;
  rest?: boolean;
}

export type Riff = number[];
export type RiffStack = Riff[];

export interface Ratio {
  numerator: number;
  denominator: number;
}

export interface Relationship {
  pair: number[];
  chordIndexes: number[];
  ratio: Ratio;
  closestDiamondRatio: Ratio;
  distance: number;
  weightedDistance: number;
}
