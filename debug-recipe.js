// Debug: verify the recipe for HSL(184, 18, 85)
function hslToRgb(h, s, l) {
    var sn = s / 100, ln = l / 100;
    var a = sn * Math.min(ln, 1 - ln);
    function f(n) { var k = (n + h / 30) % 12; return ln - a * Math.max(Math.min(k - 3, 9 - k, 1), -1); }
    return { r: Math.round(f(0) * 255), g: Math.round(f(8) * 255), b: Math.round(f(4) * 255) };
}
function rgbToHsl(r, g, b) {
    var rn = r/255, gn = g/255, bn = b/255;
    var max = Math.max(rn,gn,bn), min = Math.min(rn,gn,bn);
    var h=0, s=0, l=(max+min)/2;
    if (max !== min) {
        var d = max - min;
        s = l > 0.5 ? d/(2-max-min) : d/(max+min);
        if (max===rn) h=((gn-bn)/d+(gn<bn?6:0))/6;
        else if (max===gn) h=((bn-rn)/d+2)/6;
        else h=((rn-gn)/d+4)/6;
        h *= 360;
    }
    return { h: Math.round(h), s: Math.round(s*100), l: Math.round(l*100) };
}
function rgbToKS(r, g, b) {
    var rn = Math.max(0.001, r/255), gn = Math.max(0.001, g/255), bn = Math.max(0.001, b/255);
    return { k1: (1-rn)*(1-rn)/(2*rn), k2: (1-gn)*(1-gn)/(2*gn), k3: (1-bn)*(1-bn)/(2*bn) };
}
function ksToRgb(k1, k2, k3) {
    var r = 1+k1-Math.sqrt(k1*k1+2*k1);
    var g = 1+k2-Math.sqrt(k2*k2+2*k2);
    var b = 1+k3-Math.sqrt(k3*k3+2*k3);
    return { r: Math.round(Math.max(0,Math.min(1,r))*255), g: Math.round(Math.max(0,Math.min(1,g))*255), b: Math.round(Math.max(0,Math.min(1,b))*255) };
}

var pigments = [
    { name: "Prussian Blue",    hsl: [208, 72, 20], teile: 5 },
    { name: "Light Oxide Red",  hsl: [12,  48, 42], teile: 10 },
    { name: "Ultramarine Deep", hsl: [238, 72, 38], teile: 1 },
    { name: "Lemon Yellow",     hsl: [56,  88, 72], teile: 6 }
];

WScript.Echo("=== Individual Pigments ===");
var totalTeile = 0;
for (var i = 0; i < pigments.length; i++) totalTeile += pigments[i].teile;

for (var i = 0; i < pigments.length; i++) {
    var p = pigments[i];
    var rgb = hslToRgb(p.hsl[0], p.hsl[1], p.hsl[2]);
    var ks = rgbToKS(rgb.r, rgb.g, rgb.b);
    var w = p.teile / totalTeile;
    WScript.Echo(p.name + " (" + p.teile + "T, w=" + w.toFixed(3) + ")");
    WScript.Echo("  RGB(" + rgb.r + "," + rgb.g + "," + rgb.b + ")");
    WScript.Echo("  K/S: r=" + ks.k1.toFixed(4) + " g=" + ks.k2.toFixed(4) + " b=" + ks.k3.toFixed(4));
}

WScript.Echo("");
WScript.Echo("=== Mixed K/S (normalized weights) ===");
var mixK1 = 0, mixK2 = 0, mixK3 = 0;
for (var i = 0; i < pigments.length; i++) {
    var p = pigments[i];
    var rgb = hslToRgb(p.hsl[0], p.hsl[1], p.hsl[2]);
    var ks = rgbToKS(rgb.r, rgb.g, rgb.b);
    var w = p.teile / totalTeile;
    mixK1 += w * ks.k1;
    mixK2 += w * ks.k2;
    mixK3 += w * ks.k3;
}
WScript.Echo("Mix K/S: r=" + mixK1.toFixed(4) + " g=" + mixK2.toFixed(4) + " b=" + mixK3.toFixed(4));

var mixRgb = ksToRgb(mixK1, mixK2, mixK3);
var mixHsl = rgbToHsl(mixRgb.r, mixRgb.g, mixRgb.b);
WScript.Echo("Undiluted: RGB(" + mixRgb.r + "," + mixRgb.g + "," + mixRgb.b + ") HSL(" + mixHsl.h + "," + mixHsl.s + "," + mixHsl.l + ")");

WScript.Echo("");
WScript.Echo("=== Dilution sweep ===");
var dVals = [1.0, 0.5, 0.2, 0.1, 0.05, 0.03, 0.02, 0.01, 0.005];
for (var di = 0; di < dVals.length; di++) {
    var d = dVals[di];
    var dRgb = ksToRgb(mixK1 * d, mixK2 * d, mixK3 * d);
    var dHsl = rgbToHsl(dRgb.r, dRgb.g, dRgb.b);
    WScript.Echo("d=" + d.toFixed(3) + " RGB(" + dRgb.r + "," + dRgb.g + "," + dRgb.b + ") HSL(" + dHsl.h + "," + dHsl.s + "," + dHsl.l + ")");
}

WScript.Echo("");
WScript.Echo("=== Target ===");
var tRgb = hslToRgb(184, 18, 85);
WScript.Echo("Target: RGB(" + tRgb.r + "," + tRgb.g + "," + tRgb.b + ") HSL(184,18,85)");

WScript.Echo("");
WScript.Echo("=== Alternative: Turquoise Blue (VG522) only ===");
var tqRgb = hslToRgb(188, 78, 35);
var tqKs = rgbToKS(tqRgb.r, tqRgb.g, tqRgb.b);
WScript.Echo("TQ K/S: r=" + tqKs.k1.toFixed(4) + " g=" + tqKs.k2.toFixed(4) + " b=" + tqKs.k3.toFixed(4));
for (var di = 0; di < dVals.length; di++) {
    var d = dVals[di];
    var dRgb = ksToRgb(tqKs.k1 * d, tqKs.k2 * d, tqKs.k3 * d);
    var dHsl = rgbToHsl(dRgb.r, dRgb.g, dRgb.b);
    WScript.Echo("d=" + d.toFixed(3) + " RGB(" + dRgb.r + "," + dRgb.g + "," + dRgb.b + ") HSL(" + dHsl.h + "," + dHsl.s + "," + dHsl.l + ")");
}
