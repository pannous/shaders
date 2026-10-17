# load_wavefront_obj

A plain WebGL demo: a textured Wavefront .obj model (f16-model.obj, f16-texture.bmp, not included) spun in a
canvas. `webgl.js` and `webgl.html` bundle by hand:

- [wavefront-obj-parser](https://github.com/chinedufn/wavefront-obj-parser) and
  [load-wavefront-obj](https://github.com/chinedufn/load-wavefront-obj) by Chinedu Francis Nwafili, MIT
- the mat3/mat4 functions of [gl-mat4](https://github.com/stackgl/gl-mat4) / [gl-mat3](https://github.com/stackgl/gl-mat3)
  (stackgl, after gl-matrix by Brandon Jones and Colin MacKenzie IV), zlib/MIT

Serve the folder over HTTP (browsers refuse local files): `python3 -m http.server`.
