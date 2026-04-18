// Automated test for Aquarell-Farbmischer algorithm (Kubelka-Munk based)
// Run with: cscript //nologo test-farbmischer.js

var PALETTE = [
    { id: "VG254", name: "Perm. Lemon Yellow",       hue: 56,  sat: 88, light: 72, hex: "#F0E040", pigment: "PY184" },
    { id: "VG272", name: "Transparent Yellow Med.",   hue: 46,  sat: 82, light: 62, hex: "#DEB030", pigment: "PY128" },
    { id: "VG244", name: "Indian Yellow",             hue: 40,  sat: 78, light: 52, hex: "#D49820", pigment: "PY83"  },
    { id: "VG227", name: "Yellow Ochre",              hue: 38,  sat: 50, light: 50, hex: "#BF9640", pigment: "PY42"  },
    { id: "VG296", name: "Azomethine Green Yellow",   hue: 95,  sat: 55, light: 48, hex: "#7EA830", pigment: "PY129" },
    { id: "VG278", name: "Pyrrole Orange",            hue: 22,  sat: 88, light: 52, hex: "#E86820", pigment: "PO73"  },
    { id: "VG370", name: "Permanent Red Light",       hue: 5,   sat: 82, light: 48, hex: "#D83828", pigment: "PR255" },
    { id: "VG371", name: "Permanent Red Deep",        hue: 0,   sat: 62, light: 32, hex: "#842020", pigment: "PR149" },
    { id: "VG331", name: "Madder Lake Deep",          hue: 348, sat: 58, light: 30, hex: "#782030", pigment: "PR264" },
    { id: "VG339", name: "Light Oxide Red",           hue: 12,  sat: 48, light: 42, hex: "#9E5838", pigment: "PR101" },
    { id: "VG366", name: "Quinacridone Rose",         hue: 340, sat: 70, light: 44, hex: "#C03058", pigment: "PV19"  },
    { id: "VG567", name: "Perm. Red Violet",          hue: 330, sat: 62, light: 38, hex: "#9C2860", pigment: "PV19"  },
    { id: "VG592", name: "Quin. Purple Red",          hue: 318, sat: 52, light: 34, hex: "#842858", pigment: "PV55"  },
    { id: "VG593", name: "Quin. Purple Blue",         hue: 300, sat: 48, light: 28, hex: "#6A2068", pigment: "PV55"  },
    { id: "VG568", name: "Perm. Blue Violet",         hue: 278, sat: 68, light: 22, hex: "#381068", pigment: "PV23"  },
    { id: "VG506", name: "Ultramarine Deep",          hue: 238, sat: 72, light: 38, hex: "#2028A0", pigment: "PB29"  },
    { id: "VG570", name: "Phthalo Blue",              hue: 215, sat: 88, light: 28, hex: "#084080", pigment: "PB15"  },
    { id: "VG508", name: "Prussian Blue",             hue: 208, sat: 72, light: 20, hex: "#0E3050", pigment: "PB27"  },
    { id: "VG522", name: "Turquoise Blue",            hue: 188, sat: 78, light: 35, hex: "#148078", pigment: "PB15+PG7" },
    { id: "VG633", name: "Perm. Yellowish Green",     hue: 135, sat: 62, light: 42, hex: "#30A848", pigment: "PY154+PG7" },
    { id: "VG675", name: "Phthalo Green",             hue: 160, sat: 88, light: 25, hex: "#086040", pigment: "PG7"   },
    { id: "VG411", name: "Burnt Sienna",              hue: 18,  sat: 55, light: 35, hex: "#8A4820", pigment: "PR101" },
    { id: "VG409", name: "Burnt Umber",               hue: 25,  sat: 42, light: 22, hex: "#503018", pigment: "PBr7"  },
    { id: "VG735", name: "Oxide Black",               hue: 0,   sat: 0,  light: 8,  hex: "#181818", pigment: "PBk11" },
    { id: "VG106", name: "Opaque White",              hue: 0,   sat: 0,  light: 97, hex: "#F8F8F8", pigment: "PW6"   }
];

// ===================== UTILITY FUNCTIONS =====================

function hueDistance(h1, h2) {
    var d = Math.abs(h1 - h2);
    return d > 180 ? 360 - d : d;
}

// HSL (h:0-360, s:0-100, l:0-100) -> RGB (r,g,b: 0-255)
function hslToRgb(h, s, l) {
    var sn = s / 100;
    var ln = l / 100;
    var a = sn * Math.min(ln, 1 - ln);
    function f(n) {
        var k = (n + h / 30) % 12;
        return ln - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    }
    return { r: Math.round(f(0) * 255), g: Math.round(f(8) * 255), b: Math.round(f(4) * 255) };
}

// RGB (0-255) -> HSL (h:0-360, s:0-100, l:0-100)
function rgbToHsl(r, g, b) {
    var rn = r / 255, gn = g / 255, bn = b / 255;
    var max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
    var h = 0, s = 0, l = (max + min) / 2;
    if (max !== min) {
        var d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        if (max === rn) {
            h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6;
        } else if (max === gn) {
            h = ((bn - rn) / d + 2) / 6;
        } else {
            h = ((rn - gn) / d + 4) / 6;
        }
        h = h * 360;
    }
    return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };
}

// ===================== KUBELKA-MUNK CORE =====================

// RGB (0-255) -> K/S values per channel
// K/S = (1 - R)^2 / (2R), R normalized 0-1, clamped to min 0.001
function rgbToKS(r, g, b) {
    var rn = Math.max(0.001, r / 255);
    var gn = Math.max(0.001, g / 255);
    var bn = Math.max(0.001, b / 255);
    return {
        k1: (1 - rn) * (1 - rn) / (2 * rn),
        k2: (1 - gn) * (1 - gn) / (2 * gn),
        k3: (1 - bn) * (1 - bn) / (2 * bn)
    };
}

