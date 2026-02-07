#version 450
#extension GL_ARB_gpu_shader_fp64 : enable

layout(location = 0) in vec2 fragCoord;
layout(location = 0) out vec4 fragColor;

layout(binding = 0) uniform UniformBufferObject {
    vec3 iResolution;
    float iTime;
    vec4 iMouse;
    vec2 iScroll;
    float iButtonLeft;
    float iButtonRight;
    float iButtonMiddle;
    float iButton4;
    float iButton5;
    vec2 iPan;
} ubo;

layout(binding = 1) uniform sampler2D iChannel0;
layout(binding = 2) uniform sampler2D iChannel1;

/*
    Auto-Zoom Mandelbrot Set (Double Precision)
    -------------------------------------------

    ⚠️ IMPORTANT: This shader requires GL_ARB_gpu_shader_fp64 support,
    which is NOT available on macOS/Metal/MoltenVK. This shader will
    fail to load on macOS systems. Use mandelbrot_autozoom.frag instead.

    For Linux/Windows with native Vulkan and fp64 GPU support, this
    extends precision to handle extreme zoom levels (1e15+).

    Automatically zooms into the Mandelbrot set continuously over time,
    centering the zoom on the current mouse cursor position.

    Controls:
    - Move mouse: Changes the zoom focal point
    - Space bar: Pause/unpause auto-zoom (TODO)
    - R key: Reset to start

    Watch as it zooms deeper and deeper into the fractal!
*/

const int MAX_ITERATIONS = 100;
const float ESCAPE_RADIUS = 2.0;

// Zoom speed - adjust this to zoom faster or slower
const float ZOOM_SPEED = 0.15;  // 0.15 = gentle, 0.3 = fast

void main() {
    vec2 uv = fragCoord / ubo.iResolution.xy;

    // Mouse position (normalized)
    vec2 mouse = ubo.iMouse.xy / ubo.iResolution.xy;

    // Auto-zoom: exponentially increase zoom over time
    // Calculate zoom as float first (exp only works on float in GLSL)
    // Use iScroll.y as time offset (set by R key reset)
    float effectiveTime = ubo.iTime - ubo.iScroll.y;
    float zoom_f = exp(effectiveTime * ZOOM_SPEED);
    zoom_f = clamp(zoom_f, 0.01, 1e10);

    // Convert to double for high-precision complex plane calculations
    double zoom = double(zoom_f);

    // Default center (interesting part of Mandelbrot set) - use double precision
    dvec2 center = dvec2(-0.5lf, 0.0lf);

    // Zoom toward cursor using RELATIVE movement to avoid jumps at high zoom
    // Reference mouse position (where mouse was at reset) stored in uniforms
    vec2 referenceMouse = vec2(ubo.iScroll.x, ubo.iButtonLeft);

    // Calculate relative mouse movement from reference
    vec2 deltaMouse = mouse - referenceMouse;

    // Adjust center based on relative movement
    // At zoom=1: no adjustment. At high zoom: small mouse movements cause proportional shifts
    double aspect = double(ubo.iResolution.x) / double(ubo.iResolution.y);

    center.x += double(deltaMouse.x + (referenceMouse.x - 0.5)) * 3.0lf * (zoom - 1.0lf) / zoom;
    center.y += double(deltaMouse.y + (referenceMouse.y - 0.5)) * 3.0lf * (zoom - 1.0lf) / zoom;

    // Add drag-pan offset (iPan is in pixels, convert to complex-plane coordinates)
    dvec2 panNormalized = dvec2(ubo.iPan) / dvec2(ubo.iResolution.xy);
    center.x -= panNormalized.x * 3.0lf / zoom * aspect;
    center.y -= panNormalized.y * 3.0lf / zoom;

    // Convert screen coordinates to complex plane (double precision)
    dvec2 c;
    c.x = double(uv.x - 0.5) * 3.0lf / zoom + center.x;
    c.y = double(uv.y - 0.5) * 3.0lf / zoom + center.y;

    // Adjust aspect ratio
    c.x *= aspect;

    // === MANDELBROT ITERATION (double precision) ===

    dvec2 z = dvec2(0.0lf, 0.0lf);
    int iterations = 0;

    for (int i = 0; i < MAX_ITERATIONS; i++) {
        double z_real = z.x * z.x - z.y * z.y;
        double z_imag = 2.0lf * z.x * z.y;

        z.x = z_real + c.x;
        z.y = z_imag + c.y;

        double magnitude = length(z);
        if (magnitude > double(ESCAPE_RADIUS)) {
            break;
        }

        iterations++;
    }

    // === COLORING ===

    vec3 color;

    if (iterations == MAX_ITERATIONS) {
        color = vec3(0.0, 0.0, 0.0);
    } else {
        float t = float(iterations) / float(MAX_ITERATIONS);

        // Animated colors that shift over time
        color = 0.5 + 0.5 * cos(3.0 + t * 12.0 + ubo.iTime * 0.5 + vec3(0.0, 0.5, 1.0));
        color = pow(color, vec3(0.8));
    }

    // Subtle pulse to indicate it's alive
    float pulse = sin(ubo.iTime * 3.0) * 0.05 + 0.95;
    color *= pulse;

    fragColor = vec4(color, 1.0);
}
