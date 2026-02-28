/*
    Nishitsuji Galaxy / Log-Polar Raymarch
    by Yohei Nishitsuji @YoheiNishitsuji
    https://twitter.com/YoheiNishitsuji
    #つぶやきGLSL (Tweet GLSL)

    Original compact form (Twitter/code-golf style):
    float i,e,R,s;vec3 q,p,d=vec3(FC.xy/r*.6-vec2(.3,-.6),.5);for(q.zy--;i+
    +<97.;){o.rgb+=hsv(.1,e,min(e*s,1.)/95.);s=5.;p=q+=d*e*R*.4;p=vec3(log(R=length(p))-t*.5,exp(-p.z/R)
    +sin(t)*.07+.2,atan(p.y,p.x));for(e=--p.y;s<1e3;s+=s)e+=dot(sin(p.zxx*s),.4-cos(p.yyz*s))/s*.3;}

    Technique:
    - Log-polar coordinate raymarching
    - Fractal distance field via nested sinusoidal octaves
    - HSV color accumulation producing galaxy-like glow
*/

// HSV to RGB
vec3 hsv(float h, float s, float v) {
    vec4 K = vec4(1.0, 2.0/3.0, 1.0/3.0, 3.0);
    vec3 p = abs(fract(vec3(h) + K.xyz) * 6.0 - K.www);
    return v * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), s);
}

void mainImage(out vec4 o, in vec2 FC) {
    vec3 r = iResolution;
    float t = iTime;

    float i = 0.0, e = 0.0, R = 0.0, s;
    vec3 q = vec3(0.0), p;
    // Ray direction: offset UV scaled to 60% of screen, biased toward lower-left
    vec3 d = vec3(FC.xy / r.xy * 0.6 - vec2(0.3, -0.6), 0.5);

    // Start ray behind origin (q.z = q.y = -1)
    q.z = -1.0;
    q.y = -1.0;

    o = vec4(0.0);

    // Outer raymarch loop (~97 steps)
    for (; i++ < 97.0; ) {
        // Accumulate color using current distance estimate
        o.rgb += hsv(0.1, e, min(e * s, 1.0) / 95.0);

        // Advance ray position
        s = 5.0;
        p = q += d * e * R * 0.4;

        // Transform to log-polar (cylindrical) space
        R = length(p);
        p = vec3(
            log(R) - t * 0.5,                        // log-radial axis, animated
            exp(-p.z / R) + sin(t) * 0.07 + 0.2,     // height with gentle wave
            atan(p.y, p.x)                             // angular axis
        );

        // Inner loop: fractal distance estimation via sinusoidal octaves
        p.y -= 1.0;
        e = p.y;
        for (; s < 1000.0; s += s) {
            e += dot(sin(p.zxx * s), vec3(0.4) - cos(p.yyz * s)) / s * 0.3;
        }
    }
}
