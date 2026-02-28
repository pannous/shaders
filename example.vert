#version 450

layout(location = 0) out vec2 fragCoord;

layout(binding = 0) uniform UniformBufferObject {
    vec3 iResolution;
    float iTime;
    vec4 iMouse;
} ubo;

void main() {
    vec2 positions[6] = vec2[](
        vec2(-1.0, -1.0),
        vec2(1.0, -1.0),
        vec2(1.0, 1.0),
        vec2(-1.0, -1.0),
        vec2(1.0, 1.0),
        vec2(-1.0, 1.0)
    );

    gl_Position = vec4(positions[gl_VertexIndex], 0.0, 1.0);
    vec2 uv = positions[gl_VertexIndex] * 0.5 + 0.5;
    fragCoord = vec2(uv.x, 1.0 - uv.y) * ubo.iResolution.xy;
}
