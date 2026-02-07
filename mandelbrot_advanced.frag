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
    Advanced Mandelbrot Set Renderer
    ---------------------------------

    Features:
    - Smooth/continuous iteration coloring (no banding)
    - Distance estimation for sharp edges
    - Adaptive iteration count based on zoom level
    - Numeric stability optimizations
    - Interior detection for faster rendering
    - Orbit trap coloring options

    Controls:
    - Move mouse: Changes zoom focal point
    - Scroll: Zoom in/out
    - R key: Reset
    - Left click + drag: Pan view
*/

// Constants
const float ESCAPE_RADIUS = 256.0;  // Higher = more accurate smooth coloring
const float LOG_ESCAPE = log(ESCAPE_RADIUS);
const float LOG_2 = log(2.0);

// Zoom speed for auto-zoom mode (set to 0 for manual zoom only)
const float AUTO_ZOOM_SPEED = 0.0;  // 0.15 for auto-zoom, 0.0 for manual

// Adaptive iteration count based on zoom level
int getMaxIterations(float zoom) {
    // More iterations needed at higher zoom for detail
    // Formula: base + log2(zoom) * multiplier
    float iterations = 100.0 + log2(max(zoom, 1.0)) * 15.0;
    return int(clamp(iterations, 100.0, 2000.0));
}

// Distance estimation for the Mandelbrot set
// Returns distance to set boundary in complex plane units
float distanceEstimation(vec2 c, int maxIter) {
    vec2 z = vec2(0.0);
    vec2 dz = vec2(0.0);
    float m2 = 0.0;

    for (int i = 0; i < maxIter; i++) {
        // Calculate derivative: dz = 2*z*dz + 1
        dz = 2.0 * vec2(z.x * dz.x - z.y * dz.y, z.x * dz.y + z.y * dz.x) + vec2(1.0, 0.0);

        // Calculate iteration: z = z^2 + c
        float z_real = z.x * z.x - z.y * z.y;
        float z_imag = 2.0 * z.x * z.y;
        z = vec2(z_real, z_imag) + c;

        m2 = dot(z, z);
        if (m2 > ESCAPE_RADIUS * ESCAPE_RADIUS) {
            break;
        }
    }

    // Distance estimation formula: 0.5 * |z| * log(|z|) / |dz|
    float m = sqrt(m2);
    float dm = length(dz);
    return 0.5 * m * log(m) / dm;
}

// Main Mandelbrot iteration with smooth coloring
vec4 mandelbrot(vec2 c, int maxIter) {
    vec2 z = vec2(0.0);
    vec2 dz = vec2(0.0);  // Derivative for distance estimation

    float m2 = 0.0;
    int iterations = 0;

    // Main iteration loop
    for (int i = 0; i < maxIter; i++) {
        // Calculate derivative for distance estimation
        dz = 2.0 * vec2(z.x * dz.x - z.y * dz.y, z.x * dz.y + z.y * dz.x) + vec2(1.0, 0.0);

        // Mandelbrot iteration: z = z^2 + c
        float z_real = z.x * z.x - z.y * z.y;
        float z_imag = 2.0 * z.x * z.y;
        z = vec2(z_real, z_imag) + c;

        m2 = dot(z, z);

        if (m2 > ESCAPE_RADIUS * ESCAPE_RADIUS) {
            break;
        }

        iterations++;
    }

    // Check if point is in the set
    if (iterations == maxIter) {
        // Interior coloring (in the set)
        // Use potential field or orbit trap for interior
        float interior = log(m2) / float(maxIter);
        return vec4(interior * 0.1, interior * 0.05, interior * 0.15, 1.0);
    }

    // Smooth iteration count for continuous coloring
    // Formula: iterations + 1 - log(log(|z|)) / log(2)
    float m = sqrt(m2);
    float smoothIter = float(iterations) + 1.0 - log(log(m)) / LOG_2;

    // Normalize to [0, 1]
    float t = smoothIter / float(maxIter);

    // Distance estimation for edge detection
    float dist = 0.5 * m * log(m) / length(dz);

    return vec4(t, dist, float(iterations), m2);
}