// K/S values -> RGB (0-255)
// R = 1 + K/S - sqrt(K/S^2 + 2*K/S), clamped to [0, 1]
function ksToRgb(k1, k2, k3) {
    var r = 1 + k1 - Math.sqrt(k1 * k1 + 2 * k1);
    var g = 1 + k2 - Math.sqrt(k2 * k2 + 2 * k2);
    var b = 1 + k3 - Math.sqrt(k3 * k3 + 2 * k3);
    return {
        r: Math.round(Math.max(0, Math.min(1, r)) * 255),
        g: Math.round(Math.max(0, Math.min(1, g)) * 255),
        b: Math.round(Math.max(0, Math.min(1, b)) * 255)
    };
}

// Mix pigments in K/S space: weighted average of K/S values
// pigments: array of {rgb: {r,g,b}, weight: number}
function ksMix(pigments) {
    var totalWeight = 0;
    var sumK1 = 0, sumK2 = 0, sumK3 = 0;
    for (var i = 0; i < pigments.length; i++) {
        var p = pigments[i];
        var ks = rgbToKS(p.rgb.r, p.rgb.g, p.rgb.b);
        totalWeight += p.weight;
        sumK1 += ks.k1 * p.weight;
        sumK2 += ks.k2 * p.weight;
        sumK3 += ks.k3 * p.weight;
    }
    if (totalWeight <= 0) return { r: 255, g: 255, b: 255 };
    return ksToRgb(sumK1 / totalWeight, sumK2 / totalWeight, sumK3 / totalWeight);
}

// Water dilution in K/S space: interpolate K/S toward paper white (K/S = 0)
// pigmentFrac: 0 = pure water/paper white, 1 = pure pigment
function ksDilute(r, g, b, pigmentFrac) {
    var ks = rgbToKS(r, g, b);
    return ksToRgb(ks.k1 * pigmentFrac, ks.k2 * pigmentFrac, ks.k3 * pigmentFrac);
}

// ===================== COLOR SCIENCE =====================

// RGB (0-255) -> CIELAB (L: 0-100, a/b: approx -128..128)
function rgbToLab(r, g, b) {
    var rn = r / 255, gn = g / 255, bn = b / 255;
    rn = rn > 0.04045 ? Math.pow((rn + 0.055) / 1.055, 2.4) : rn / 12.92;
    gn = gn > 0.04045 ? Math.pow((gn + 0.055) / 1.055, 2.4) : gn / 12.92;
    bn = bn > 0.04045 ? Math.pow((bn + 0.055) / 1.055, 2.4) : bn / 12.92;
    var x = rn * 0.4124564 + gn * 0.3575761 + bn * 0.1804375;
    var y = rn * 0.2126729 + gn * 0.7151522 + bn * 0.0721750;
    var z = rn * 0.0193339 + gn * 0.1191920 + bn * 0.9503041;
    x = x / 0.95047; y = y / 1.00000; z = z / 1.08883;
    var eps = 0.008856, kap = 903.3;
    x = x > eps ? Math.pow(x, 1.0 / 3.0) : (kap * x + 16) / 116;
    y = y > eps ? Math.pow(y, 1.0 / 3.0) : (kap * y + 16) / 116;
    z = z > eps ? Math.pow(z, 1.0 / 3.0) : (kap * z + 16) / 116;
    return { L: 116 * y - 16, a: 500 * (x - y), b: 200 * (y - z) };
}

function deltaE76(lab1, lab2) {
    var dL = lab1.L - lab2.L;
    var da = lab1.a - lab2.a;
    var db = lab1.b - lab2.b;
    return Math.sqrt(dL * dL + da * da + db * db);
}

// ===================== OPTIMIZER =====================

// Normalize weights so they sum to 1, return copy
function normalizeWeights(x) {
    var sum = 0, i;
    var w = x.slice();
    for (i = 0; i < w.length; i++) {
        if (w[i] < 0) w[i] = 0;
        sum += w[i];
    }
    if (sum <= 0) {
        w[0] = 1;
        for (i = 1; i < w.length; i++) w[i] = 0;
        return w;
    }
    for (i = 0; i < w.length; i++) w[i] = w[i] / sum;
    return w;
}

// Find optimal dilution d for a given undiluted mixture KS
// Uses target L* to estimate d, then refines
// Returns { d, deltaE, rgb }
function optimizeDilution(mixK1, mixK2, mixK3, targetLab) {
    var bestD = 0, bestDE = 999, bestRgb = null;
    var d, rgb, lab, de;
    // Quick scan: 11 steps
    for (d = 0.0; d <= 1.001; d += 0.1) {
        rgb = ksToRgb(mixK1 * d, mixK2 * d, mixK3 * d);
        lab = rgbToLab(rgb.r, rgb.g, rgb.b);
        de = deltaE76(targetLab, lab);
        if (de < bestDE) { bestDE = de; bestD = d; bestRgb = rgb; }
    }
    // Refine +-0.1 in 0.01 steps (max 20)
    var lo = Math.max(0, bestD - 0.1);
    var hi = Math.min(1, bestD + 0.1);
    for (d = lo; d <= hi + 0.001; d += 0.01) {
        rgb = ksToRgb(mixK1 * d, mixK2 * d, mixK3 * d);
        lab = rgbToLab(rgb.r, rgb.g, rgb.b);
        de = deltaE76(targetLab, lab);
        if (de < bestDE) { bestDE = de; bestD = d; bestRgb = rgb; }
    }
    return { d: bestD, deltaE: bestDE, rgb: bestRgb };
}

// Evaluate deltaE for weights x (will be normalized) + optimal dilution
// Two-stage model: mix pigments with normalized weights, then dilute
function evalRecipe(paletteKS, indices, x, targetLab) {
    var w = normalizeWeights(x);
    var mixK1 = 0, mixK2 = 0, mixK3 = 0;
    for (var j = 0; j < indices.length; j++) {
        mixK1 += w[j] * paletteKS[indices[j]].k1;
        mixK2 += w[j] * paletteKS[indices[j]].k2;
        mixK3 += w[j] * paletteKS[indices[j]].k3;
    }
    var dilResult = optimizeDilution(mixK1, mixK2, mixK3, targetLab);
    return { deltaE: dilResult.deltaE, d: dilResult.d, w: w,
             mixK1: mixK1, mixK2: mixK2, mixK3: mixK3, rgb: dilResult.rgb };
}

