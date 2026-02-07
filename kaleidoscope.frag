#version 450

layout(location = 0) in vec2 fragCoord;
layout(location = 0) out vec4 fragColor;

layout(binding = 0) uniform UniformBufferObject {
    vec3 iResolution;
    float iTime;
    vec4 iMouse;
} ubo;

/*
    Colorful Kaleidoscope Shader
    ----------------------------

    Creates a mesmerizing kaleidoscope effect with:
    - 6-fold rotational symmetry
    - Animated colorful patterns
    - Rotating mirror segments
    - Pulsing radial waves
    - HSB color cycling
*/

#define PI 3.14159265359
#define TWO_PI 6.28318530718

vec3 hsb2rgb(vec3 c) {
    vec3 rgb = clamp(abs(mod(c.x*6.0+vec3(0.0,4.0,2.0), 6.0)-3.0)-1.0, 0.0, 1.0);
    rgb = rgb*rgb*(3.0-2.0*rgb);
    return c.z * mix(vec3(1.0), rgb, c.y);
}

float pattern(vec2 p, float t) {
    // Create layered circular patterns
    float d = length(p);
    float a = atan(p.y, p.x);

    // Multiple rotating spiral arms at different speeds
    float spiral1 = sin(a * 8.0 + d * 15.0 - t * 3.0);
    float spiral2 = sin(a * 13.0 - d * 20.0 + t * 5.0);
    float spiral3 = cos(a * 21.0 + d * 25.0 - t * 7.0);

    // Chaotic concentric rings
    float rings1 = sin(d * 30.0 - t * 6.0);
    float rings2 = cos(d * 45.0 + t * 8.0);

    // Wild pulsing patterns
    float dots1 = sin(d * 40.0 - t * 10.0) * sin(a * 12.0 + t * 4.0);
    float dots2 = cos(d * 35.0 + t * 9.0) * cos(a * 17.0 - t * 6.0);

    // Turbulent noise-like pattern
    float turb = sin(p.x * 20.0 + t * 3.0) * cos(p.y * 20.0 - t * 4.0);

    // Combine everything chaotically
    return spiral1 * 0.2 + spiral2 * 0.2 + spiral3 * 0.15 +
           rings1 * 0.15 + rings2 * 0.1 +
           dots1 * 0.1 + dots2 * 0.1 + turb * 0.1;
}

void main() {
    // Center and normalize coordinates
    vec2 uv = (fragCoord - 0.5 * ubo.iResolution.xy) / ubo.iResolution.y;

    // Convert to polar coordinates
    float angle = atan(uv.y, uv.x);
    float radius = length(uv);

    // Number of symmetry segments
    float segments = 6.0;

    // Create kaleidoscope symmetry
    float segmentAngle = TWO_PI / segments;
    float a = mod(angle, segmentAngle);

    // Mirror every other segment
    a = abs(a - segmentAngle * 0.5);

    // Reconstruct cartesian coordinates with symmetry
    vec2 p = vec2(cos(a), sin(a)) * radius;

    // Add faster rotation over time
    float rot = ubo.iTime * 0.8;
    mat2 rotMat = mat2(cos(rot), -sin(rot), sin(rot), cos(rot));
    p = rotMat * p;

    // Wilder zoom oscillation
    float zoom = 2.0 + sin(ubo.iTime * 1.2) * 0.8 + cos(ubo.iTime * 0.7) * 0.4;
    p *= zoom;

    // Generate pattern
    float pat = pattern(p, ubo.iTime);

    // Much more chaotic color variations
    float hue = angle / TWO_PI + ubo.iTime * 0.3 + pat * 0.8 + sin(radius * 10.0) * 0.3;
    float saturation = 0.95 + pat * 0.05;  // Very saturated colors
    float brightness = 0.75 + pat * 0.25 + sin(ubo.iTime * 2.0) * 0.1;

    // Secondary hue modulation for extra chaos
    hue += sin(radius * 8.0 + ubo.iTime * 4.0) * 0.2;

    // Convert to RGB
    vec3 color = hsb2rgb(vec3(hue, saturation, brightness));

    // Add bright highlights at segment boundaries
    float edge = smoothstep(0.02, 0.0, abs(mod(angle + segmentAngle * 0.5, segmentAngle) - segmentAngle * 0.5));
    color += vec3(1.0) * edge * 0.5;

    // Minimal vignette to keep colors strong everywhere
    float vignette = smoothstep(2.0, 0.3, radius);
    color *= vignette;

    fragColor = vec4(color, 1.0);
}
