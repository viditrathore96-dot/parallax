export interface LayerTransformInput {
  xValue: number;
  yValue: number;
  cursorX: number;
  layerLeft: number;
  innerWidth: number;
  speedX: number;
  speedY: number;
  speedZ: number;
  rotation: number;
}

export interface VistaPreset {
  id: string;
  name: string;
  elevation: string;
  xOffsetRatio: number;
  yOffsetRatio: number;
}

export const VISTA_PRESETS: VistaPreset[] = [
  {
    id: 'center',
    name: 'Center Horizon',
    elevation: '1,210 m',
    xOffsetRatio: 0,
    yOffsetRatio: 0,
  },
  {
    id: 'left-ridge',
    name: 'West Monolith Ridge',
    elevation: '1,480 m',
    xOffsetRatio: -0.35,
    yOffsetRatio: -0.18,
  },
  {
    id: 'right-ridge',
    name: 'East Sunbeam Cliff',
    elevation: '1,390 m',
    xOffsetRatio: 0.35,
    yOffsetRatio: -0.22,
  },
  {
    id: 'canopy',
    name: 'Deep Valley Canopy',
    elevation: '980 m',
    xOffsetRatio: 0.12,
    yOffsetRatio: 0.3,
  },
];

export function computeCenterCursor(
  clientX: number,
  clientY: number,
  innerWidth: number,
  innerHeight: number,
): { xValue: number; yValue: number } {
  return {
    xValue: clientX - innerWidth / 2,
    yValue: clientY - innerHeight / 2,
  };
}

export function computeLayerTransform(input: LayerTransformInput): string {
  const {
    xValue,
    yValue,
    cursorX,
    layerLeft,
    innerWidth,
    speedX,
    speedY,
    speedZ,
    rotation,
  } = input;

  const isInLeft = layerLeft < innerWidth / 2 ? 1 : -1;
  const zValue = (cursorX - layerLeft) * 0.1 * speedZ * isInLeft;
  const rotateDegree = innerWidth > 0 ? (xValue / (innerWidth / 2)) * 20 : 0;

  const translateX = `calc(-50% + ${-xValue * speedX}px)`;
  const translateY = `calc(-50% + ${yValue * speedY * -1}px)`;
  const translateZ = `calc(${zValue.toFixed(3)}px)`;
  const rotateY = `rotateY(${(rotateDegree * rotation).toFixed(3)}deg)`;

  return `perspective(2300px) translateX(${translateX}) translateY(${translateY}) translateZ(${translateZ}) ${rotateY}`;
}

export function computeMainMaxHeight(innerWidth: number): number {
  if (innerWidth > 725) {
    return innerWidth * 0.6;
  }
  return innerWidth * 1.6;
}

export function computeMobileLayerHeight(layerOriginalWidth: number): number {
  return layerOriginalWidth * 1.6;
}

export function filterVistas(query: string): VistaPreset[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return VISTA_PRESETS;
  }
  return VISTA_PRESETS.filter(
    (vista) =>
      vista.name.toLowerCase().includes(normalized) ||
      vista.elevation.toLowerCase().includes(normalized),
  );
}