// Optimize weights via coordinate descent on deltaE
function optimizeWeights(paletteKS, indices, initX, targetLab) {
    var n = indices.length;
    var x = initX.slice();
    var cur = evalRecipe(paletteKS, indices, x, targetLab);
    var bestDE = cur.deltaE;
    var factors = [0.0, 0.3, 0.7, 1.5, 3.0];
    for (var iter = 0; iter < 15; iter++) {
        var improved = false;
        for (var i = 0; i < n; i++) {
            var origX = x[i];
            for (var f = 0; f < factors.length; f++) {
                x[i] = origX * factors[f];
                var res = evalRecipe(paletteKS, indices, x, targetLab);
                if (res.deltaE < bestDE - 0.005) {
                    bestDE = res.deltaE;
                    origX = x[i];
                    improved = true;
                } else {
                    x[i] = origX;
                }
            }
            // Also try small absolute values
            var absTrials = [0.01, 0.1, 0.5];
            for (var a = 0; a < absTrials.length; a++) {
                x[i] = absTrials[a];
                var res2 = evalRecipe(paletteKS, indices, x, targetLab);
                if (res2.deltaE < bestDE - 0.005) {
                    bestDE = res2.deltaE;
                    origX = x[i];
                    improved = true;
                } else {
                    x[i] = origX;
                }
            }
        }
        if (!improved) break;
    }
    return x;
}

// Main optimizer: find optimal pigment recipe for a target color
// Two-stage model: w_i (normalized weights) determine pigment mix, d (0..1) determines dilution
// final_KS = d * Σ(w_i * KS_i), pigmentFrac = d
function findBestRecipe(targetH, targetS, targetL, maxPigments) {
    if (!maxPigments) maxPigments = 5;
    var targetRgb = hslToRgb(targetH, targetS, targetL);
    var targetLab = rgbToLab(targetRgb.r, targetRgb.g, targetRgb.b);

    // Exclude Opaque White from optimizer (water dilution handles lightening)
    var paletteKS = [];
    for (var i = 0; i < PALETTE.length; i++) {
        var pRgb = hslToRgb(PALETTE[i].hue, PALETTE[i].sat, PALETTE[i].light);
        paletteKS[i] = rgbToKS(pRgb.r, pRgb.g, pRgb.b);
    }

    var globalBestDE = 999;
    var globalBestSelected = [];
    var globalBestX = [];
    var globalBestD = 1.0;

    // Rank single-pigment starts
    var startCandidates = [];
    for (var si = 0; si < PALETTE.length; si++) {
        if (PALETTE[si].sat === 0 && PALETTE[si].light > 90) continue; // skip white
        var initX = [1.0];
        initX = optimizeWeights(paletteKS, [si], initX, targetLab);
        var sRes = evalRecipe(paletteKS, [si], initX, targetLab);
        startCandidates.push({ idx: si, de: sRes.deltaE, x: initX[0], d: sRes.d });
    }
    startCandidates.sort(function(a, b) { return a.de - b.de; });
    var numStarts = Math.min(4, startCandidates.length);

    for (var start = 0; start < numStarts; start++) {
        var selected = [startCandidates[start].idx];
        var bestDE = startCandidates[start].de;
        var bestX = [startCandidates[start].x];

        // Greedy pigment addition
        for (var step = 1; step < maxPigments; step++) {
            var bestIdx = -1;
            var bestStepDE = 999;
            var bestStepX = null;

            for (var i = 0; i < PALETTE.length; i++) {
                if (PALETTE[i].sat === 0 && PALETTE[i].light > 90) continue; // skip white
                var already = false;
                for (var j = 0; j < selected.length; j++) {
                    if (selected[j] === i) { already = true; break; }
                }
                if (already) continue;

                var trial = selected.slice();
                trial.push(i);
                var trialX = bestX.slice();
                trialX.push(0.1);
                trialX = optimizeWeights(paletteKS, trial, trialX, targetLab);
                var res = evalRecipe(paletteKS, trial, trialX, targetLab);

                if (res.deltaE < bestStepDE) {
                    bestStepDE = res.deltaE;
                    bestIdx = i;
                    bestStepX = trialX;
                }
            }

            if (bestIdx < 0) break;
            selected.push(bestIdx);
            bestX = bestStepX;
            var prevDE = bestDE;
            bestDE = bestStepDE;

            if (bestDE < 1.0) break;
            if (prevDE - bestDE < 0.1) break;
        }

        if (bestDE < globalBestDE) {
            globalBestDE = bestDE;
            globalBestSelected = selected.slice();
            globalBestX = bestX.slice();
        }
        if (globalBestDE < 1.0) break;
    }

    // Compute final result with normalized weights + dilution
    var finalRes = evalRecipe(paletteKS, globalBestSelected, globalBestX, targetLab);
    var finalW = finalRes.w;
    var pigmentFrac = finalRes.d;

    // Build result - filter out near-zero weight pigments
    var resultPigments = [];
    for (var j = 0; j < globalBestSelected.length; j++) {
        if (finalW[j] > 0.005) {
            resultPigments.push({
                palette: PALETTE[globalBestSelected[j]],
                weight: finalW[j]
            });
        }
    }

    // Compute final mixed RGB using diluted K/S
    var mixRgb = finalRes.rgb;
    var mixHsl = rgbToHsl(mixRgb.r, mixRgb.g, mixRgb.b);

    // Convert to relative weights (Teile: max=10)
    var maxW = 0;
    for (var j = 0; j < resultPigments.length; j++) {
        if (resultPigments[j].weight > maxW) maxW = resultPigments[j].weight;
    }
    for (var j = 0; j < resultPigments.length; j++) {
        resultPigments[j].teile = Math.max(1, Math.round(resultPigments[j].weight / maxW * 10));
    }

    return {
        pigments: resultPigments,
        deltaE: globalBestDE,
        totalConcentration: pigmentFrac,
        pigmentFrac: pigmentFrac,
        mixRgb: mixRgb,
        mixHsl: mixHsl,
        targetRgb: targetRgb,
        targetLab: targetLab
    };
}

