#version 450

// Torus cage raymarcher - expanded from minimalistic Twitter shader
// Original: a torus-cross structure with volumetric accumulation

layout(location = 0) in vec2 fragCoord;
layout(location = 0) out vec4 fragColor;

layout(binding = 0) uniform UniformBufferObject {
    vec3 iResolution;
    float iTime;
    vec4 iMouse;
} ubo;

void main() {
    vec3 o = vec3(0.0); // output color accumulator
    float t = ubo.iTime;
    vec2 r = ubo.iResolution.xy;

    vec3 a, p;
    for (float z = 0.0, i = 0.0, s = 0.0; i++ < 1e2;
         o += s / max(a, s * 0.4 + 0.01))
    {
        // Ray direction: map fragCoord to centered space
        // Original uses gl_FragCoord.xyz where z≈0, giving direction (2x-w, 2y-h, -h)
        p = z * normalize(vec3(fragCoord.xy, 0.0) * 2.0 - r.xyy);

        // Push into the scene
        p.z += 4.0;

        // Orientation vector: animated axis
        a = normalize(cos(t + vec3(0.0, 2.0, 4.0)));

        // Project p onto axis a, then reconstruct perpendicular via cross
        p = dot(a, p) * a + cross(a, p);

        // Take absolute value for symmetry folding
        a = abs(p);

        // Distance fields for a torus-cross structure:
        // Torus: ring in xz with major radius 0.8, thick walls (subtract 2)
        // Cylinder: tube in yz with radius 1.0
        // Cross bars: max(a.x, a.y) - 1.0 (Chebyshev distance)
        a = vec3(
            abs(length(p.xz) - 0.8) - 2.0,
            length(p.yz) - 1.0,
            max(a.x, a.y) - 1.0
        );

        // Step distance: 0.1 * max of the three distance fields
        s = 0.1 * max(a.x, max(a.y, a.z));

        // Advance ray
        z += s;
    }

    // Tone mapping: tanh(o^2 / 5000)
    fragColor = vec4(tanh(o * o / 5e3), 1.0);
}
