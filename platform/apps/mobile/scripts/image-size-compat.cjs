const fs = require('fs');
const Module = require('module');

// Metro 0.80 calls require('image-size') as a function and may pass a file
// path. image-size 2 exports { imageSize } and accepts bytes only. The
// workspace pins image-size 2 for the advisory fix.
const originalRequire = Module.prototype.require;

Module.prototype.require = function (id) {
  const exported = originalRequire.apply(this, arguments);
  if (
    id !== 'image-size' ||
    typeof exported === 'function' ||
    typeof exported?.imageSize !== 'function'
  ) {
    return exported;
  }

  const imageSize = exported.imageSize;
  function getImageSize(input) {
    const data = typeof input === 'string' ? fs.readFileSync(input) : input;
    return imageSize(data);
  }

  return Object.assign(getImageSize, exported);
};