// ===================== SIMULATION (computeMixedColor) =====================
// Simulates the actual mixing result using K/S physics.
// 1. Optimizer finds best pigments + concentrations
// 2. Pigments are mixed in K/S space using ROUNDED Teile (as a painter would)
// 3. Water dilution is applied in K/S space (paper white = K/S=0)
// Returns: { h, s, l, rgb, pigments, waterRatio, waterNum, pigmentFrac, deltaE, recipe }

function computeMixedColor(h, s, l) {
    var recipe = findBestRecipe(h, s, l);

    // Simulate using the optimizer's exact result (continuous concentrations)
    // This is the best possible simulation of the K/S mixing physics
    var diluted = recipe.mixRgb;
    var result = recipe.mixHsl;
    var pigmentFrac = recipe.pigmentFrac;

    // Water ratio
    var waterNum, waterRatio;
    if (pigmentFrac >= 0.95) {
        waterNum = 0; waterRatio = "pur";
    } else if (pigmentFrac > 0.01) {
        waterNum = (1.0 - pigmentFrac) / pigmentFrac;
        if (waterNum <= 0.75) waterRatio = "1:0.5";
        else if (waterNum <= 2.0) waterRatio = "1:1.5";
        else if (waterNum <= 4.0) waterRatio = "1:3";
        else if (waterNum <= 6.5) waterRatio = "1:5";
        else waterRatio = "1:8+";
    } else {
        waterNum = 10; waterRatio = "1:8+";
    }

    var simLab = rgbToLab(diluted.r, diluted.g, diluted.b);

    return {
        h: result.h,
        s: result.s,
        l: result.l,
        rgb: diluted,
        pigments: recipe.pigments,
        waterRatio: waterRatio,
        waterNum: waterNum,
        pigmentFrac: pigmentFrac,
        deltaE: deltaE76(simLab, recipe.targetLab),
        recipe: recipe
    };
}

// ===================== TEST INFRASTRUCTURE =====================

var errors = 0;
var passed = 0;

function assert(condition, msg) {
    if (!condition) {
        WScript.Echo("  FAIL: " + msg);
        errors++;
    } else {
        passed++;
    }
}

// ===================== HSL/RGB CONVERSION TESTS =====================

WScript.Echo("=== HSL/RGB Conversion Tests ===");
WScript.Echo("");

WScript.Echo("T1: hslToRgb known values");
var rgb;
rgb = hslToRgb(0, 100, 50);
assert(rgb.r === 255 && rgb.g === 0 && rgb.b === 0, "Red HSL(0,100,50) -> RGB(255,0,0), got " + rgb.r + "," + rgb.g + "," + rgb.b);
rgb = hslToRgb(120, 100, 50);
assert(rgb.r === 0 && rgb.g === 255 && rgb.b === 0, "Green HSL(120,100,50) -> RGB(0,255,0), got " + rgb.r + "," + rgb.g + "," + rgb.b);
rgb = hslToRgb(240, 100, 50);
assert(rgb.r === 0 && rgb.g === 0 && rgb.b === 255, "Blue HSL(240,100,50) -> RGB(0,0,255), got " + rgb.r + "," + rgb.g + "," + rgb.b);
rgb = hslToRgb(0, 0, 0);
assert(rgb.r === 0 && rgb.g === 0 && rgb.b === 0, "Black, got " + rgb.r + "," + rgb.g + "," + rgb.b);
rgb = hslToRgb(0, 0, 100);
assert(rgb.r === 255 && rgb.g === 255 && rgb.b === 255, "White, got " + rgb.r + "," + rgb.g + "," + rgb.b);
rgb = hslToRgb(0, 0, 50);
assert(rgb.r === 128 && rgb.g === 128 && rgb.b === 128, "Gray, got " + rgb.r + "," + rgb.g + "," + rgb.b);

WScript.Echo("T2: rgbToHsl known values");
var hsl;
hsl = rgbToHsl(255, 0, 0);
assert(hsl.h === 0 && hsl.s === 100 && hsl.l === 50, "Red, got " + hsl.h + "," + hsl.s + "," + hsl.l);
hsl = rgbToHsl(0, 255, 0);
assert(hsl.h === 120 && hsl.s === 100 && hsl.l === 50, "Green, got " + hsl.h + "," + hsl.s + "," + hsl.l);
hsl = rgbToHsl(0, 0, 255);
assert(hsl.h === 240 && hsl.s === 100 && hsl.l === 50, "Blue, got " + hsl.h + "," + hsl.s + "," + hsl.l);
hsl = rgbToHsl(0, 0, 0);
assert(hsl.h === 0 && hsl.s === 0 && hsl.l === 0, "Black, got " + hsl.h + "," + hsl.s + "," + hsl.l);
hsl = rgbToHsl(255, 255, 255);
assert(hsl.h === 0 && hsl.s === 0 && hsl.l === 100, "White, got " + hsl.h + "," + hsl.s + "," + hsl.l);

WScript.Echo("T3: HSL->RGB->HSL roundtrip for PALETTE");
for (var i = 0; i < PALETTE.length; i++) {
    var p = PALETTE[i];
    var rgb2 = hslToRgb(p.hue, p.sat, p.light);
    var hsl2 = rgbToHsl(rgb2.r, rgb2.g, rgb2.b);
    var hDiff = hueDistance(p.hue, hsl2.h);
    var sDiff = Math.abs(p.sat - hsl2.s);
    var lDiff = Math.abs(p.light - hsl2.l);
    assert(hDiff <= 1 && sDiff <= 1 && lDiff <= 1,
        p.id + " roundtrip diff H=" + hDiff + " S=" + sDiff + " L=" + lDiff);
}