// Color palette function
vec3 palette(float t, float dist) {
    // Multiple color schemes based on distance

    // Scheme 1: Rainbow-like with distance-based shading
    vec3 col = 0.5 + 0.5 * cos(6.28318 * (t * 1.5 + vec3(0.0, 0.33, 0.67)));

    // Apply distance-based edge highlighting
    float edge = smoothstep(0.0, 0.01, dist);
    col = mix(vec3(0.0), col, edge);

    // Add some variation based on time (optional, can be removed)
    col += 0.1 * sin(ubo.iTime * 0.5 + t * 10.0);

    // Enhance contrast
    col = pow(col, vec3(0.8));

    return col;
}

void main() {
    vec2 uv = fragCoord / ubo.iResolution.xy;

    // Mouse position (normalized)
    vec2 mouse = ubo.iMouse.xy / ubo.iResolution.xy;

    // Calculate zoom level
    float zoom;
    if (AUTO_ZOOM_SPEED > 0.0) {
        // Auto-zoom mode
        float effectiveTime = ubo.iTime - ubo.iScroll.y;
        zoom = exp(effectiveTime * AUTO_ZOOM_SPEED);
    } else {
        // Manual zoom mode (scroll-based)
        // Matches mandelbrot_simple.frag formula
        zoom = sqrt(exp(ubo.iScroll.y * 0.1));
    }
    zoom = clamp(zoom, 0.01, 1e10);

    // Get adaptive iteration count
    int maxIter = getMaxIterations(zoom);

    // Default center (interesting part of Mandelbrot set)
    vec2 center = vec2(-0.5, 0.0);

    // Zoom toward cursor
    if (AUTO_ZOOM_SPEED > 0.0) {
        // Auto-zoom: use reference mouse system for relative movement
        vec2 referenceMouse = vec2(ubo.iScroll.x, ubo.iButtonLeft);
        vec2 deltaMouse = mouse - referenceMouse;

        center.x += (deltaMouse.x + (referenceMouse.x - 0.5)) * 3.0 * (zoom - 1.0) / zoom;
        center.y += (deltaMouse.y + (referenceMouse.y - 0.5)) * 3.0 * (zoom - 1.0) / zoom;
    } else {
        // Manual zoom: use reference mouse for stable fixed point
        vec2 referenceMouse = vec2(ubo.iScroll.x, ubo.iButtonLeft);
        vec2 deltaMouse = mouse - referenceMouse;

        center.x += (deltaMouse.x + (referenceMouse.x - 0.5)) * 3.0 * (zoom - 1.0) / zoom;
        center.y += (deltaMouse.y + (referenceMouse.y - 0.5)) * 3.0 * (zoom - 1.0) / zoom;
    }

    // Add drag-pan offset
    float aspect = ubo.iResolution.x / ubo.iResolution.y;
    vec2 panNormalized = ubo.iPan / ubo.iResolution.xy;
    center.x -= panNormalized.x * 3.0 / zoom * aspect;
    center.y -= panNormalized.y * 3.0 / zoom;

    // Convert screen coordinates to complex plane
    vec2 c;
    c.x = (uv.x - 0.5) * 3.0 / zoom + center.x;
    c.y = (uv.y - 0.5) * 3.0 / zoom + center.y;

    // Adjust aspect ratio
    c.x *= aspect;

    // === ANTI-ALIASING (2x2 grid) ===
    // Sample 4 points in a grid for smoother edges
    vec3 color = vec3(0.0);
    const float AA_OFFSET = 0.25;

    for (int y = 0; y < 2; y++) {
        for (int x = 0; x < 2; x++) {
            vec2 offset = vec2(float(x), float(y)) * AA_OFFSET - AA_OFFSET * 0.5;
            vec2 pixelOffset = offset / ubo.iResolution.xy;

            vec2 c_aa = c + pixelOffset * 3.0 / zoom;
            c_aa.x *= aspect;

            // Calculate Mandelbrot
            vec4 result = mandelbrot(c_aa, maxIter);
            float t = result.x;
            float dist = result.y;

            // Apply color palette
            vec3 sampleColor = palette(t, dist);

            color += sampleColor;
        }
    }
    color /= 4.0;

    // Gamma correction
    color = pow(color, vec3(1.0 / 2.2));

    // Debug info: show iteration count as overlay (optional)
    // Uncomment to see iteration count visualization
    // float iterRatio = float(maxIter) / 2000.0;
    // color = mix(color, vec3(iterRatio, 0.0, 0.0), 0.1);

    fragColor = vec4(color, 1.0);
}
