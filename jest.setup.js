import '@testing-library/jest-dom';

// Mock requestAnimationFrame for game loop tests
global.requestAnimationFrame = (callback) => {
  return setTimeout(() => callback(performance.now()), 16);
};

global.cancelAnimationFrame = (id) => {
  clearTimeout(id);
};

// Mock performance.now if not available
if (typeof performance === 'undefined') {
  global.performance = {
    now: () => Date.now(),
  };
}

// Mock HTMLCanvasElement.getContext for jsdom
HTMLCanvasElement.prototype.getContext = function(contextType) {
  if (contextType === '2d') {
    return {
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 1,
      font: '10px sans-serif',
      textAlign: 'start',
      textBaseline: 'alphabetic',
      globalAlpha: 1,
      globalCompositeOperation: 'source-over',
      imageSmoothingEnabled: true,
      fillRect: jest.fn(),
      clearRect: jest.fn(),
      strokeRect: jest.fn(),
      fillText: jest.fn(),
      strokeText: jest.fn(),
      measureText: jest.fn(() => ({ width: 0 })),
      beginPath: jest.fn(),
      closePath: jest.fn(),
      moveTo: jest.fn(),
      lineTo: jest.fn(),
      arc: jest.fn(),
      arcTo: jest.fn(),
      bezierCurveTo: jest.fn(),
      quadraticCurveTo: jest.fn(),
      rect: jest.fn(),
      fill: jest.fn(),
      stroke: jest.fn(),
      clip: jest.fn(),
      save: jest.fn(),
      restore: jest.fn(),
      scale: jest.fn(),
      rotate: jest.fn(),
      translate: jest.fn(),
      transform: jest.fn(),
      setTransform: jest.fn(),
      resetTransform: jest.fn(),
      drawImage: jest.fn(),
      createLinearGradient: jest.fn(() => ({
        addColorStop: jest.fn(),
      })),
      createRadialGradient: jest.fn(() => ({
        addColorStop: jest.fn(),
      })),
      createPattern: jest.fn(),
      getImageData: jest.fn(() => ({
        data: new Uint8ClampedArray(4),
        width: 1,
        height: 1,
      })),
      putImageData: jest.fn(),
      createImageData: jest.fn(() => ({
        data: new Uint8ClampedArray(4),
        width: 1,
        height: 1,
      })),
      setLineDash: jest.fn(),
      getLineDash: jest.fn(() => []),
      ellipse: jest.fn(),
      roundRect: jest.fn(),
      canvas: this,
    };
  }
  return null;
};