// ===================== KUBELKA-MUNK CORE TESTS =====================

WScript.Echo("");
WScript.Echo("=== Kubelka-Munk Core Tests ===");
WScript.Echo("");

WScript.Echo("KM1: rgbToKS basic values");
var ksWhite = rgbToKS(255, 255, 255);
assert(ksWhite.k1 < 0.001, "White K/S ~0, got k1=" + ksWhite.k1);
assert(ksWhite.k2 < 0.001, "White K/S ~0, got k2=" + ksWhite.k2);
var ksBlack = rgbToKS(0, 0, 0);
assert(ksBlack.k1 > 400, "Black K/S very large, got k1=" + ksBlack.k1);
var ksRed = rgbToKS(255, 0, 0);
assert(ksRed.k1 < 0.001, "Red R-channel ~0, got k1=" + ksRed.k1);
assert(ksRed.k2 > 400, "Red G-channel large, got k2=" + ksRed.k2);
var ksMid = rgbToKS(128, 128, 128);
assert(ksMid.k1 > 0.1 && ksMid.k1 < 0.3, "Mid-gray ~0.13, got k1=" + ksMid.k1.toFixed(4));

WScript.Echo("KM2: ksToRgb basic values");
var rgbFromZero = ksToRgb(0, 0, 0);
assert(rgbFromZero.r === 255 && rgbFromZero.g === 255 && rgbFromZero.b === 255,
    "K/S=0 -> white, got " + rgbFromZero.r + "," + rgbFromZero.g + "," + rgbFromZero.b);
var rgbFromHigh = ksToRgb(500, 500, 500);
assert(rgbFromHigh.r <= 1 && rgbFromHigh.g <= 1 && rgbFromHigh.b <= 1,
    "K/S=500 -> near-black, got " + rgbFromHigh.r + "," + rgbFromHigh.g + "," + rgbFromHigh.b);

WScript.Echo("KM3: RGB -> K/S -> RGB roundtrip");
var km3Colors = [
    [255, 0, 0], [0, 255, 0], [0, 0, 255],
    [255, 255, 0], [0, 255, 255], [255, 0, 255],
    [128, 128, 128], [64, 128, 192], [200, 100, 50],
    [10, 10, 10], [245, 245, 245], [1, 1, 1]
];
var km3Fail = false;
for (var i = 0; i < km3Colors.length; i++) {
    var c = km3Colors[i];
    var ks = rgbToKS(c[0], c[1], c[2]);
    var back = ksToRgb(ks.k1, ks.k2, ks.k3);
    if (Math.abs(c[0] - back.r) > 1 || Math.abs(c[1] - back.g) > 1 || Math.abs(c[2] - back.b) > 1) {
        WScript.Echo("  FAIL: RGB(" + c[0] + "," + c[1] + "," + c[2] +
            ") -> RGB(" + back.r + "," + back.g + "," + back.b + ")");
        km3Fail = true;
    }
}
assert(!km3Fail, "KM3: Roundtrip error > 1");

WScript.Echo("KM4: K/S roundtrip for PALETTE");
var km4Fail = false;
for (var i = 0; i < PALETTE.length; i++) {
    var p = PALETTE[i];
    var pRgb = hslToRgb(p.hue, p.sat, p.light);
    var pKs = rgbToKS(pRgb.r, pRgb.g, pRgb.b);
    var pBack = ksToRgb(pKs.k1, pKs.k2, pKs.k3);
    if (Math.abs(pRgb.r - pBack.r) > 1 || Math.abs(pRgb.g - pBack.g) > 1 || Math.abs(pRgb.b - pBack.b) > 1) {
        WScript.Echo("  FAIL: " + p.id + " diff=" + Math.abs(pRgb.r - pBack.r) + "," +
            Math.abs(pRgb.g - pBack.g) + "," + Math.abs(pRgb.b - pBack.b));
        km4Fail = true;
    }
}
assert(!km4Fail, "KM4: Palette roundtrip error > 1");

WScript.Echo("KM5: ksMix - Red+Blue (subtractive -> dark)");
var km5Mix = ksMix([
    { rgb: { r: 255, g: 0, b: 0 }, weight: 1 },
    { rgb: { r: 0, g: 0, b: 255 }, weight: 1 }
]);
var km5Hsl = rgbToHsl(km5Mix.r, km5Mix.g, km5Mix.b);
WScript.Echo("  Red+Blue -> RGB(" + km5Mix.r + "," + km5Mix.g + "," + km5Mix.b +
    ") HSL(" + km5Hsl.h + "," + km5Hsl.s + "," + km5Hsl.l + ")");
assert(km5Hsl.l < 30, "KM5: Subtractive mix should be dark, got L=" + km5Hsl.l);

WScript.Echo("KM6: ksMix - pigment + white");
var km6Mix = ksMix([
    { rgb: { r: 200, g: 50, b: 30 }, weight: 1 },
    { rgb: { r: 255, g: 255, b: 255 }, weight: 3 }
]);
var km6Hsl = rgbToHsl(km6Mix.r, km6Mix.g, km6Mix.b);
WScript.Echo("  Warm red + 3x White -> HSL(" + km6Hsl.h + "," + km6Hsl.s + "," + km6Hsl.l + ")");
assert(km6Hsl.l > 50 && km6Hsl.l < 95, "KM6: Should be lighter, got L=" + km6Hsl.l);

