# GLSL Shaders Collection

Advanced fragment shaders for fractal rendering and visual effects, compatible with Vulkan/SPIR-V.

## Mandelbrot Shaders

### mandelbrot_simple.frag
Basic Mandelbrot set with clean, educational code:
- Manual zoom and pan controls
- Zoom-at-cursor (fixed point)
- Drag-and-drop panning
- Simple rainbow coloring

**Best for:** Learning, testing, quick exploration

### mandelbrot_autozoom.frag
Automatic zooming Mandelbrot with smooth mouse tracking:
- Continuous auto-zoom over time
- Mouse-smoothed zoom focal point
- Reference mouse system (no drift)
- Works up to ~77s (zoom ~100,000x)

**Best for:** Demonstrations, watching the fractal evolve

### mandelbrot_advanced.frag ⭐ Recommended
High-quality renderer with modern techniques:
- Smooth/continuous coloring (no banding)
- Distance estimation for sharp edges
- Adaptive iteration count (100-2000)
- 2x2 anti-aliasing
- Interior detection optimization
- Zoom-at-cursor with reference mouse

**Best for:** High-quality exploration, deep zooms

### mandelbrot_perturbation.frag
Experimental renderer with advanced optimizations:
- Perturbation theory hints
- Orbit trap coloring
- Period detection
- Stratified anti-aliasing (adaptive 1x-4x)
- Multiple color palette modes

**Best for:** Research, extreme zooms, experimental rendering

### mandelbrot_autozoom_f64.frag
Double precision variant (requires fp64 support):
- **NOT compatible with macOS/Metal/MoltenVK**
- Extends precision to zoom levels beyond 1e15
- For Linux/Windows with native Vulkan + fp64 GPU

## Visual Effects

### clouds_bookofshaders.glsl
Animated cloud rendering using fractal Brownian motion (fbm).

### crystalline_vortex.frag / crystalline_bubbles.frag
Complex visual effects with particle-like systems.

### bumped_sinusoidal_nice.frag
Smooth sinusoidal warping effects.

## Controls (Standard for Mandelbrot shaders)

- **Scroll wheel** - Zoom in/out
- **+/= key** - Zoom in
- **- key** - Zoom out
- **R key** - Reset zoom and pan
- **Left click + drag** - Pan the view
- **Mouse position** - Zoom focal point (smoothed)

## Technical Details

### Uniform Buffer (UBO)
All shaders use this standard interface:
```glsl
layout(binding = 0) uniform UniformBufferObject {
    vec3 iResolution;     // Viewport resolution
    float iTime;          // Time in seconds
    vec4 iMouse;          // Mouse state (xy=pos, zw=click)
    vec2 iScroll;         // Scroll offset / reference mouse X
    float iButtonLeft;    // Reference mouse Y
    float iButtonRight;   // Button durations
    float iButtonMiddle;
    float iButton4;
    float iButton5;
    vec2 iPan;           // Pan offset in pixels
} ubo;
```

### Zoom Formulas

**Manual zoom** (simple, advanced, perturbation):
```glsl
float zoom = sqrt(exp(ubo.iScroll.y * 0.1));
```

**Auto-zoom** (autozoom):
```glsl
float effectiveTime = ubo.iTime - ubo.iScroll.y;
float zoom = exp(effectiveTime * 0.15);
```

### Zoom-at-Cursor (Fixed Point)

Uses reference mouse to prevent drift:
```glsl
vec2 referenceMouse = vec2(ubo.iScroll.x, ubo.iButtonLeft);
vec2 deltaMouse = mouse - referenceMouse;
center += (deltaMouse + (referenceMouse - 0.5)) * 3.0 * (zoom - 1.0) / zoom;
```

## Compilation

Compile to SPIR-V for Vulkan:
```bash
glslangValidator -V shader.frag -o shader.frag.spv
```

## Viewers

Compatible with:
- [metalshader](https://github.com/pannous/metalshader) - Rust/Vulkan viewer (macOS)
- [metalshade](https://github.com/pannous/metalshade) - C++/Vulkan viewer (cross-platform)

## References

- [Distance Estimation](https://iquilezles.org/articles/distancefractals/)
- [Smooth Coloring](https://linas.org/art-gallery/escape/smooth.html)
- [Color Palettes](https://iquilezles.org/articles/palettes/)
- [The Book of Shaders](https://thebookofshaders.com/)

## License

Public domain / CC0 - use freely

## Running shaders with warp

[warp](https://github.com/pannous/warp) runs single-pass [compute.toys](https://compute.toys) shaders as they are:
`compute_toy(shader { … })` of `use compute_toys` takes a WGSL kernel `main_image` that ends in
`textureStore(screen, id.xy, color)` and paints it every frame (natively in a window, in the
[playground](https://wasp.pannous.com/) on the canvas).

```bash
warp warp/compute_toys/singularity.warp
```

| file | shader | author |
|---|---|---|
| warp/compute_toys/balatro.warp | [Balatro](https://compute.toys/view/2087) | Matchew123 |
| warp/compute_toys/cyber_fuji.warp | [Cyber Fuji 2020 [port]](https://compute.toys/view/1396) | quilde, after kaiware007 |
| warp/compute_toys/dandelion.warp | [Dandelion](https://compute.toys/view/503) | munrocket |
| warp/compute_toys/fiddling_rings.warp | [fiddling around](https://compute.toys/view/1319) | jonasfrey |
| warp/compute_toys/kuko175_pumpkins.warp | [KuKo #175](https://compute.toys/view/2608) | kukovisuals |
| warp/compute_toys/singularity.warp | [Singularity](https://compute.toys/view/2266) | Xor |
| warp/compute_toys/solar.warp | [Solar (Fork from Xor)](https://compute.toys/view/2152) | alph13, after Xor |
| warp/compute_toys/wormhole.warp | [Wormhole](https://compute.toys/view/2111) | Matchew123 |

Each file starts with the shader's title, author, source URL and license as far as known. These shaders moved
here from the warp repository, which is AGPL-3.0 and ships only shaders of its own.

`webgl/load_wavefront_obj/` is a plain WebGL demo of a textured .obj model, bundled from Chinedu Francis Nwafili's
MIT-licensed npm packages (see its README).

## License

Nothing here is relicensed: each shader keeps its author's license. See [LICENSE.md](LICENSE.md).
