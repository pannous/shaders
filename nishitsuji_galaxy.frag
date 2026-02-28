#version 450

layout(location = 0) in vec2 fragCoord;
layout(location = 0) out vec4 fragColor;

layout(binding = 0) uniform UniformBufferObject {
    vec3 iResolution;
    float iTime;
    vec4 iMouse;
} ubo;

/*
    Nishitsuji Galaxy / Log-Polar Raymarch
    by Yohei Nishitsuji @YoheiNishitsuji  #つぶやきGLSL

    Log-polar raymarching with nested sinusoidal fractal distance field
    and HSV color accumulation producing a galaxy-like glow.
*/

vec3 hsv(float h, float s, float v) {
    vec4 K = vec4(1.0, 2.0/3.0, 1.0/3.0, 3.0);
    vec3 p = abs(fract(vec3(h) + K.xyz) * 6.0 - K.www);
    return v * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), s);
}

void main() {
    vec3 r = ubo.iResolution;
    float t = ubo.iTime;

    // Hoist per-frame constants out of the loop
    float tHalf    = t * 0.5;
    float sinTWave = sin(t) * 0.07 + 0.2;

    float i = 0.0, e = 0.0, R = 0.0, s = 0.0;
    vec3 q = vec3(0.0), p;
    vec3 d = vec3(fragCoord.xy / r.xy * 0.6 - vec2(0.3, -0.6), 0.5);

    q.z = -1.0;
    q.y = -1.0;

    vec4 o = vec4(0.0);

    // Reduced from 97 → 64 steps: ~34% fewer expensive transcendental calls.
    // Glow density is slightly lower but the galaxy shape is fully preserved.
    for (; i++ < 64.0; ) {
        o.rgb += hsv(0.1, e, min(e * s, 1.0) / 95.0);

        s = 5.0;
        p = q += d * e * R * 0.4;

        R = length(p);
        p = vec3(
            log(R) - tHalf,
            exp(-p.z / R) + sinTWave,
            atan(p.y, p.x)
        );

        p.y -= 1.0;
        e = p.y;
        // Reduced from 8 → 6 octaves (s < 320 instead of < 1000).
        // The two finest octaves (s=320, s=640) oscillate so fast they
        // contribute only sub-pixel noise at typical resolutions.
        for (; s < 320.0; s += s) {
            e += dot(sin(p.zxx * s), vec3(0.4) - cos(p.yyz * s)) / s * 0.3;
        }
    }

    fragColor = vec4(o.rgb, 1.0);
}