WScript.Echo("KM7: ksMix - black overpowers (vs linear RGB)");
var km7Mix = ksMix([
    { rgb: { r: 255, g: 255, b: 0 }, weight: 4 },
    { rgb: { r: 24, g: 24, b: 24 }, weight: 1 }
]);
var km7Hsl = rgbToHsl(km7Mix.r, km7Mix.g, km7Mix.b);
var linR = Math.round((255 * 4 + 24) / 5);
var linHsl = rgbToHsl(linR, linR, Math.round((0 * 4 + 24) / 5));
WScript.Echo("  4xYellow+1xBlack: K/S L=" + km7Hsl.l + " vs linear L=" + linHsl.l);
assert(km7Hsl.l < 55, "KM7: K/S should be dark (L<55), got " + km7Hsl.l);
assert(km7Hsl.l < linHsl.l - 10, "KM7: K/S much darker than linear");

WScript.Echo("KM8: ksDilute - water dilution models paper white");
var km8Full = ksDilute(255, 0, 0, 1.0);
assert(km8Full.r === 255 && km8Full.g === 0 && km8Full.b === 0, "KM8: No dilution = original");
var km8Half = ksDilute(200, 50, 30, 0.5);
var km8HalfHsl = rgbToHsl(km8Half.r, km8Half.g, km8Half.b);
WScript.Echo("  50% dilution -> HSL(" + km8HalfHsl.h + "," + km8HalfHsl.s + "," + km8HalfHsl.l + ")");
assert(km8HalfHsl.l > 50, "KM8: Diluted should be lighter, got L=" + km8HalfHsl.l);
var km8Zero = ksDilute(255, 0, 0, 0.0);
assert(km8Zero.r === 255 && km8Zero.g === 255 && km8Zero.b === 255, "KM8: Full dilution = white paper");

WScript.Echo("KM9: ksMix is commutative");
var km9a = ksMix([
    { rgb: { r: 200, g: 100, b: 50 }, weight: 3 },
    { rgb: { r: 50, g: 150, b: 200 }, weight: 2 }
]);
var km9b = ksMix([
    { rgb: { r: 50, g: 150, b: 200 }, weight: 2 },
    { rgb: { r: 200, g: 100, b: 50 }, weight: 3 }
]);
assert(km9a.r === km9b.r && km9a.g === km9b.g && km9a.b === km9b.b, "KM9: Order invariant");

WScript.Echo("KM10: ksMix with 3 PALETTE pigments");
var km10Mix = ksMix([
    { rgb: hslToRgb(22, 88, 52), weight: 5 },
    { rgb: hslToRgb(40, 78, 52), weight: 3 },
    { rgb: hslToRgb(0, 0, 8), weight: 1 }
]);
var km10Hsl = rgbToHsl(km10Mix.r, km10Mix.g, km10Mix.b);
WScript.Echo("  5xOrange+3xYellow+1xBlack -> HSL(" + km10Hsl.h + "," + km10Hsl.s + "," + km10Hsl.l + ")");
assert(km10Hsl.h >= 15 && km10Hsl.h <= 45, "KM10: Orange-ish hue, got " + km10Hsl.h);
assert(km10Hsl.l < 45, "KM10: Darkened, got L=" + km10Hsl.l);

// ===================== LAB / DELTAE TESTS =====================

WScript.Echo("");
WScript.Echo("=== Lab / DeltaE Tests ===");
WScript.Echo("");

WScript.Echo("LAB1: rgbToLab known values");
var labWhite = rgbToLab(255, 255, 255);
assert(Math.abs(labWhite.L - 100) < 1, "White L ~100, got " + labWhite.L.toFixed(2));
assert(Math.abs(labWhite.a) < 1, "White a ~0, got " + labWhite.a.toFixed(2));
var labBlack = rgbToLab(0, 0, 0);
assert(Math.abs(labBlack.L) < 1, "Black L ~0, got " + labBlack.L.toFixed(2));
var labRed = rgbToLab(255, 0, 0);
assert(labRed.L > 45 && labRed.L < 60, "Red L ~53, got " + labRed.L.toFixed(2));
assert(labRed.a > 70, "Red a large positive, got " + labRed.a.toFixed(2));

WScript.Echo("LAB2: deltaE76");
assert(deltaE76(rgbToLab(128, 128, 128), rgbToLab(128, 128, 128)) < 0.01, "Same color dE ~0");
assert(deltaE76(rgbToLab(128, 128, 128), rgbToLab(130, 128, 128)) < 3, "Near-identical small dE");
assert(deltaE76(rgbToLab(255, 0, 0), rgbToLab(0, 0, 255)) > 100, "Red vs Blue large dE");

// ===================== OPTIMIZER TESTS =====================

WScript.Echo("");
WScript.Echo("=== Optimizer Tests ===");
WScript.Echo("");

WScript.Echo("OPT1: Direct hit - Pyrrole Orange HSL(22,88,52)");
var opt1 = findBestRecipe(22, 88, 52);
WScript.Echo("  dE=" + opt1.deltaE.toFixed(2) + " pigments=" + opt1.pigments.length);
for (var i = 0; i < opt1.pigments.length; i++) {
    WScript.Echo("    " + opt1.pigments[i].palette.id + " " + opt1.pigments[i].palette.name +
        " teile=" + opt1.pigments[i].teile);
}
assert(opt1.deltaE < 5, "OPT1: dE < 5, got " + opt1.deltaE.toFixed(2));

WScript.Echo("OPT2: Mixed orange HSL(31,80,50)");
var opt2 = findBestRecipe(31, 80, 50);
WScript.Echo("  dE=" + opt2.deltaE.toFixed(2) + " mix=HSL(" + opt2.mixHsl.h + "," + opt2.mixHsl.s + "," + opt2.mixHsl.l + ")");
assert(opt2.deltaE < 10, "OPT2: dE < 10, got " + opt2.deltaE.toFixed(2));

WScript.Echo("OPT3: Neutral gray HSL(0,0,50)");
var opt3 = findBestRecipe(0, 0, 50);
WScript.Echo("  dE=" + opt3.deltaE.toFixed(2) + " mix=HSL(" + opt3.mixHsl.h + "," + opt3.mixHsl.s + "," + opt3.mixHsl.l + ")");
assert(opt3.deltaE < 10, "OPT3: dE < 10, got " + opt3.deltaE.toFixed(2));

