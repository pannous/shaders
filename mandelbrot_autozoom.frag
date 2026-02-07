#version 450

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
    Auto-Zoom Mandelbrot Set
    ------------------------

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
    // Use iScroll.y as time offset (set by R key reset)
    float effectiveTime = ubo.iTime - ubo.iScroll.y;
    float zoom = exp(effectiveTime * ZOOM_SPEED);
    zoom = clamp(zoom, 0.01, 1e10);

    // Default center (interesting part of Mandelbrot set)
    vec2 center = vec2(-0.5, 0.0);

    // Zoom toward cursor using RELATIVE movement to avoid jumps at high zoom
    // Reference mouse position (where mouse was at reset) stored in uniforms
    vec2 referenceMouse = vec2(ubo.iScroll.x, ubo.iButtonLeft);

    // Calculate relative mouse movement from reference
    vec2 deltaMouse = mouse - referenceMouse;

    // Adjust center based on relative movement
    // At zoom=1: no adjustment. At high zoom: small mouse movements cause proportional shifts
    float aspect = ubo.iResolution.x / ubo.iResolution.y;

    center.x += (deltaMouse.x + (referenceMouse.x - 0.5)) * 3.0 * (zoom - 1.0) / zoom;
    center.y += (deltaMouse.y + (referenceMouse.y - 0.5)) * 3.0 * (zoom - 1.0) / zoom;

    // Add drag-pan offset (iPan is in pixels, convert to complex-plane coordinates)
    vec2 panNormalized = ubo.iPan / ubo.iResolution.xy;
    center.x -= panNormalized.x * 3.0 / zoom * aspect;
    center.y -= panNormalized.y * 3.0 / zoom;

    // Convert screen coordinates to complex plane
    vec2 c;
    c.x = (uv.x - 0.5) * 3.0 / zoom + center.x;
    c.y = (uv.y - 0.5) * 3.0 / zoom + center.y;

    // Adjust aspect ratio
    c.x *= aspect;

    // === MANDELBROT ITERATION ===

    vec2 z = vec2(0.0, 0.0);
    int iterations = 0;

    for (int i = 0; i < MAX_ITERATIONS; i++) {
        float z_real = z.x * z.x - z.y * z.y;
        float z_imag = 2.0 * z.x * z.y;

        z.x = z_real + c.x;
        z.y = z_imag + c.y;

        float magnitude = length(z);
        if (magnitude > ESCAPE_RADIUS) {
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
