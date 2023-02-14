import RouteState from 'route-state';
import handleError from 'handle-error-web';
import { version } from './package.json';
import ep from 'errorback-promise';
import ContextKeeper from 'audio-context-singleton';
import wireControls from './renderers/wire-controls';
import { Ticker } from './updaters/ticker';
import { SampleDownloader } from './tasks/sample-downloader';
import RandomId from '@jimkang/randomid';
import { ScoreDirector } from './updaters/score-director';
import {
  defaultSecondsPerTick,
  sampleFilenames,
  ticksPerRiff,
  repeatsPerRiff,
} from './consts';
import { composeGeneticParts } from './updaters/genetic-composer';
import { renderEventDirection } from './renderers/render-event-direction';
import { ScoreState } from './types';
import { MainOut } from './updaters/main-out';

var randomId = RandomId();
var routeState;
var { getCurrentContext } = ContextKeeper();
var ticker;
var sampleDownloader;
var mainScoreDirector;

(async function go() {
  window.onerror = reportTopLevelError;
  renderVersion();

  routeState = RouteState({
    followRoute,
    windowObject: window,
  });
  routeState.routeFromHash();
})();

async function followRoute({
  seed,
  genCount = 100,
  tempoFactor = defaultSecondsPerTick,
  startTick = 0,
  sampleIndex = 0,
}) {
  if (!seed) {
    routeState.addToRoute({ seed: randomId(8) });
    return;
  }

  const totalTicks = genCount * ticksPerRiff * repeatsPerRiff;

  var { error, values } = await ep(getCurrentContext);
  if (error) {
    handleError(error);
    return;
  }

  var ctx = values[0];
  var mainGroupScoreStateObjects: ScoreState[] = composeGeneticParts({
    numberOfParts: 5,
    seed,
    tempoFactor,
    numberOfGenerations: genCount,
  });
  console.log('mainGroupScoreStateObjects:', mainGroupScoreStateObjects);
  const totalSeconds = mainGroupScoreStateObjects.reduce(
    (total, direction) => total + direction.tickLength,
    0
  );
  console.log('totalTime in minutes', totalSeconds / 60);
  var firstBadEventDirection = mainGroupScoreStateObjects.find(
    (state) => !state.events.some((e) => !e.delay) || state.tickLength <= 0
  );
  if (firstBadEventDirection) {
    throw new Error(
      `Event direction is bad: ${JSON.stringify(
        firstBadEventDirection,
        null,
        2
      )}`
    );
  }

  var mainOutNode = MainOut({ ctx, totalSeconds });

  ticker = Ticker({
    onTick,
    startTick,
    getTickLength,
    totalTicks,
    onPause: null,
    onResume: null,
  });

  sampleDownloader = SampleDownloader({
    sampleFiles: sampleFilenames,
    localMode: true,
    onComplete,
    handleError,
  });
  sampleDownloader.startDownloads();

  // TODO: Test non-locally.
  function onComplete({ buffers }) {
    mainScoreDirector = ScoreDirector({
      directorName: 'main',
      ctx,
      sampleBuffer: buffers[sampleIndex],
      mainOutNode,
      constantEnvelopeLength: 1.0,
      envelopeCurve: new Float32Array([0, 0.5, 1]),
      fadeLengthFactor: 2,
    });

    wireControls({
      onStart,
      onPieceLengthChange,
      onTempoFactorChange,
      totalTicks,
      tempoFactor,
    });
  }

  function onTick({ ticks, currentTickLengthSeconds }) {
    console.log(ticks, currentTickLengthSeconds);
    //var chord = director.getChord({ ticks });
    var mainGroupScoreState = mainGroupScoreStateObjects[ticks];

    var tickLength = currentTickLengthSeconds;
    if (!isNaN(mainGroupScoreState.tickLength)) {
      tickLength = mainGroupScoreState.tickLength;
    }
    renderEventDirection({
      tickIndex: ticks,
      tickLength,
      chordSize: mainGroupScoreState?.meta?.chordPitchCount,
    });

    mainScoreDirector.play(
      Object.assign({ tickLengthSeconds: tickLength }, mainGroupScoreState)
    );
  }

  function getTickLength(ticks) {
    if (ticks < mainGroupScoreStateObjects.length) {
      var tickLength = mainGroupScoreStateObjects[ticks].tickLength;
      if (!isNaN(tickLength)) {
        return tickLength;
      }
    }
    //return director.getTickLength(ticks);
  }

  function onPieceLengthChange(length) {
    routeState.addToRoute({ totalTicks: length });
  }

  function onTempoFactorChange(length) {
    routeState.addToRoute({ tempoFactor: length });
  }
}

function reportTopLevelError(msg, url, lineNo, columnNo, error) {
  handleError(error);
}

function renderVersion() {
  var versionInfo = document.getElementById('version-info');
  versionInfo.textContent = version;
}

// Responders

function onStart() {
  ticker.resume();
}