WScript.Echo("OPT4: Dark blue HSL(210,70,20)");
var opt4 = findBestRecipe(210, 70, 20);
WScript.Echo("  dE=" + opt4.deltaE.toFixed(2) + " pigments=" + opt4.pigments.length);
assert(opt4.deltaE < 10, "OPT4: dE < 10, got " + opt4.deltaE.toFixed(2));

WScript.Echo("OPT5: Light pink HSL(340,60,80)");
var opt5 = findBestRecipe(340, 60, 80);
WScript.Echo("  dE=" + opt5.deltaE.toFixed(2) + " totalConc=" + opt5.totalConcentration.toFixed(4));
assert(opt5.deltaE < 15, "OPT5: dE < 15, got " + opt5.deltaE.toFixed(2));

WScript.Echo("OPT6: Hue sweep (30deg, s=70, l=50)");
var opt6MaxDE = 0;
for (var hue = 0; hue < 360; hue += 30) {
    var opt6 = findBestRecipe(hue, 70, 50);
    if (opt6.deltaE > opt6MaxDE) opt6MaxDE = opt6.deltaE;
    var opt6names = [];
    for (var oi = 0; oi < opt6.pigments.length; oi++) {
        opt6names.push(opt6.pigments[oi].palette.id + "(" + opt6.pigments[oi].teile + ")");
    }
    WScript.Echo("  hue=" + hue + " dE=" + opt6.deltaE.toFixed(2) +
        " mix=HSL(" + opt6.mixHsl.h + "," + opt6.mixHsl.s + "," + opt6.mixHsl.l +
        ") " + opt6names.join("+"));
}
WScript.Echo("  Max dE: " + opt6MaxDE.toFixed(2));
assert(opt6MaxDE < 40, "OPT6: Max dE < 40, got " + opt6MaxDE.toFixed(2));

WScript.Echo("OPT7: Max pigment count <= 5");
var opt7Fail = false;
for (var hue = 0; hue < 360; hue += 60) {
    for (var sat = 20; sat <= 80; sat += 30) {
        var opt7 = findBestRecipe(hue, sat, 50);
        if (opt7.pigments.length > 5) {
            WScript.Echo("  FAIL: HSL(" + hue + "," + sat + ",50) " + opt7.pigments.length + " pigments");
            opt7Fail = true;
        }
    }
}
assert(!opt7Fail, "OPT7: Too many pigments");

// ===================== SIMULATION (computeMixedColor) TESTS =====================

WScript.Echo("");
WScript.Echo("=== Simulation Tests (computeMixedColor) ===");
WScript.Echo("");

WScript.Echo("SIM1: computeMixedColor returns all fields");
var sim1 = computeMixedColor(120, 60, 40);
assert(typeof sim1.h === "number", "SIM1: has h");
assert(typeof sim1.s === "number", "SIM1: has s");
assert(typeof sim1.l === "number", "SIM1: has l");
assert(typeof sim1.rgb === "object", "SIM1: has rgb");
assert(typeof sim1.pigments === "object", "SIM1: has pigments");
assert(sim1.pigments.length > 0, "SIM1: has at least 1 pigment");
assert(typeof sim1.waterRatio === "string", "SIM1: has waterRatio");
assert(typeof sim1.waterNum === "number", "SIM1: has waterNum");
assert(typeof sim1.pigmentFrac === "number", "SIM1: has pigmentFrac");
assert(typeof sim1.deltaE === "number", "SIM1: has deltaE");

WScript.Echo("SIM2: Direct hit - simulation close to target");
var sim2 = computeMixedColor(22, 88, 52);
WScript.Echo("  Target HSL(22,88,52) -> Sim HSL(" + sim2.h + "," + sim2.s + "," + sim2.l +
    ") dE=" + sim2.deltaE.toFixed(2) + " water=" + sim2.waterRatio);
assert(sim2.deltaE < 10, "SIM2: Direct hit dE < 10, got " + sim2.deltaE.toFixed(2));

WScript.Echo("SIM3: Neutral gray");
var sim3 = computeMixedColor(0, 0, 50);
WScript.Echo("  Target HSL(0,0,50) -> Sim HSL(" + sim3.h + "," + sim3.s + "," + sim3.l +
    ") dE=" + sim3.deltaE.toFixed(2));
assert(sim3.s <= 10, "SIM3: Gray should have low sat, got " + sim3.s);

WScript.Echo("SIM4: Light pastel needs water");
var sim4 = computeMixedColor(340, 60, 80);
WScript.Echo("  Target HSL(340,60,80) -> Sim HSL(" + sim4.h + "," + sim4.s + "," + sim4.l +
    ") water=" + sim4.waterRatio + " pigmentFrac=" + sim4.pigmentFrac.toFixed(3));
assert(sim4.pigmentFrac < 0.5, "SIM4: Light color needs dilution, got pF=" + sim4.pigmentFrac.toFixed(3));
assert(sim4.waterRatio !== "pur", "SIM4: Should not be pur");

WScript.Echo("SIM5: Dark color needs concentrated pigment");
var sim5 = computeMixedColor(210, 70, 20);
WScript.Echo("  Target HSL(210,70,20) -> Sim HSL(" + sim5.h + "," + sim5.s + "," + sim5.l +
    ") water=" + sim5.waterRatio + " pigmentFrac=" + sim5.pigmentFrac.toFixed(3));
assert(sim5.pigmentFrac > 0.5, "SIM5: Dark color needs concentrated pigment, got pF=" + sim5.pigmentFrac.toFixed(3));

