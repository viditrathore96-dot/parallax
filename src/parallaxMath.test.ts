import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeCenterCursor,
  computeLayerTransform,
  computeMainMaxHeight,
  computeMobileLayerHeight,
  filterVistas,
} from './parallaxMath';

test('computeCenterCursor centers coordinates around viewport midpoint', () => {
  const centered = computeCenterCursor(720, 450, 1440, 900);
  assert.equal(centered.xValue, 0);
  assert.equal(centered.yValue, 0);

  const topLeft = computeCenterCursor(0, 0, 1440, 900);
  assert.equal(topLeft.xValue, -720);
  assert.equal(topLeft.yValue, -450);
});

test('computeLayerTransform produces 3D perspective, X/Y/Z translations, and rotateY', () => {
  const transform = computeLayerTransform({
    xValue: 360,
    yValue: -100,
    cursorX: 1080,
    layerLeft: 200,
    innerWidth: 1440,
    speedX: 0.1,
    speedY: 0.1,
    speedZ: 0.5,
    rotation: 0.2,
  });

  assert.match(transform, /^perspective\(2300px\)/);
  assert.match(transform, /translateX\(calc\(-50% \+ -36px\)\)/);
  assert.match(transform, /translateY\(calc\(-50% \+ 10px\)\)/);
  // (1080 - 200) * 0.1 * 0.5 * 1 = 44
  assert.match(transform, /translateZ\(calc\(44\.000px\)\)/);
  // (360 / 720) * 20 * 0.2 = 2deg
  assert.match(transform, /rotateY\(2\.000deg\)/);
});

test('computeLayerTransform flips Z direction sign for right-side layers', () => {
  const rightLayer = computeLayerTransform({
    xValue: 0,
    yValue: 0,
    cursorX: 720,
    layerLeft: 1100,
    innerWidth: 1440,
    speedX: 0.1,
    speedY: 0.1,
    speedZ: 0.5,
    rotation: 0,
  });
  // (720 - 1100) * 0.1 * 0.5 * (-1) = +19
  assert.match(rightLayer, /translateZ\(calc\(19\.000px\)\)/);
});

test('computeMainMaxHeight applies 0.6x desktop and 1.6x mobile aspect rules', () => {
  assert.equal(computeMainMaxHeight(1440), 864);
  assert.equal(computeMainMaxHeight(726), 726 * 0.6);
  assert.equal(computeMainMaxHeight(725), 725 * 1.6);
  assert.equal(computeMainMaxHeight(390), 390 * 1.6);
});

test('computeMobileLayerHeight scales original width by 1.6', () => {
  assert.equal(computeMobileLayerHeight(500), 800);
});

test('filterVistas filters presets case-insensitively', () => {
  assert.equal(filterVistas('').length, 4);
  const east = filterVistas('sunbeam');
  assert.equal(east.length, 1);
  assert.equal(east[0].id, 'right-ridge');
});