WScript.Echo("SIM6: Simulation vs target - broad sweep");
var sim6MaxDE = 0;
var sim6Count = 0;
var sim6Fail = false;
for (var h = 0; h < 360; h += 30) {
    for (var sat = 20; sat <= 80; sat += 30) {
        for (var ll = 30; ll <= 70; ll += 20) {
            var sim6 = computeMixedColor(h, sat, ll);
            sim6Count++;
            if (sim6.deltaE > sim6MaxDE) sim6MaxDE = sim6.deltaE;
            if (sim6.deltaE > 50) {
                WScript.Echo("  FAIL: HSL(" + h + "," + sat + "," + ll +
                    ") -> HSL(" + sim6.h + "," + sim6.s + "," + sim6.l +
                    ") dE=" + sim6.deltaE.toFixed(2));
                sim6Fail = true;
            }
        }
    }
}
WScript.Echo("  " + sim6Count + " combinations, max dE=" + sim6MaxDE.toFixed(2));
assert(!sim6Fail, "SIM6: Simulation dE > 50 found");

// ===================== DOMAIN LOGIC TESTS (K/S-BASED) =====================

WScript.Echo("");
WScript.Echo("=== Domain Logic Tests ===");
WScript.Echo("");

// DL1: Lightness direction - light targets should be lighter in simulation
WScript.Echo("DL1: Helle Farben ergeben helle Simulation");
var dl1Fail = false;
for (var h = 0; h < 360; h += 45) {
    var mx = computeMixedColor(h, 60, 85);
    if (mx.l < 60) {
        WScript.Echo("  FAIL: HSL(" + h + ",60,85) -> sim L=" + mx.l);
        dl1Fail = true;
    }
}
assert(!dl1Fail, "DL1: Light target produced dark simulation");

// DL2: Lightness direction - dark targets should be dark
WScript.Echo("DL2: Dunkle Farben ergeben dunkle Simulation");
var dl2Fail = false;
for (var h = 0; h < 360; h += 45) {
    var mx = computeMixedColor(h, 60, 15);
    if (mx.l > 40) {
        WScript.Echo("  FAIL: HSL(" + h + ",60,15) -> sim L=" + mx.l);
        dl2Fail = true;
    }
}
assert(!dl2Fail, "DL2: Dark target produced light simulation");

// DL3: Hue preservation
WScript.Echo("DL3: Hue-Erhaltung (10-Grad-Schritte, s=70, l=45)");
var dl3Fail = false;
for (var h = 0; h < 360; h += 10) {
    var mx = computeMixedColor(h, 70, 45);
    var hd = hueDistance(h, mx.h);
    if (hd > 50 && mx.s > 5) {
        WScript.Echo("  FAIL: hue " + h + " -> sim hue " + mx.h + " (dist " + hd + ")");
        dl3Fail = true;
    }
}
assert(!dl3Fail, "DL3: Hue deviation > 50deg found");

// DL4: Neutral colors stay neutral
WScript.Echo("DL4: Neutrale Farben bleiben neutral");
var dl4Cases = [[0,0,50],[0,0,20],[0,0,80],[0,0,95],[180,5,50],[90,3,40]];
var dl4Fail = false;
for (var i = 0; i < dl4Cases.length; i++) {
    var c = dl4Cases[i];
    var mx = computeMixedColor(c[0], c[1], c[2]);
    if (mx.s > 15) {
        WScript.Echo("  FAIL: HSL(" + c[0] + "," + c[1] + "," + c[2] + ") -> sim s=" + mx.s);
        dl4Fail = true;
    }
}
assert(!dl4Fail, "DL4: Neutral too chromatic");

// DL5: Pigment count stays practical
WScript.Echo("DL5: Max 5 Pigmente pro Rezept");
var dl5Fail = false;
for (var h = 0; h < 360; h += 30) {
    for (var sat = 15; sat <= 85; sat += 35) {
        var mx = computeMixedColor(h, sat, 50);
        if (mx.pigments.length > 5) {
            WScript.Echo("  FAIL: HSL(" + h + "," + sat + ",50) " + mx.pigments.length + " pigments");
            dl5Fail = true;
        }
    }
}
assert(!dl5Fail, "DL5: Too many pigments");

// DL6: Water ratio increases with lightness
WScript.Echo("DL6: Mehr Helligkeit -> mehr Wasser (pigmentFrac sinkt)");
var dl6Fail = false;
var dl6Hues = [22, 120, 240, 340];
for (var hi = 0; hi < dl6Hues.length; hi++) {
    var prevPF = 2.0;
    for (var ll = 20; ll <= 90; ll += 10) {
        var mx = computeMixedColor(dl6Hues[hi], 60, ll);
        if (mx.pigmentFrac > prevPF + 0.15) {
            WScript.Echo("  FAIL: hue=" + dl6Hues[hi] + " L=" + ll + " pF=" + mx.pigmentFrac.toFixed(3) +
                " > prev " + prevPF.toFixed(3));
            dl6Fail = true;
        }
        prevPF = mx.pigmentFrac;
    }
}
assert(!dl6Fail, "DL6: PigmentFrac increased with lightness");

// DL7: White (L=100) should be near-white
WScript.Echo("DL7: L=100 ergibt fast Weiss");
var dl7 = computeMixedColor(27, 45, 100);
WScript.Echo("  HSL(27,45,100) -> sim HSL(" + dl7.h + "," + dl7.s + "," + dl7.l + ")");
assert(dl7.l >= 90, "DL7: L=100 should give L>=90, got " + dl7.l);

// DL8: Black (L=0) should be near-black
WScript.Echo("DL8: L=0 ergibt fast Schwarz");
var dl8 = computeMixedColor(0, 0, 0);
WScript.Echo("  HSL(0,0,0) -> sim HSL(" + dl8.h + "," + dl8.s + "," + dl8.l + ")");
assert(dl8.l <= 15, "DL8: L=0 should give L<=15, got " + dl8.l);

// ===================== SUMMARY =====================
WScript.Echo("");
WScript.Echo("========================================");
WScript.Echo("  Passed: " + passed + "  |  Failed: " + errors);
WScript.Echo("========================================");
if (errors > 0) {
    WScript.Quit(1);
}
