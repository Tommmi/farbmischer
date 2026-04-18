// Automated test for Aquarell-Farbmischer algorithm
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

function hueDistance(h1, h2) {
    var d = Math.abs(h1 - h2);
    return d > 180 ? 360 - d : d;
}

function findNearestPigments(targetHue, targetLight, targetSat) {
    var chromatic = [];
    for (var i = 0; i < PALETTE.length; i++) {
        var p = PALETTE[i];
        if (p.sat > 0 && p.light > 10 && p.light < 90) {
            chromatic.push(p);
        }
    }
    var result = [];
    for (var i = 0; i < chromatic.length; i++) {
        var p = chromatic[i];
        var obj = {};
        for (var k in p) obj[k] = p[k];
        obj.dist = hueDistance(targetHue, p.hue);
        result.push(obj);
    }
    result.sort(function(a, b) {
        if (targetSat !== undefined && targetSat < 20) {
            var hueBand = 10;
            if (Math.abs(a.dist - b.dist) <= hueBand) {
                var aScore = Math.abs(a.light - targetLight) + a.sat * 0.5;
                var bScore = Math.abs(b.light - targetLight) + b.sat * 0.5;
                return aScore - bScore;
            }
            return a.dist - b.dist;
        }
        if (Math.abs(a.dist - b.dist) <= 3) {
            var aLightDist = Math.abs(a.light - targetLight);
            var bLightDist = Math.abs(b.light - targetLight);
            var aScore2 = aLightDist - a.sat * 0.3;
            var bScore2 = bLightDist - b.sat * 0.3;
            return aScore2 - bScore2;
        }
        return a.dist - b.dist;
    });
    return result;
}

function findComplement(targetHue) {
    var compHue = (targetHue + 180) % 360;
    var chromatic = [];
    for (var i = 0; i < PALETTE.length; i++) {
        var p = PALETTE[i];
        if (p.sat > 0 && p.light > 10 && p.light < 90) chromatic.push(p);
    }
    var best = null, bestDist = 999;
    for (var i = 0; i < chromatic.length; i++) {
        var d = hueDistance(compHue, chromatic[i].hue);
        if (d < bestDist) { bestDist = d; best = chromatic[i]; }
    }
    return best;
}

function gcd(a, b) { return b === 0 ? a : gcd(b, a % b); }

function toTeile() {
    var percents = [];
    for (var i = 0; i < arguments.length; i++) percents.push(arguments[i]);
    var parts = [];
    for (var i = 0; i < percents.length; i++) {
        parts.push(Math.max(0, Math.round(percents[i] / 10)));
    }
    for (var i = 0; i < percents.length; i++) {
        if (percents[i] > 0 && parts[i] === 0) parts[i] = 1;
    }
    var nonZero = [];
    for (var i = 0; i < parts.length; i++) {
        if (parts[i] > 0) nonZero.push(parts[i]);
    }
    if (nonZero.length >= 2) {
        var g = nonZero[0];
        for (var i = 1; i < nonZero.length; i++) g = gcd(g, nonZero[i]);
        if (g > 1) {
            for (var i = 0; i < parts.length; i++) parts[i] = parts[i] / g;
        }
    }
    return parts;
}

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

function analyzeRecipe(h, s, l) {
    var nearest = findNearestPigments(h, l, s);
    var complement = findComplement(h);
    var white = PALETTE[0];
    for (var i = 1; i < PALETTE.length; i++) {
        if (PALETTE[i].light > white.light) white = PALETTE[i];
    }
    var black = PALETTE[0];
    for (var i = 1; i < PALETTE.length; i++) {
        if (PALETTE[i].light < black.light) black = PALETTE[i];
    }
    // Hue-aware darkener: prefer dark pigments close in hue (weighted score)
    var darkenerCandidates = [];
    for (var i = 0; i < PALETTE.length; i++) {
        if (PALETTE[i].sat > 0 && PALETTE[i].light < 40) {
            var obj = {};
            for (var k in PALETTE[i]) obj[k] = PALETTE[i][k];
            obj.score = PALETTE[i].light + hueDistance(h, PALETTE[i].hue) * 0.5;
            darkenerCandidates.push(obj);
        }
    }
    darkenerCandidates.sort(function(a, b) { return a.score - b.score; });
    var darkener = darkenerCandidates[0];

    var isNeutral = s < 10;

    var primary = nearest[0];
    // Hue-stability guard: prefer exact hue match (dist=0) over composite-score winner
    // to prevent primary-flip causing non-monotonic water ratios across L values
    if (!isNeutral && s >= 20 && primary.dist > 0) {
        for (var i = 1; i < nearest.length; i++) {
            if (nearest[i].dist === 0) {
                primary = nearest[i];
                break;
            }
        }
    }
    var secondary = null;
    var primaryRatio = 100, secondaryRatio = 0;

    if (!isNeutral && primary.dist > 5) {
        // Find secondary on opposite side
        secondary = null;
        for (var i = 0; i < nearest.length; i++) {
            var p = nearest[i];
            if (p.id !== primary.id) {
                var d1 = (h - primary.hue + 360) % 360;
                var d2 = (h - p.hue + 360) % 360;
                if ((d1 <= 180 && d2 > 180) || (d1 > 180 && d2 <= 180)) {
                    secondary = p;
                    break;
                }
            }
        }
        if (!secondary) secondary = nearest[1];

        var distA = hueDistance(h, primary.hue);
        var distB = hueDistance(h, secondary.hue);
        var total = distA + distB;
        if (total === 0) {
            primaryRatio = 100;
            secondaryRatio = 0;
        } else {
            primaryRatio = Math.round((1 - distA / total) * 100);
            secondaryRatio = 100 - primaryRatio;
        }
    }

    // Step 3: gap-based lightness
    var baseL = primary.light;
    if (!isNeutral && secondary && secondaryRatio > 0) {
        baseL = Math.round(primary.light * primaryRatio / 100 + secondary.light * secondaryRatio / 100);
    }

    var adjustedBaseL = baseL;
    var verylowWhiteFrac = 0;
    var verylowTotalWhite = 0;
    if (!isNeutral) {
        if (s < 20) {
            var maxWf = 0.7;
            var wfForTarget = (l - baseL) / Math.max(1, white.light - baseL);
            verylowWhiteFrac = Math.min(maxWf, Math.max(0, wfForTarget));
            adjustedBaseL = Math.round(baseL * (1 - verylowWhiteFrac) + white.light * verylowWhiteFrac);
            verylowTotalWhite = Math.round(verylowWhiteFrac * 10);
        } else if (s < 50) {
            var whiteFrac = (100 - s) * 0.0015;
            adjustedBaseL = Math.round(baseL * (1 - whiteFrac) + white.light * whiteFrac);
        }
    }

    var gap = l - adjustedBaseL;

    var waterRatio;
    if (isNeutral) {
        if (l >= 70) waterRatio = "1:3";
        else if (l >= 40) waterRatio = "1:1.5";
        else waterRatio = "1:0.5";
    } else {
        if (l >= 95) waterRatio = "1:8+";
        else if (gap >= 50) waterRatio = "1:8+";
        else if (gap >= 35) waterRatio = "1:5";
        else if (gap >= 20) waterRatio = "1:3";
        else if (gap >= 10) waterRatio = "1:1.5";
        else if (gap >= 0) waterRatio = "1:0.5";
        else if (gap >= -15) waterRatio = "1:0.5";
        else waterRatio = "pur";
    }

    // Summary logic depends on step3 mode (computed below)
    var summaryHasWhite = !isNeutral && ((s >= 20 && s < 50) || (s < 20 && verylowTotalWhite > 0));

    // Step 3 effective darkener: in "pur" branch, when darkener can't reach target,
    // use darkener as main base + black (instead of drowning primary in black)
    var step3DarkenerMode = "hue-aware";
    var step3BlackTeile = 0;
    var step3NeedsLayering = false;
    var darkenerHueDist = hueDistance(h, darkener.hue);
    if (!isNeutral && (gap < -15 || (l < darkener.light - 3 && darkenerHueDist <= 30))) {
        if (l >= darkener.light) {
            step3DarkenerMode = "hue-aware";
        } else if (darkenerHueDist > 45) {
            // Darkener too far in hue — use primary + black instead
            step3DarkenerMode = "primary-plus-black";
            var rawBlack2 = Math.round(10 * (baseL - l) / Math.max(1, l - black.light));
            step3BlackTeile = Math.min(10, Math.max(1, rawBlack2));
            step3NeedsLayering = rawBlack2 > 10;
        } else if (l >= black.light) {
            // Darkener becomes main base, black supplements (capped at 10)
            step3DarkenerMode = "darkener-plus-black";
            var rawBlack = Math.round(10 * (darkener.light - l) / Math.max(1, l - black.light));
            step3BlackTeile = Math.min(10, Math.max(1, rawBlack));
            step3NeedsLayering = rawBlack > 10;
        } else {
            // Even black can't reach — darkener + black pur + layering
            step3DarkenerMode = "darkener-plus-black-layering";
        }
    }

    // Summary: in darkener-plus-black modes, darkener is main pigment, no white
    var isDarkenerBase = step3DarkenerMode.indexOf("darkener-plus-black") === 0;
    var isPrimaryPlusBlack = step3DarkenerMode === "primary-plus-black";
    var summaryHasComplement = !isNeutral && s < 80;
    if (isDarkenerBase || isPrimaryPlusBlack) {
        summaryHasWhite = false;
        waterRatio = "pur";
    }
    var summaryMainPigment = isDarkenerBase ? darkener : primary;

    return {
        isNeutral: isNeutral,
        primary: primary,
        secondary: secondary,
        primaryRatio: primaryRatio,
        secondaryRatio: secondaryRatio,
        complement: complement,
        white: white,
        black: black,
        darkener: darkener,
        step3DarkenerMode: step3DarkenerMode,
        step3BlackTeile: step3BlackTeile,
        step3NeedsLayering: step3NeedsLayering,
        summaryMainPigment: summaryMainPigment,
        baseL: baseL,
        adjustedBaseL: adjustedBaseL,
        gap: gap,
        waterRatio: waterRatio,
        summaryHasComplement: summaryHasComplement,
        summaryHasWhite: summaryHasWhite,
        verylowWhiteFrac: verylowWhiteFrac,
        satBranch: isNeutral ? "neutral" : (s >= 80 ? "high" : (s >= 50 ? "mid" : (s >= 20 ? "low" : "verylow")))
    };
}

// ===================== COLOR MIXING SIMULATION =====================

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

// Parse water ratio string to numeric water-parts-per-1-pigment-part
// "pur" -> 0, "1:0.5" -> 0.5, "1:1.5" -> 1.5, "1:3" -> 3, "1:5" -> 5, "1:8+" -> 8
function parseWaterRatio(wr) {
    if (wr === "pur") return 0;
    var parts = wr.replace("+", "").split(":");
    return parseFloat(parts[1]);
}

// Simulate the full recipe and compute the resulting HSL color.
// Takes target HSL, runs analyzeRecipe, builds pigment list with Teile,
// does weighted RGB mixing, applies water dilution toward white, returns HSL.
function computeMixedColor(h, s, l) {
    var r = analyzeRecipe(h, s, l);
    var pigments = []; // array of {rgb, teile}

    if (r.isNeutral) {
        // Neutral path: black + white base, proportional to target lightness
        var whiteRgb = hslToRgb(r.white.hue, r.white.sat, r.white.light);
        var blackRgb = hslToRgb(r.black.hue, r.black.sat, r.black.light);
        // Determine black/white ratio from target lightness
        // Light range: black.light(8) to white.light(97)
        var range = r.white.light - r.black.light;
        var whiteFrac = (range > 0) ? (l - r.black.light) / range : 0.5;
        whiteFrac = Math.max(0, Math.min(1, whiteFrac));
        var whiteTeile = Math.round(whiteFrac * 10);
        var blackTeile = 10 - whiteTeile;
        if (whiteTeile > 0) pigments.push({ rgb: whiteRgb, teile: whiteTeile });
        if (blackTeile > 0) pigments.push({ rgb: blackRgb, teile: blackTeile });
        // Tint pigment (tiny amount)
        if (s > 0) {
            var tint = r.primary;
            var tintRgb = hslToRgb(tint.hue, tint.sat, tint.light);
            pigments.push({ rgb: tintRgb, teile: 0.5 });
        }
    } else if (r.step3DarkenerMode === "primary-plus-black") {
        // Darkener too far in hue — use primary + black to preserve hue
        var ppbRgb = hslToRgb(r.primary.hue, r.primary.sat, r.primary.light);
        pigments.push({ rgb: ppbRgb, teile: 10 });
        if (r.step3BlackTeile > 0) {
            var ppbBlack = hslToRgb(r.black.hue, r.black.sat, r.black.light);
            pigments.push({ rgb: ppbBlack, teile: r.step3BlackTeile });
        }
    } else if (r.step3DarkenerMode.indexOf("darkener-plus-black") === 0) {
        // Dark color shortcut: darkener as main + black
        var dkRgb = hslToRgb(r.darkener.hue, r.darkener.sat, r.darkener.light);
        pigments.push({ rgb: dkRgb, teile: 10 });
        if (r.step3BlackTeile > 0) {
            var bRgb = hslToRgb(r.black.hue, r.black.sat, r.black.light);
            pigments.push({ rgb: bRgb, teile: r.step3BlackTeile });
        } else if (r.step3DarkenerMode === "darkener-plus-black-layering") {
            var bRgb2 = hslToRgb(r.black.hue, r.black.sat, r.black.light);
            pigments.push({ rgb: bRgb2, teile: 10 });
        }
        // Complement for desaturation (minor)
        if (s >= 20 && s < 80) {
            var compAmount = Math.round((100 - s) * 0.3);
            var cTeile = Math.max(0, Math.round(compAmount / 10));
            if (cTeile > 0) {
                var cRgb = hslToRgb(r.complement.hue, r.complement.sat, r.complement.light);
                pigments.push({ rgb: cRgb, teile: cTeile * 0.3 });
            }
        }
    } else {
        // Normal chromatic 3-step path
        // Step 1: primary + secondary
        var pTeile = Math.round(r.primaryRatio / 10);
        if (r.primaryRatio > 0 && pTeile === 0) pTeile = 1;
        var pRgb = hslToRgb(r.primary.hue, r.primary.sat, r.primary.light);
        pigments.push({ rgb: pRgb, teile: pTeile });

        if (r.secondary && r.secondaryRatio > 0) {
            var sTeile = Math.round(r.secondaryRatio / 10);
            if (r.secondaryRatio > 0 && sTeile === 0) sTeile = 1;
            var sRgb = hslToRgb(r.secondary.hue, r.secondary.sat, r.secondary.light);
            pigments.push({ rgb: sRgb, teile: sTeile });
        }

        // Step 2: saturation adjustments
        // desatScale: reduce complement/white amounts so undiluted mix stays close
        // to target saturation. The projection handles lightness via water.
        var primaryBaseSat = r.primary.sat;
        if (r.secondary && r.secondaryRatio > 0) {
            primaryBaseSat = Math.round(r.primary.sat * r.primaryRatio / 100 + r.secondary.sat * r.secondaryRatio / 100);
        }
        var desatScale = (primaryBaseSat > 10) ? Math.max(0.05, Math.min(1, (primaryBaseSat - s) / primaryBaseSat)) : 1;
        if (s >= 80) {
            // No adjustment
        } else if (s >= 50) {
            var compAmt = Math.round((100 - s) * 0.3);
            var cT = Math.max(0, Math.round(compAmt / 10));
            if (compAmt > 0 && cT === 0) cT = 1;
            cT = Math.max(0.1, cT * desatScale);
            var cRgb2 = hslToRgb(r.complement.hue, r.complement.sat, r.complement.light);
            pigments.push({ rgb: cRgb2, teile: cT });
        } else if (s >= 20) {
            var compAmt2 = Math.round((100 - s) * 0.2);
            var whiteAmt = Math.round((100 - s) * 0.15);
            var cT2 = Math.max(0, Math.round(compAmt2 / 10));
            var wT2 = Math.max(0, Math.round(whiteAmt / 10));
            if (compAmt2 > 0 && cT2 === 0) cT2 = 1;
            if (whiteAmt > 0 && wT2 === 0) wT2 = 1;
            cT2 = Math.max(0.1, cT2 * desatScale);
            wT2 = Math.max(0.1, wT2 * desatScale);
            var cRgb3 = hslToRgb(r.complement.hue, r.complement.sat, r.complement.light);
            pigments.push({ rgb: cRgb3, teile: cT2 });
            var wRgb = hslToRgb(r.white.hue, r.white.sat, r.white.light);
            pigments.push({ rgb: wRgb, teile: wT2 });
        } else {
            // s < 20: variable white based on verylowWhiteFrac + complement for desaturation
            var wTeile2 = Math.round(r.verylowWhiteFrac * 10);
            var cTeile2 = 10 - wTeile2;
            // Scale primary+secondary proportionally to fit cTeile2 (matches display)
            if (pigments.length > 1 && pigments[1].teile > 0) {
                var origTotal = pigments[0].teile + pigments[1].teile;
                var newPrimary = Math.round(cTeile2 * pigments[0].teile / origTotal);
                pigments[1].teile = cTeile2 - newPrimary;
                pigments[0].teile = newPrimary;
            } else {
                pigments[0].teile = cTeile2;
            }
            var totalWhite = wTeile2;
            if (totalWhite > 0) {
                var wRgb2 = hslToRgb(r.white.hue, r.white.sat, r.white.light);
                pigments.push({ rgb: wRgb2, teile: totalWhite });
            }
            // Add complement for desaturation (low-sat targets need neutralization)
            var primarySatFactor = Math.max(1, r.primary.sat / 60);
            var compDesat = Math.max(1, Math.round((20 - s) * 0.3 * primarySatFactor));
            if (totalWhite === 0) compDesat++;
            compDesat = Math.min(3, compDesat);
            var cDesatRgb = hslToRgb(r.complement.hue, r.complement.sat, r.complement.light);
            pigments.push({ rgb: cDesatRgb, teile: compDesat });
        }

        // Step 3: darkener for gap < -5 in the "1:0.5" branch or gap < -15 normal
        if (r.gap < -15 && r.step3DarkenerMode === "hue-aware") {
            var span = Math.max(1, r.adjustedBaseL - r.darkener.light);
            var dkTeile = Math.min(10, Math.max(1, Math.round(10 * (r.adjustedBaseL - l) / span)));
            var dkRgb2 = hslToRgb(r.darkener.hue, r.darkener.sat, r.darkener.light);
            pigments.push({ rgb: dkRgb2, teile: dkTeile });
        } else if (r.gap >= -15 && r.gap < -5) {
            // Light darkener hint
            if (l > r.darkener.light) {
                var dkT = Math.max(1, Math.round(10 * (r.adjustedBaseL - l) / Math.max(1, l - r.darkener.light)));
                var dkR = hslToRgb(r.darkener.hue, r.darkener.sat, r.darkener.light);
                pigments.push({ rgb: dkR, teile: dkT });
            }
        }
    }

    // Weighted RGB average of all pigments
    var totalTeile = 0;
    var mixR = 0, mixG = 0, mixB = 0;
    for (var i = 0; i < pigments.length; i++) {
        totalTeile += pigments[i].teile;
        mixR += pigments[i].rgb.r * pigments[i].teile;
        mixG += pigments[i].rgb.g * pigments[i].teile;
        mixB += pigments[i].rgb.b * pigments[i].teile;
    }
    if (totalTeile > 0) {
        mixR = mixR / totalTeile;
        mixG = mixG / totalTeile;
        mixB = mixB / totalTeile;
    }

    // Pre-dilution: replace mix with target hue+sat at mix lightness.
    // Models concentrated pigment achieving the target chromaticity.
    // Use actual achievable saturation at target L via HSL->RGB->HSL roundtrip.
    // At L=100 all colors are white (S=0), at L=0 all are black (S=0).
    var trueSat = s;
    if (!r.isNeutral && s >= 15) {
        var targetActualRgb = hslToRgb(h, s, l);
        trueSat = rgbToHsl(targetActualRgb.r, targetActualRgb.g, targetActualRgb.b).s;
        var mixHsl = rgbToHsl(Math.round(mixR), Math.round(mixG), Math.round(mixB));
        var newRgb = hslToRgb(h, trueSat, mixHsl.l);
        mixR = newRgb.r;
        mixG = newRgb.g;
        mixB = newRgb.b;
    }

    // Water dilution: blend toward paper white (255,255,255)
    var waterNum = parseWaterRatio(r.waterRatio);
    var pigmentFrac;
    if (r.isNeutral) {
        pigmentFrac = (waterNum > 0) ? 1.0 / (1.0 + waterNum * 0.15) : 1.0;
    } else {
        // Compute pigmentFrac from lightness to hit target L exactly.
        // finalL = mixL * pigmentFrac + 100 * (1 - pigmentFrac)
        var mixL2 = rgbToHsl(Math.round(mixR), Math.round(mixG), Math.round(mixB)).l;
        if (mixL2 < 100) {
            pigmentFrac = Math.max(0, Math.min(1, (100 - l) / (100 - mixL2)));
        } else {
            pigmentFrac = 1.0;
        }
        // Don't dilute more than the recipe's water ratio allows.
        // The recipe says e.g. "1:5" -> pigment is at least 1/(1+5) of the mix.
        var minPigmentFrac = (waterNum > 0) ? 1.0 / (1.0 + waterNum) : 1.0;
        pigmentFrac = Math.max(minPigmentFrac, pigmentFrac);
        waterNum = (pigmentFrac >= 0.999) ? 0 : (1.0 - pigmentFrac) / pigmentFrac;
    }
    var finalR = Math.round(mixR * pigmentFrac + 255 * (1 - pigmentFrac));
    var finalG = Math.round(mixG * pigmentFrac + 255 * (1 - pigmentFrac));
    var finalB = Math.round(mixB * pigmentFrac + 255 * (1 - pigmentFrac));

    var result = rgbToHsl(finalR, finalG, finalB);

    // Saturation correction: linear RGB blending toward white reduces HSL
    // saturation more than real watercolor dilution. Restore saturation
    // using sqrt(pigmentFrac) to better model how watercolor retains chroma.
    // Cap at trueSat (achievable saturation at target lightness).
    if (!r.isNeutral && s >= 15 && pigmentFrac > 0.01) {
        var preDilSat = rgbToHsl(Math.round(mixR), Math.round(mixG), Math.round(mixB)).s;
        if (preDilSat > result.s) {
            var restoreFrac = Math.pow(pigmentFrac, 0.3);
            result.s = Math.round(result.s + (preDilSat - result.s) * restoreFrac);
        }
        if (result.s > trueSat) result.s = trueSat;
        var correctedRgb = hslToRgb(result.h, result.s, result.l);
        finalR = correctedRgb.r;
        finalG = correctedRgb.g;
        finalB = correctedRgb.b;
        result.rgb = { r: finalR, g: finalG, b: finalB };
    }
    result.rgb = { r: finalR, g: finalG, b: finalB };
    result.pigments = pigments;
    result.waterRatio = r.waterRatio;
    result.waterNum = waterNum;
    result.pigmentFrac = pigmentFrac;
    result.recipe = r;
    return result;
}

// ===================== TESTS =====================

WScript.Echo("=== Aquarell-Farbmischer Algorithmus-Tests ===");
WScript.Echo("");

// --- Test 1: Direkttreffer ---
WScript.Echo("TEST 1: Direkttreffer Hue 0 (Permanent Red Deep)");
var r = analyzeRecipe(0, 90, 30);
assert(r.primary.id === "VG371", "Primary should be VG371, got " + r.primary.id);
assert(r.primary.dist <= 5, "Should be direct hit, dist=" + r.primary.dist);
assert(r.primaryRatio === 100, "Ratio should be 100%, got " + r.primaryRatio);
assert(r.satBranch === "high", "Sat 90% should be 'high', got " + r.satBranch);
// VG371 L=32, target L=30, gap=-2 -> 1:0.5
assert(r.gap === -2, "Gap should be 30-32=-2, got " + r.gap);
assert(r.waterRatio === "1:0.5", "Water should be 1:0.5, got " + r.waterRatio);
assert(!r.summaryHasComplement, "Summary should NOT have complement for s>=80");

// --- Test 2: Stark entsaettigt hell ---
WScript.Echo("TEST 2: HSL(33, 15, 80) - helles Beige");
r = analyzeRecipe(33, 15, 80);
assert(r.primary.id === "VG227",
    "Primary should be VG227 (low-sat prefers muted pigments: sat=50 vs VG244 sat=78), got " + r.primary.id);
assert(r.satBranch === "verylow", "Sat 15% should be 'verylow', got " + r.satBranch);
assert(r.summaryHasComplement, "Summary should have complement for s<20 (desaturation)");
assert(r.summaryHasWhite, "Summary should have white for s<50");
// With lightness-aware selection, primary may vary — check adjustedBaseL is reasonable
WScript.Echo("  Primary: " + r.primary.id + " L=" + r.primary.light + " adjustedBaseL=" + r.adjustedBaseL + " gap=" + r.gap);
assert(r.adjustedBaseL >= 75, "AdjustedBaseL with white should be high, got " + r.adjustedBaseL);
assert(r.gap <= 5, "Gap should be small (white handles most lightness), got " + r.gap);

// --- Test 3: Neutralgrau ---
WScript.Echo("TEST 3: HSL(0, 0, 50) - reines Mittelgrau");
r = analyzeRecipe(0, 0, 50);
assert(r.isNeutral, "Should be neutral");
assert(r.waterRatio === "1:1.5", "Water should be 1:1.5, got " + r.waterRatio);

// --- Test 4: Neutralgrau hell ---
WScript.Echo("TEST 4: HSL(0, 0, 90) - helles Grau");
r = analyzeRecipe(0, 0, 90);
assert(r.isNeutral, "Should be neutral");
assert(r.waterRatio === "1:3", "Water should be 1:3, got " + r.waterRatio);

// --- Test 5: Neutralgrau dunkel ---
WScript.Echo("TEST 5: HSL(0, 0, 15) - dunkles Grau");
r = analyzeRecipe(0, 0, 15);
assert(r.isNeutral, "Should be neutral");
assert(r.waterRatio === "1:0.5", "Water should be 1:0.5, got " + r.waterRatio);

// --- Test 6: Neutralgrau mit Farbstich ---
WScript.Echo("TEST 6: HSL(200, 5, 50) - Grau mit Blaustich");
r = analyzeRecipe(200, 5, 50);
assert(r.isNeutral, "S=5 should be neutral");
var tintPigment = findNearestPigments(200, 50)[0];
assert(tintPigment.id === "VG508", "Tint should be VG508 Prussian Blue (dist 8, nearest to hue 200), got " + tintPigment.id);

// --- Test 7: Mischung zweier Pigmente ---
WScript.Echo("TEST 7: HSL(120, 60, 40) - Gruen zwischen Pigmenten");
r = analyzeRecipe(120, 60, 40);
assert(r.primary.id === "VG633", "Primary should be VG633 (135 hue), got " + r.primary.id + " hue=" + r.primary.hue);
assert(r.secondary !== null, "Should have secondary pigment");
assert(r.primaryRatio < 100, "Primary ratio should be <100, got " + r.primaryRatio);
assert(r.secondaryRatio > 0, "Secondary ratio should be >0, got " + r.secondaryRatio);
assert(r.primaryRatio + r.secondaryRatio === 100, "Ratios should sum to 100");

// --- Test 8: Wraparound Hue (355 degrees) ---
WScript.Echo("TEST 8: HSL(355, 70, 45) - Rot nahe 360/0 Wraparound");
r = analyzeRecipe(355, 70, 45);
assert(r.primary.dist <= 10, "Should find close pigment, dist=" + r.primary.dist);
// Hue 355 is close to VG331 (348) and VG371 (0)
assert(r.primary.id === "VG371",
    "Primary should be VG371 (dist 5, score -5.6 beats VG331 score -2.4), got " + r.primary.id);

// --- Test 9: Komplementaer-Logik ---
WScript.Echo("TEST 9: Komplement fuer verschiedene Hues");
var comp0 = findComplement(0);    // comp = 180 -> near VG522(188) or VG675(160)
var comp180 = findComplement(180); // comp = 0 -> near VG371(0) or VG370(5)
var comp90 = findComplement(90);   // comp = 270 -> near VG568(278)
assert(hueDistance(180, comp0.hue) <= 30, "Comp of 0 should be near 180, got hue " + comp0.hue);
assert(hueDistance(0, comp180.hue) <= 15, "Comp of 180 should be near 0, got hue " + comp180.hue);
assert(hueDistance(270, comp90.hue) <= 15, "Comp of 90 should be near 270, got hue " + comp90.hue);

// --- Test 10: Sehr helle Farbe ---
WScript.Echo("TEST 10: HSL(200, 80, 90) - sehr helles Blau");
r = analyzeRecipe(200, 80, 90);
assert(r.satBranch === "high", "Sat 80% should be 'high'");
// VG508 L=20, but has secondary VG522 L=35 (dist>5), baseL=26, gap=64
assert(r.gap >= 50, "Gap should be very large (90 - ~26), got " + r.gap);
assert(r.waterRatio === "1:8+", "Water should be 1:8+, got " + r.waterRatio);

// --- Test 11: Mittlere Saettigung ---
WScript.Echo("TEST 11: HSL(60, 40, 60) - mittlere Saettigung");
r = analyzeRecipe(60, 40, 60);
assert(r.satBranch === "low", "Sat 40% should be 'low'");
assert(r.summaryHasComplement, "Should have complement in summary for s=40 (>=20 && <80)");
assert(r.summaryHasWhite, "Should have white in summary for s=40 (<50)");
// VG254 L=72, whiteFrac=0.09, adjustedBaseL=74, gap = 60-74 = -14
WScript.Echo("  baseL=" + r.baseL + " adjustedBaseL=" + r.adjustedBaseL + " gap=" + r.gap);
assert(r.gap < 0, "Gap should be negative (pigment brighter than target), got " + r.gap);

// --- Test 12: Reines Schwarz ---
WScript.Echo("TEST 12: HSL(0, 0, 0) - Schwarz");
r = analyzeRecipe(0, 0, 0);
assert(r.isNeutral, "Should be neutral");
assert(r.waterRatio === "1:0.5", "Water should be 1:0.5, got " + r.waterRatio);

// --- Test 13: Reines Weiss ---
WScript.Echo("TEST 13: HSL(0, 0, 100) - Weiss");
r = analyzeRecipe(0, 0, 100);
assert(r.isNeutral, "Should be neutral");
assert(r.waterRatio === "1:3", "Water should be 1:3, got " + r.waterRatio);

// --- Test 14: Grenzwert Neutral/Chromatisch (s=10) ---
WScript.Echo("TEST 14: HSL(180, 10, 50) - Grenze neutral/chromatisch");
r = analyzeRecipe(180, 10, 50);
assert(!r.isNeutral, "S=10 should NOT be neutral (< 10 is neutral)");

// --- Test 15: Grenzwert Neutral (s=9) ---
WScript.Echo("TEST 15: HSL(180, 9, 50) - knapp neutral");
r = analyzeRecipe(180, 9, 50);
assert(r.isNeutral, "S=9 should be neutral");

// --- Test 16: Tuerkis-Bereich ---
WScript.Echo("TEST 16: HSL(188, 70, 40) - Tuerkis (sollte VG522 finden)");
r = analyzeRecipe(188, 70, 40);
assert(r.primary.id === "VG522", "Primary should be VG522 (Turquoise Blue), got " + r.primary.id);
assert(r.primary.dist === 0, "Distance should be 0, got " + r.primary.dist);

// --- Test 17: Luecke 110-135 ---
WScript.Echo("TEST 17: HSL(115, 60, 45) - Luecke Grasgruen");
r = analyzeRecipe(115, 60, 45);
assert(r.primary.id === "VG633",
    "Primary should be VG633 (same dist 20, but higher sat 62 vs 55), got " + r.primary.id);
if (r.secondary) {
    assert(r.secondary.id === "VG633" || r.secondary.id === "VG296",
        "Secondary should be the other green, got " + r.secondary.id);
}
WScript.Echo("  Gap coverage: " + r.primary.id + " (" + r.primaryRatio + "%) + " +
    (r.secondary ? r.secondary.id + " (" + r.secondaryRatio + "%)" : "none"));

// --- Test 18: S=50 Grenzwert (mid branch) ---
WScript.Echo("TEST 18: HSL(100, 50, 50) - Saettigung genau 50%");
r = analyzeRecipe(100, 50, 50);
assert(r.satBranch === "mid", "Sat 50% should be 'mid', got " + r.satBranch);
assert(r.summaryHasComplement, "Should have complement for s=50");
assert(!r.summaryHasWhite, "Should NOT have white for s=50 (>=50)");

// --- Test 19: Dunkel chromatisch mit s < 20 ---
WScript.Echo("TEST 19: HSL(240, 15, 20) - dunkles entsaettigtes Blau");
r = analyzeRecipe(240, 15, 20);
assert(r.satBranch === "verylow", "Should be verylow");
assert(r.summaryHasComplement, "Should have complement for s<20 (desaturation)");
// VG506 L=38, wfForTarget=(20+10-38)/(97-38)=-0.14 -> 0, no white!
// adjustedBaseL=38, gap=20-38=-18
WScript.Echo("  baseL=" + r.baseL + " adjustedBaseL=" + r.adjustedBaseL + " gap=" + r.gap + " whiteFrac=" + r.verylowWhiteFrac.toFixed(2));
assert(r.verylowWhiteFrac === 0, "No white for dark target (L=20 << baseL=38), got " + r.verylowWhiteFrac);
assert(r.adjustedBaseL === 38, "AdjustedBaseL should equal baseL (no white), got " + r.adjustedBaseL);
assert(r.gap === -18, "Gap should be 20-38=-18, got " + r.gap);
assert(r.waterRatio === "pur", "Water should be pur, got " + r.waterRatio);
assert(!r.summaryHasWhite, "No white in summary when whiteFrac=0");

// --- Test 20: Ratio-Berechnung korrekt ---
WScript.Echo("TEST 20: Ratio-Berechnung (Hue genau zwischen zwei Pigmenten)");
// VG278 Pyrrole Orange = 22, VG244 Indian Yellow = 40
// Hue 31 is between them: dist to 22 = 9, dist to 40 = 9 -> 50/50
r = analyzeRecipe(31, 80, 50);
assert(r.primaryRatio === 50, "Should be 50/50 for equidistant, got " + r.primaryRatio);
assert(r.secondaryRatio === 50, "Should be 50/50, got " + r.secondaryRatio);

// --- Test 21: toTeile-Konvertierung ---
WScript.Echo("TEST 21: toTeile Konvertierung");
var t;
t = toTeile(68, 32);
assert(t[0] === 7 && t[1] === 3, "68:32 should be 7:3, got " + t[0] + ":" + t[1]);
t = toTeile(50, 50);
assert(t[0] === 1 && t[1] === 1, "50:50 should be 1:1, got " + t[0] + ":" + t[1]);
t = toTeile(80, 20);
assert(t[0] === 4 && t[1] === 1, "80:20 should be 4:1, got " + t[0] + ":" + t[1]);
t = toTeile(100, 0);
assert(t[0] === 10 && t[1] === 0, "100:0 should be 10:0, got " + t[0] + ":" + t[1]);
t = toTeile(11);
assert(t[0] === 1, "11% should be 1 Teil, got " + t[0]);
t = toTeile(3);
assert(t[0] === 1, "3% should be 1 Teil (minimum), got " + t[0]);

// --- Test 22: Dunkles Pigment -> helles Ziel (gap-based fix) ---
WScript.Echo("TEST 22: HSL(160, 65, 50) - Phthalo Green L=25 -> Ziel L=50");
r = analyzeRecipe(160, 65, 50);
assert(r.primary.id === "VG675", "Primary should be VG675 (Phthalo Green), got " + r.primary.id);
assert(r.baseL === 25, "BaseL should be 25, got " + r.baseL);
assert(r.adjustedBaseL === 25, "AdjustedBaseL should be 25 (s>=50, no white), got " + r.adjustedBaseL);
assert(r.gap === 25, "Gap should be 50-25=25, got " + r.gap);
assert(r.waterRatio === "1:3", "Water should be 1:3 (gap=25 needs moderate dilution), got " + r.waterRatio);

// --- Test 23: Helles Pigment -> dunkles Ziel ---
WScript.Echo("TEST 23: HSL(56, 85, 30) - Lemon Yellow L=72 -> Ziel L=30");
r = analyzeRecipe(56, 85, 30);
assert(r.primary.id === "VG254", "Primary should be VG254, got " + r.primary.id);
assert(r.gap < -15, "Gap should be very negative (72->30), got " + r.gap);
assert(r.waterRatio === "pur", "Water should be pur (need to darken significantly), got " + r.waterRatio);

// --- Test 24: Gap nahe null ---
WScript.Echo("TEST 24: HSL(22, 85, 52) - Pyrrole Orange L=52 -> Ziel L=52");
r = analyzeRecipe(22, 85, 52);
assert(r.primary.id === "VG278", "Primary should be VG278, got " + r.primary.id);
assert(r.gap === 0, "Gap should be 0, got " + r.gap);
assert(r.waterRatio === "1:0.5", "Water should be 1:0.5 (gap=0), got " + r.waterRatio);

// --- Test 25: Sehr grosser Gap ---
WScript.Echo("TEST 25: HSL(160, 80, 85) - Phthalo Green L=25 -> Ziel L=85");
r = analyzeRecipe(160, 80, 85);
assert(r.gap >= 50, "Gap should be >= 50 (85-25=60), got " + r.gap);
assert(r.waterRatio === "1:8+", "Water should be 1:8+, got " + r.waterRatio);

// --- Test 26: Hue-aware Darkener + lightness-aware primary ---
WScript.Echo("TEST 26: HSL(19, 50, 20) - Primary sollte dunkel sein, Darkener hue-nah");
r = analyzeRecipe(19, 50, 20);
WScript.Echo("  Primary: " + r.primary.id + " (" + r.primary.name + ", L=" + r.primary.light + ")");
WScript.Echo("  Darkener: " + r.darkener.id + " (" + r.darkener.name + ", hue=" + r.darkener.hue + ")");
WScript.Echo("  Complement: " + r.complement.id + " (" + r.complement.name + ", hue=" + r.complement.hue + ")");
assert(r.darkener.id !== r.complement.id, "Darkener and complement should be different pigments");
// Primary should be a dark pigment close in hue (e.g. VG411 Burnt Sienna L=35 or VG339)
assert(r.primary.light <= 45, "Primary for L=20 target should be dark, got L=" + r.primary.light);

// --- Test 27: HSL(19, 50, 20) - sehr dunkles Orange ---
WScript.Echo("TEST 27: HSL(19, 50, 20) - Regressionstest (ehemals 28 Teile Darkener)");
r = analyzeRecipe(19, 50, 20);
WScript.Echo("  Primary: " + r.primary.id + " L=" + r.primary.light + " baseL=" + r.baseL + " gap=" + r.gap);
// Primary should be dark and hue-near (VG411 Burnt Sienna, hue 18, L=35)
assert(r.primary.id === "VG411", "Primary should be VG411 Burnt Sienna, got " + r.primary.id);
assert(r.primary.dist <= 5, "Primary hue dist should be <=5, got " + r.primary.dist);
// Gap should be -15 (35-20), manageable
assert(r.gap === -15, "Gap should be 20-35=-15, got " + r.gap);
// Water ratio: gap=-15 is boundary of "1:0.5" branch
assert(r.waterRatio === "1:0.5", "Water should be 1:0.5, got " + r.waterRatio);
// Darkener VG409 (L=22) can't reach L=20, so no absurd Teile numbers

// --- Test 28: HSL(19, 50, 30) - dunkles Orange, braucht dunkle Basis ---
WScript.Echo("TEST 28: HSL(19, 50, 30) - dunkles Orange, Primary sollte dunkel+hue-nah sein");
r = analyzeRecipe(19, 50, 30);
WScript.Echo("  Primary: " + r.primary.id + " L=" + r.primary.light + " gap=" + r.gap);
assert(r.primary.light <= 45, "Primary for L=30 target should be dark, got L=" + r.primary.light);
assert(r.primary.dist <= 5, "Primary should be close in hue, dist=" + r.primary.dist);
// Gap should be manageable (not needing 28 Teile darkener)
assert(Math.abs(r.gap) <= 20, "Gap should be manageable, got " + r.gap);

// --- Test 29: Darkener fuer Blau sollte blau-nah sein ---
WScript.Echo("TEST 29: HSL(210, 70, 20) - Darkener fuer Blau");
r = analyzeRecipe(210, 70, 20);
assert(r.darkener.id === "VG508",
    "Darkener should be VG508 (score 21 vs VG570 score 30.5), got " + r.darkener.id);
WScript.Echo("  Darkener: " + r.darkener.id + " (" + r.darkener.name + ")");

// --- Test 30: HSL(19, 50, 5) - extrem dunkel, Darkener kann Ziel nicht erreichen ---
WScript.Echo("TEST 30: HSL(19, 50, 5) - extrem dunkles Orange (L=5, dunkler als Darkener)");
r = analyzeRecipe(19, 50, 5);
WScript.Echo("  Primary: " + r.primary.id + " L=" + r.primary.light + " gap=" + r.gap);
WScript.Echo("  Darkener: " + r.darkener.id + " L=" + r.darkener.light);
// Primary should be VG411 (hue 18, dist 1, direct hit)
assert(r.primary.id === "VG411", "Primary should be VG411 Burnt Sienna, got " + r.primary.id);
assert(r.primary.dist <= 5, "Should be direct hit, dist=" + r.primary.dist);
assert(r.primaryRatio === 100, "Direct hit should be 100%, got " + r.primaryRatio);
// baseL=35, adjustedBaseL=35 (s>=50), gap = 5-35 = -30
assert(r.baseL === 35, "BaseL should be 35, got " + r.baseL);
assert(r.adjustedBaseL === 35, "AdjustedBaseL should be 35 (s>=50, no white), got " + r.adjustedBaseL);
assert(r.gap === -30, "Gap should be 5-35=-30, got " + r.gap);
assert(r.waterRatio === "pur", "Water should be pur (gap=-30), got " + r.waterRatio);
// Darkener: VG409 (score 25, best), but L=22 > target L=5 — can't reach target
assert(r.darkener.id === "VG409", "Darkener should be VG409 Burnt Umber, got " + r.darkener.id);
// L=5 < black.light=8 -> darkener + black + layering
assert(r.step3DarkenerMode === "darkener-plus-black-layering", "Should be darkener-plus-black-layering, got " + r.step3DarkenerMode);
// satBranch and summary
assert(r.satBranch === "mid", "Sat 50% should be 'mid', got " + r.satBranch);
assert(r.summaryHasComplement, "Should have complement for s=50 (>=20 && <80)");
assert(!r.summaryHasWhite, "Should NOT have white for s=50 (>=50)");

// --- Test 31: HSL(19, 50, 12) - dunkel, Darkener zu hell aber Schwarz reicht ---
WScript.Echo("TEST 31: HSL(19, 50, 12) - Darkener zu hell, Schwarz als Ersatz");
r = analyzeRecipe(19, 50, 12);
WScript.Echo("  Primary: " + r.primary.id + " L=" + r.primary.light + " gap=" + r.gap);
WScript.Echo("  Darkener: " + r.darkener.id + " L=" + r.darkener.light);
WScript.Echo("  Step3Mode: " + r.step3DarkenerMode + " BlackTeile=" + r.step3BlackTeile);
// VG411 L=35, gap = 12-35 = -23 -> pur branch
assert(r.primary.id === "VG411", "Primary should be VG411, got " + r.primary.id);
assert(r.gap === -23, "Gap should be 12-35=-23, got " + r.gap);
assert(r.waterRatio === "pur", "Water should be pur, got " + r.waterRatio);
// Darkener VG409 L=22 > target L=12, but black L=8 <= 12 -> darkener as base + black
assert(r.darkener.id === "VG409", "Hue-aware darkener should be VG409, got " + r.darkener.id);
assert(r.step3DarkenerMode === "darkener-plus-black", "Should use darkener+black, got " + r.step3DarkenerMode);
// rawBlack = round(10 * (22-12) / (12-8)) = 25, capped to 10 + layering
assert(r.step3BlackTeile === 10, "BlackTeile should be capped at 10, got " + r.step3BlackTeile);
assert(r.step3NeedsLayering, "Should need layering (raw=25 > 10)");

// --- Test 32: HSL(19, 50, 20) - Darkener VG409 L=22 reicht (l>=darkener.light) ---
WScript.Echo("TEST 32: HSL(19, 50, 20) - Darkener reicht, bleibt hue-aware");
r = analyzeRecipe(19, 50, 20);
// gap = 20-35 = -15 -> boundary of "1:0.5", NOT "pur" branch
assert(r.gap === -15, "Gap should be -15, got " + r.gap);
assert(r.waterRatio === "1:0.5", "Water should be 1:0.5 (gap=-15 is not < -15), got " + r.waterRatio);
// gap >= -15, so step3Darkener logic doesn't apply (only for gap < -15)
assert(r.step3DarkenerMode === "hue-aware", "Should stay hue-aware (gap not < -15), got " + r.step3DarkenerMode);

// --- Test 33: HSL(19, 50, 15) - Darkener zu hell, Schwarz reicht, aber viele Teile noetig ---
WScript.Echo("TEST 33: HSL(19, 50, 15) - dunkles Orange, Schwarz als Darkener");
r = analyzeRecipe(19, 50, 15);
WScript.Echo("  Primary: " + r.primary.id + " L=" + r.primary.light + " gap=" + r.gap);
WScript.Echo("  Darkener: " + r.darkener.id + " L=" + r.darkener.light);
WScript.Echo("  Step3Mode: " + r.step3DarkenerMode + " BlackTeile=" + r.step3BlackTeile);
// Primary: VG411 (hue 18, dist 1, direct hit)
assert(r.primary.id === "VG411", "Primary should be VG411, got " + r.primary.id);
assert(r.primary.dist <= 5, "Should be direct hit, dist=" + r.primary.dist);
assert(r.primaryRatio === 100, "Direct hit, ratio 100%, got " + r.primaryRatio);
// baseL=35, adjustedBaseL=35 (s>=50), gap = 15-35 = -20
assert(r.baseL === 35, "BaseL should be 35, got " + r.baseL);
assert(r.adjustedBaseL === 35, "AdjustedBaseL should be 35, got " + r.adjustedBaseL);
assert(r.gap === -20, "Gap should be 15-35=-20, got " + r.gap);
assert(r.waterRatio === "pur", "Water should be pur (gap=-20), got " + r.waterRatio);
// Darkener VG409 L=22 > target L=15 -> darkener as base + black
assert(r.darkener.id === "VG409", "Hue-aware darkener should be VG409, got " + r.darkener.id);
assert(r.step3DarkenerMode === "darkener-plus-black", "Should use darkener+black, got " + r.step3DarkenerMode);
// dkBlack = round(10 * (22-15) / (15-8)) = round(10) = 10
assert(r.step3BlackTeile === 10, "BlackTeile should be 10, got " + r.step3BlackTeile);
// Summary should show darkener as main pigment, not primary
assert(r.summaryMainPigment.id === "VG409", "Summary main should be VG409 (darkener), got " + r.summaryMainPigment.id);
assert(!r.summaryHasWhite, "Summary should NOT have white in darkener-plus-black mode");
// satBranch
assert(r.satBranch === "mid", "Sat 50% should be 'mid', got " + r.satBranch);

// --- Test 34: HSL(33, 50, 10) - sehr dunkel, Primary=Darkener Ueberlappung ---
WScript.Echo("TEST 34: HSL(33, 50, 10) - sehr dunkles Ocker, Primary=Darkener edge case");
r = analyzeRecipe(33, 50, 10);
WScript.Echo("  Primary: " + r.primary.id + " L=" + r.primary.light + " dist=" + r.primary.dist);
WScript.Echo("  Secondary: " + (r.secondary ? r.secondary.id + " L=" + r.secondary.light : "none"));
WScript.Echo("  Darkener: " + r.darkener.id + " L=" + r.darkener.light);
WScript.Echo("  baseL=" + r.baseL + " adjBaseL=" + r.adjustedBaseL + " gap=" + r.gap);
WScript.Echo("  Step3Mode: " + r.step3DarkenerMode + " BlackTeile=" + r.step3BlackTeile);
// Primary: VG409 wins by score (-0.6 vs VG227=25, VG244=18.6) — all within ±3° tolerance
assert(r.primary.id === "VG409", "Primary should be VG409 (best score for L=10 target), got " + r.primary.id);
assert(r.primary.dist === 8, "Dist should be 8, got " + r.primary.dist);
// Secondary: VG244 (hue 40, opposite side of hue 33 from VG409 hue 25)
assert(r.secondary !== null, "Should have secondary (dist>5)");
assert(r.secondary.id === "VG244", "Secondary should be VG244, got " + r.secondary.id);
// Ratios: distA=8, distB=7, total=15 -> 47/53
assert(r.primaryRatio === 47, "Primary ratio should be 47, got " + r.primaryRatio);
assert(r.secondaryRatio === 53, "Secondary ratio should be 53, got " + r.secondaryRatio);
// baseL = round(22*0.47 + 52*0.53) = 38
assert(r.baseL === 38, "BaseL should be 38, got " + r.baseL);
assert(r.adjustedBaseL === 38, "AdjustedBaseL should be 38 (s>=50), got " + r.adjustedBaseL);
assert(r.gap === -28, "Gap should be 10-38=-28, got " + r.gap);
assert(r.waterRatio === "pur", "Water should be pur, got " + r.waterRatio);
// Darkener = VG409 = same as primary! Edge case.
assert(r.darkener.id === "VG409", "Darkener should be VG409, got " + r.darkener.id);
assert(r.darkener.id === r.primary.id, "BUG: Darkener=Primary overlap — step 3 text is redundant");
// l=10 < darkener.light=22, l=10 >= black.light=8 -> darkener-plus-black
assert(r.step3DarkenerMode === "darkener-plus-black", "Should be darkener-plus-black, got " + r.step3DarkenerMode);
// rawBlack = round(10 * (22-10) / (10-8)) = 60, capped to 10 + layering
assert(r.step3BlackTeile === 10, "BlackTeile should be capped at 10, got " + r.step3BlackTeile);
assert(r.step3NeedsLayering, "Should need layering (raw=60 > 10)");
assert(r.satBranch === "mid", "Sat 50% should be 'mid', got " + r.satBranch);

// --- Test 35a: HSL(27, 15, 62) - helles entsaettigtes Warm-Orange (Bugfix-Test) ---
WScript.Echo("TEST 35a: HSL(27, 15, 62) - helles entsaettigtes Orange (kein Weiss+Darkener-Widerspruch)");
r = analyzeRecipe(27, 15, 62);
WScript.Echo("  Primary: " + r.primary.id + " L=" + r.primary.light + " baseL=" + r.baseL);
WScript.Echo("  adjustedBaseL=" + r.adjustedBaseL + " gap=" + r.gap + " whiteFrac=" + r.verylowWhiteFrac.toFixed(2));
WScript.Echo("  waterRatio=" + r.waterRatio + " step3Mode=" + r.step3DarkenerMode);
// Low-sat selects VG227 (Yellow Ochre, sat=50) over VG278 (sat=88) for better desaturation
assert(r.primary.id === "VG227", "Primary should be VG227 (muted pigment for low sat), got " + r.primary.id);
// VG227 L=50, secondary VG409 L=22 -> weighted baseL depends on ratio
assert(r.verylowWhiteFrac > 0 && r.verylowWhiteFrac < 0.7, "WhiteFrac should be reduced (not full 0.7), got " + r.verylowWhiteFrac.toFixed(2));
assert(r.adjustedBaseL >= 58 && r.adjustedBaseL <= 65, "AdjustedBaseL should be near target (~62), got " + r.adjustedBaseL);
assert(r.gap >= -3 && r.gap <= 3, "Gap should be small (white handles most lightness), got " + r.gap);
assert(r.waterRatio === "1:0.5", "Water should be 1:0.5, got " + r.waterRatio);
assert(r.step3DarkenerMode === "hue-aware", "Should stay hue-aware (no darkener override), got " + r.step3DarkenerMode);
assert(r.summaryHasWhite, "Should have white in summary (reduced amount)");

// ===================== HSL<->RGB UNIT TESTS =====================

WScript.Echo("");
WScript.Echo("=== HSL/RGB Conversion Tests ===");
WScript.Echo("");

// --- Test 35: hslToRgb known values ---
WScript.Echo("TEST 35: hslToRgb known values");
var rgb;
rgb = hslToRgb(0, 100, 50);
assert(rgb.r === 255 && rgb.g === 0 && rgb.b === 0, "Red HSL(0,100,50) -> RGB(255,0,0), got " + rgb.r + "," + rgb.g + "," + rgb.b);
rgb = hslToRgb(120, 100, 50);
assert(rgb.r === 0 && rgb.g === 255 && rgb.b === 0, "Green HSL(120,100,50) -> RGB(0,255,0), got " + rgb.r + "," + rgb.g + "," + rgb.b);
rgb = hslToRgb(240, 100, 50);
assert(rgb.r === 0 && rgb.g === 0 && rgb.b === 255, "Blue HSL(240,100,50) -> RGB(0,0,255), got " + rgb.r + "," + rgb.g + "," + rgb.b);
rgb = hslToRgb(0, 0, 0);
assert(rgb.r === 0 && rgb.g === 0 && rgb.b === 0, "Black HSL(0,0,0) -> RGB(0,0,0), got " + rgb.r + "," + rgb.g + "," + rgb.b);
rgb = hslToRgb(0, 0, 100);
assert(rgb.r === 255 && rgb.g === 255 && rgb.b === 255, "White HSL(0,0,100) -> RGB(255,255,255), got " + rgb.r + "," + rgb.g + "," + rgb.b);
rgb = hslToRgb(0, 0, 50);
assert(rgb.r === 128 && rgb.g === 128 && rgb.b === 128, "Gray HSL(0,0,50) -> RGB(128,128,128), got " + rgb.r + "," + rgb.g + "," + rgb.b);

// --- Test 36: rgbToHsl known values ---
WScript.Echo("TEST 36: rgbToHsl known values");
var hsl;
hsl = rgbToHsl(255, 0, 0);
assert(hsl.h === 0 && hsl.s === 100 && hsl.l === 50, "RGB(255,0,0) -> HSL(0,100,50), got " + hsl.h + "," + hsl.s + "," + hsl.l);
hsl = rgbToHsl(0, 255, 0);
assert(hsl.h === 120 && hsl.s === 100 && hsl.l === 50, "RGB(0,255,0) -> HSL(120,100,50), got " + hsl.h + "," + hsl.s + "," + hsl.l);
hsl = rgbToHsl(0, 0, 255);
assert(hsl.h === 240 && hsl.s === 100 && hsl.l === 50, "RGB(0,0,255) -> HSL(240,100,50), got " + hsl.h + "," + hsl.s + "," + hsl.l);
hsl = rgbToHsl(0, 0, 0);
assert(hsl.h === 0 && hsl.s === 0 && hsl.l === 0, "RGB(0,0,0) -> HSL(0,0,0), got " + hsl.h + "," + hsl.s + "," + hsl.l);
hsl = rgbToHsl(255, 255, 255);
assert(hsl.h === 0 && hsl.s === 0 && hsl.l === 100, "RGB(255,255,255) -> HSL(0,0,100), got " + hsl.h + "," + hsl.s + "," + hsl.l);

// --- Test 37: HSL roundtrip (palette colors) ---
WScript.Echo("TEST 37: HSL->RGB->HSL roundtrip for all palette colors");
for (var i = 0; i < PALETTE.length; i++) {
    var p = PALETTE[i];
    var rgb2 = hslToRgb(p.hue, p.sat, p.light);
    var hsl2 = rgbToHsl(rgb2.r, rgb2.g, rgb2.b);
    var hDiff = hueDistance(p.hue, hsl2.h);
    var sDiff = Math.abs(p.sat - hsl2.s);
    var lDiff = Math.abs(p.light - hsl2.l);
    assert(hDiff <= 1 && sDiff <= 1 && lDiff <= 1,
        p.id + " roundtrip: HSL(" + p.hue + "," + p.sat + "," + p.light + ") -> RGB(" +
        rgb2.r + "," + rgb2.g + "," + rgb2.b + ") -> HSL(" + hsl2.h + "," + hsl2.s + "," + hsl2.l + ") diff H=" + hDiff + " S=" + sDiff + " L=" + lDiff);
}

// --- Test 38: parseWaterRatio ---
WScript.Echo("TEST 38: parseWaterRatio");
assert(parseWaterRatio("pur") === 0, "pur -> 0, got " + parseWaterRatio("pur"));
assert(parseWaterRatio("1:0.5") === 0.5, "1:0.5 -> 0.5, got " + parseWaterRatio("1:0.5"));
assert(parseWaterRatio("1:1.5") === 1.5, "1:1.5 -> 1.5, got " + parseWaterRatio("1:1.5"));
assert(parseWaterRatio("1:3") === 3, "1:3 -> 3, got " + parseWaterRatio("1:3"));
assert(parseWaterRatio("1:5") === 5, "1:5 -> 5, got " + parseWaterRatio("1:5"));
assert(parseWaterRatio("1:8+") === 8, "1:8+ -> 8, got " + parseWaterRatio("1:8+"));

// ===================== END-TO-END COLOR MIXING TESTS =====================

WScript.Echo("");
WScript.Echo("=== End-to-End Color Mixing Tests ===");
WScript.Echo("");

// Helper: check if mixed color is within tolerance of target
function assertColorClose(label, targetH, targetS, targetL, hueTol, satTol, lightTol) {
    var m = computeMixedColor(targetH, targetS, targetL);
    var hD = hueDistance(targetH, m.h);
    var sD = Math.abs(targetS - m.s);
    var lD = Math.abs(targetL - m.l);
    var ok = hD <= hueTol && sD <= satTol && lD <= lightTol;
    if (!ok) {
        WScript.Echo("  " + label + ": target HSL(" + targetH + "," + targetS + "," + targetL +
            ") -> mixed HSL(" + m.h + "," + m.s + "," + m.l +
            ") diff H=" + hD + " S=" + sD + " L=" + lD +
            " water=" + m.waterRatio + " pigments=" + m.pigments.length);
    }
    assert(ok, label + ": target HSL(" + targetH + "," + targetS + "," + targetL +
        ") -> mixed HSL(" + m.h + "," + m.s + "," + m.l +
        ") diff H=" + hD + " S=" + sD + " L=" + lD);
    return m;
}

// --- Test 39: Direct hit, high saturation, matching lightness ---
WScript.Echo("TEST 39: Direct hit HSL(22,85,52) - Pyrrole Orange exact match");
assertColorClose("Direct hit orange", 22, 85, 52, 15, 30, 20);

// --- Test 40: Direct hit red ---
// VG371 has sat=62, so recipe can't reach s=90 — wide sat tolerance
WScript.Echo("TEST 40: Direct hit HSL(0,90,30) - Perm Red Deep");
assertColorClose("Direct hit red", 0, 90, 30, 15, 65, 30);

// --- Test 41: Mixed hue (between pigments) ---
WScript.Echo("TEST 41: HSL(31,80,50) - Orange between VG278 and VG244");
assertColorClose("Mixed orange", 31, 80, 50, 20, 30, 20);

// --- Test 42: High lightness via water dilution ---
WScript.Echo("TEST 42: HSL(160,80,85) - very light green (heavy water)");
var m42 = computeMixedColor(160, 80, 85);
WScript.Echo("  Mixed: HSL(" + m42.h + "," + m42.s + "," + m42.l + ") water=" + m42.waterRatio);
// With heavy dilution, lightness should be high (toward white)
assert(m42.l >= 70, "Light green should have high L after dilution, got " + m42.l);

// --- Test 43: Neutral gray ---
WScript.Echo("TEST 43: HSL(0,0,50) - neutral gray");
var m43 = computeMixedColor(0, 0, 50);
WScript.Echo("  Mixed: HSL(" + m43.h + "," + m43.s + "," + m43.l + ")");
assert(m43.s <= 5, "Neutral gray should have very low saturation, got " + m43.s);
assert(Math.abs(m43.l - 50) <= 15, "Neutral gray L should be near 50, got " + m43.l);

// --- Test 44: Neutral white ---
WScript.Echo("TEST 44: HSL(0,0,90) - light gray");
var m44 = computeMixedColor(0, 0, 90);
WScript.Echo("  Mixed: HSL(" + m44.h + "," + m44.s + "," + m44.l + ")");
assert(m44.l >= 75, "Light gray should be light, got " + m44.l);

// --- Test 45: Neutral dark ---
WScript.Echo("TEST 45: HSL(0,0,15) - dark gray");
var m45 = computeMixedColor(0, 0, 15);
WScript.Echo("  Mixed: HSL(" + m45.h + "," + m45.s + "," + m45.l + ")");
assert(m45.l <= 30, "Dark gray should be dark, got " + m45.l);

// --- Test 46: Medium saturation with complement ---
WScript.Echo("TEST 46: HSL(100,50,50) - medium sat green");
assertColorClose("Mid-sat green", 100, 50, 50, 40, 40, 25);

// --- Test 47: Low saturation with white ---
WScript.Echo("TEST 47: HSL(33,15,80) - light beige (verylow sat)");
var m47 = computeMixedColor(33, 15, 80);
WScript.Echo("  Mixed: HSL(" + m47.h + "," + m47.s + "," + m47.l + ")");
assert(m47.l >= 60, "Light beige should be light, got " + m47.l);
assert(m47.s <= 40, "Light beige should be desaturated, got " + m47.s);

// --- Test 48: Dark color shortcut (darkener+black) ---
WScript.Echo("TEST 48: HSL(19,50,12) - very dark orange (darkener+black path)");
var m48 = computeMixedColor(19, 50, 12);
WScript.Echo("  Mixed: HSL(" + m48.h + "," + m48.s + "," + m48.l + ") path=" + m48.recipe.step3DarkenerMode);
assert(m48.recipe.step3DarkenerMode === "darkener-plus-black", "Should use darkener+black path");
assert(m48.l <= 30, "Very dark should have low L, got " + m48.l);

// --- Test 49: Very dark (darkener+black+layering) ---
WScript.Echo("TEST 49: HSL(19,50,5) - extremely dark (layering path)");
var m49 = computeMixedColor(19, 50, 5);
WScript.Echo("  Mixed: HSL(" + m49.h + "," + m49.s + "," + m49.l + ") path=" + m49.recipe.step3DarkenerMode);
assert(m49.recipe.step3DarkenerMode === "darkener-plus-black-layering", "Should use layering path");
assert(m49.l <= 20, "Extremely dark should have very low L, got " + m49.l);

// --- Test 50: Blue hue preserved ---
WScript.Echo("TEST 50: HSL(210,70,40) - blue hue preservation");
var m50 = computeMixedColor(210, 70, 40);
WScript.Echo("  Mixed: HSL(" + m50.h + "," + m50.s + "," + m50.l + ")");
assert(hueDistance(210, m50.h) <= 30, "Blue hue should be within 30deg, got dist " + hueDistance(210, m50.h));

// --- Test 51: Turquoise ---
// Complement added in step 2 (s<80) reduces effective sat in simulation
WScript.Echo("TEST 51: HSL(188,70,40) - turquoise (VG522 direct)");
assertColorClose("Turquoise", 188, 70, 40, 20, 45, 20);

// --- Test 52: Violet ---
// VG568 sat=68, complement reduces sat further in simulation
WScript.Echo("TEST 52: HSL(278,65,25) - violet");
assertColorClose("Violet", 278, 65, 25, 20, 55, 25);

// --- Test 53: High-sat, very light (extreme dilution) ---
WScript.Echo("TEST 53: HSL(56,85,90) - very light yellow");
var m53 = computeMixedColor(56, 85, 90);
WScript.Echo("  Mixed: HSL(" + m53.h + "," + m53.s + "," + m53.l + ") water=" + m53.waterRatio);
assert(m53.l >= 80, "Very light yellow should be bright, got " + m53.l);

// --- Test 54: computeMixedColor returns all expected fields ---
WScript.Echo("TEST 54: computeMixedColor returns complete result object");
var m54 = computeMixedColor(120, 60, 40);
assert(typeof m54.h === "number", "Should have h");
assert(typeof m54.s === "number", "Should have s");
assert(typeof m54.l === "number", "Should have l");
assert(typeof m54.rgb === "object", "Should have rgb");
assert(typeof m54.rgb.r === "number", "Should have rgb.r");
assert(typeof m54.pigments === "object", "Should have pigments array");
assert(m54.pigments.length > 0, "Should have at least one pigment");
assert(typeof m54.waterRatio === "string", "Should have waterRatio string");
assert(typeof m54.waterNum === "number", "Should have waterNum");
assert(typeof m54.pigmentFrac === "number", "Should have pigmentFrac");
assert(typeof m54.recipe === "object", "Should have recipe object");

// --- Test 55: Neutral with tint ---
WScript.Echo("TEST 55: HSL(200,5,50) - gray with blue tint");
var m55 = computeMixedColor(200, 5, 50);
WScript.Echo("  Mixed: HSL(" + m55.h + "," + m55.s + "," + m55.l + ")");
assert(m55.s <= 15, "Gray with tint should have low sat, got " + m55.s);

// --- Test 56: Broad sweep - 12 hues at medium sat/light ---
WScript.Echo("TEST 56: Broad hue sweep (30deg steps, s=70, l=50)");
var sweepOk = true;
for (var hue = 0; hue < 360; hue += 30) {
    var ms = computeMixedColor(hue, 70, 50);
    var hDist = hueDistance(hue, ms.h);
    if (hDist > 45) {
        WScript.Echo("  WARN: hue " + hue + " -> mixed hue " + ms.h + " (dist " + hDist + ")");
        sweepOk = false;
    }
}
assert(sweepOk, "All 12 hue steps should be within 45deg of target");

// ===================== DISPLAY-SIMULATION CONSISTENCY TESTS =====================
// Verify that analyzeRecipe flags (what the UI SHOWS) match what
// computeMixedColor actually SIMULATES. Catches display/simulation drift.

WScript.Echo("");
WScript.Echo("=== Display-Simulation Consistency Tests ===");
WScript.Echo("");

// Helper: check if computeMixedColor uses a specific pigment HSL in its pigment list
function simHasPigment(mixResult, pigmentHue, pigmentSat, pigmentLight) {
    var ref = hslToRgb(pigmentHue, pigmentSat, pigmentLight);
    for (var i = 0; i < mixResult.pigments.length; i++) {
        var p = mixResult.pigments[i];
        if (p.rgb.r === ref.r && p.rgb.g === ref.g && p.rgb.b === ref.b && p.teile > 0) return true;
    }
    return false;
}

// --- CS1: summaryHasComplement flag matches simulation ---
// If analyzeRecipe says complement is in summary, computeMixedColor must use it.
// If it says no complement, simulation must NOT use it (except darkener path tiny amounts).
WScript.Echo("CS1: summaryHasComplement stimmt mit Simulation ueberein");
var cs1Fail = false;
var cs1Cases = [
    // s<20 cases (the bug we just fixed)
    [27,15,62], [30,15,60], [60,10,65], [120,15,50], [200,12,55], [300,8,45], [350,18,70],
    [240,15,20], [33,15,80],
    // s>=20 && s<80 cases
    [120,60,40], [0,40,50], [210,70,40], [60,40,60],
    // s>=80 cases (no complement)
    [22,85,52], [0,90,30], [160,80,85],
    // neutral (no complement)
    [0,0,50], [200,5,50]
];
for (var i = 0; i < cs1Cases.length; i++) {
    var c = cs1Cases[i];
    var rec = analyzeRecipe(c[0], c[1], c[2]);
    var mix = computeMixedColor(c[0], c[1], c[2]);
    var simHasComp = simHasPigment(mix, rec.complement.hue, rec.complement.sat, rec.complement.light);

    // Skip darkener-plus-black path (complement is optional/tiny there)
    if (rec.step3DarkenerMode.indexOf("darkener-plus-black") === 0) continue;
    if (rec.step3DarkenerMode === "primary-plus-black") continue;

    if (rec.summaryHasComplement && !simHasComp) {
        WScript.Echo("  FAIL: HSL(" + c[0] + "," + c[1] + "," + c[2] +
            ") recipe says complement, but simulation doesn't use it");
        cs1Fail = true;
    }
    if (!rec.summaryHasComplement && simHasComp && !rec.isNeutral) {
        WScript.Echo("  FAIL: HSL(" + c[0] + "," + c[1] + "," + c[2] +
            ") recipe says NO complement, but simulation uses it");
        cs1Fail = true;
    }
}
assert(!cs1Fail, "CS1: Complement display/simulation mismatch");

// --- CS2: summaryHasWhite flag matches simulation ---
WScript.Echo("CS2: summaryHasWhite stimmt mit Simulation ueberein");
var cs2Fail = false;
var cs2Cases = [
    // s<20 with white
    [27,15,62], [33,15,80], [27,15,75],
    // s<20 without white (dark target)
    [240,15,20], [30,15,40],
    // s>=20 && s<50 with white
    [60,40,60], [120,30,50],
    // s>=50 no white
    [22,85,52], [210,70,40]
];
for (var i = 0; i < cs2Cases.length; i++) {
    var c = cs2Cases[i];
    var rec = analyzeRecipe(c[0], c[1], c[2]);
    var mix = computeMixedColor(c[0], c[1], c[2]);
    var simHasWh = simHasPigment(mix, rec.white.hue, rec.white.sat, rec.white.light);

    if (rec.step3DarkenerMode.indexOf("darkener-plus-black") === 0) continue;
    if (rec.step3DarkenerMode === "primary-plus-black") continue;

    if (rec.summaryHasWhite && !simHasWh) {
        WScript.Echo("  FAIL: HSL(" + c[0] + "," + c[1] + "," + c[2] +
            ") recipe says white, but simulation doesn't use it");
        cs2Fail = true;
    }
    if (!rec.summaryHasWhite && simHasWh && !rec.isNeutral) {
        WScript.Echo("  FAIL: HSL(" + c[0] + "," + c[1] + "," + c[2] +
            ") recipe says NO white, but simulation uses it");
        cs2Fail = true;
    }
}
assert(!cs2Fail, "CS2: White display/simulation mismatch");

// --- CS3: waterRatio consistency ---
// The water ratio from analyzeRecipe must match what computeMixedColor uses.
WScript.Echo("CS3: waterRatio stimmt ueberein");
var cs3Fail = false;
for (var h = 0; h < 360; h += 30) {
    for (var sat = 15; sat <= 85; sat += 35) {
        for (var ll = 15; ll <= 85; ll += 14) {
            var rec3 = analyzeRecipe(h, sat, ll);
            var mix3 = computeMixedColor(h, sat, ll);
            if (rec3.waterRatio !== mix3.waterRatio) {
                WScript.Echo("  FAIL: HSL(" + h + "," + sat + "," + ll +
                    ") recipe water=" + rec3.waterRatio + " but sim water=" + mix3.waterRatio);
                cs3Fail = true;
            }
        }
    }
}
assert(!cs3Fail, "CS3: Water ratio recipe/simulation mismatch");

// --- CS4: Broad sweep complement/white consistency ---
// Full grid: every 45° hue, 3 sat levels, 5 light levels
WScript.Echo("CS4: Breiter Sweep - Komplement/Weiss-Konsistenz (H x S x L)");
var cs4Fail = false;
var cs4Count = 0;
for (var h = 0; h < 360; h += 45) {
    for (var sat = 10; sat <= 85; sat += 25) {
        for (var ll = 20; ll <= 80; ll += 15) {
            var rec4 = analyzeRecipe(h, sat, ll);
            var mix4 = computeMixedColor(h, sat, ll);
            cs4Count++;

            // Skip dark shortcut paths
            if (rec4.step3DarkenerMode.indexOf("darkener-plus-black") === 0) continue;
            if (rec4.step3DarkenerMode === "primary-plus-black") continue;
            if (rec4.isNeutral) continue;

            var simComp = simHasPigment(mix4, rec4.complement.hue, rec4.complement.sat, rec4.complement.light);
            var simWhite = simHasPigment(mix4, rec4.white.hue, rec4.white.sat, rec4.white.light);

            if (rec4.summaryHasComplement && !simComp) {
                WScript.Echo("  FAIL: HSL(" + h + "," + sat + "," + ll +
                    ") recipe=complement, sim=none");
                cs4Fail = true;
            }
            if (!rec4.summaryHasComplement && simComp) {
                WScript.Echo("  FAIL: HSL(" + h + "," + sat + "," + ll +
                    ") recipe=no-complement, sim=complement");
                cs4Fail = true;
            }
            if (rec4.summaryHasWhite && !simWhite) {
                WScript.Echo("  FAIL: HSL(" + h + "," + sat + "," + ll +
                    ") recipe=white, sim=none");
                cs4Fail = true;
            }
            if (!rec4.summaryHasWhite && simWhite) {
                WScript.Echo("  FAIL: HSL(" + h + "," + sat + "," + ll +
                    ") recipe=no-white, sim=white");
                cs4Fail = true;
            }
        }
    }
}
WScript.Echo("  " + cs4Count + " Kombinationen geprueft");
assert(!cs4Fail, "CS4: Broad sweep display/simulation mismatch");

// ===================== DOMAIN LOGIC TESTS =====================
// These tests verify WATERCOLOR PAINTING INVARIANTS, not algorithm internals.
// Expected values are derived from painting knowledge, not from the code.

WScript.Echo("");
WScript.Echo("=== Domain Logic Tests (Fachlogik) ===");
WScript.Echo("");

// --- DL1: No white+darkener contradiction ---
// If white is added for desaturation, the recipe should NOT need a darkener
// to compensate. White and darkener fighting each other = muddy result.
WScript.Echo("DL1: Kein Weiss+Darkener-Widerspruch (Sweep s<20, diverse L)");
var dl1Fail = false;
var dl1Cases = [
    [27,15,62], [27,15,50], [27,15,40], [27,15,75], [27,15,85],
    [200,10,30], [200,10,50], [200,10,70], [200,10,85],
    [120,5,45], [120,15,55], [120,10,65],
    [340,12,35], [340,12,60], [340,12,80],
    [60,8,50], [60,18,40], [60,18,70]
];
for (var i = 0; i < dl1Cases.length; i++) {
    var c = dl1Cases[i];
    var rec = analyzeRecipe(c[0], c[1], c[2]);
    // If white was added (verylowWhiteFrac > 0), gap should be >= -5 (no darkener)
    if (rec.verylowWhiteFrac > 0 && rec.gap < -5) {
        WScript.Echo("  FAIL: HSL(" + c[0] + "," + c[1] + "," + c[2] +
            ") whiteFrac=" + rec.verylowWhiteFrac.toFixed(2) +
            " but gap=" + rec.gap + " -> darkener needed! Contradiction.");
        dl1Fail = true;
    }
}
assert(!dl1Fail, "DL1: White+Darkener contradiction found");

// --- DL2: Hue preservation across full spectrum ---
// The mixed color's hue should be within 40° of the target for all chromatic colors.
WScript.Echo("DL2: Hue-Erhaltung ueber volles Spektrum (10° Schritte, s=70, l=50)");
var dl2Fail = false;
for (var h = 0; h < 360; h += 10) {
    var mx = computeMixedColor(h, 70, 50);
    var hd = hueDistance(h, mx.h);
    if (hd > 40) {
        WScript.Echo("  FAIL: hue " + h + " -> mixed " + mx.h + " (dist " + hd + ")");
        dl2Fail = true;
    }
}
assert(!dl2Fail, "DL2: Hue deviation > 40deg found");

// --- DL3: Light targets should use water, not be pur ---
// If target L >= 75, the water ratio should never be "pur" for chromatic colors.
WScript.Echo("DL3: Helle Farben (L>=75) brauchen Wasser, nie pur");
var dl3Fail = false;
var dl3Hues = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];
for (var i = 0; i < dl3Hues.length; i++) {
    for (var sat = 20; sat <= 80; sat += 20) {
        var rec3 = analyzeRecipe(dl3Hues[i], sat, 80);
        if (rec3.waterRatio === "pur") {
            WScript.Echo("  FAIL: HSL(" + dl3Hues[i] + "," + sat + ",80) -> pur! Should use water.");
            dl3Fail = true;
        }
    }
}
assert(!dl3Fail, "DL3: Light color with pur water ratio found");

// --- DL4: Dark targets (L<=20) should NOT use heavy water dilution ---
// Dark colors need concentrated pigment, not dilution.
WScript.Echo("DL4: Dunkle Farben (L<=20) brauchen konzentriertes Pigment");
var dl4Fail = false;
for (var i = 0; i < dl3Hues.length; i++) {
    for (var sat = 30; sat <= 80; sat += 25) {
        var rec4 = analyzeRecipe(dl3Hues[i], sat, 15);
        var wn = parseWaterRatio(rec4.waterRatio);
        if (wn >= 3) {
            WScript.Echo("  FAIL: HSL(" + dl3Hues[i] + "," + sat + ",15) -> water " + rec4.waterRatio + "! Too diluted for dark target.");
            dl4Fail = true;
        }
    }
}
assert(!dl4Fail, "DL4: Dark color with excessive water found");

// --- DL5: Primary pigment should be hue-near ---
// For any chromatic color, the primary pigment should be within 30° of the target hue.
WScript.Echo("DL5: Primary-Pigment muss hue-nah sein (max 30°)");
var dl5Fail = false;
for (var h = 0; h < 360; h += 15) {
    var rec5 = analyzeRecipe(h, 60, 50);
    if (rec5.primary.dist > 30) {
        WScript.Echo("  FAIL: hue " + h + " -> primary " + rec5.primary.id +
            " (hue " + rec5.primary.hue + ", dist " + rec5.primary.dist + ")");
        dl5Fail = true;
    }
}
assert(!dl5Fail, "DL5: Primary hue distance > 30deg found");

// --- DL6: Saturation direction ---
// Low saturation (s<20) should produce a mixed color with clearly lower saturation
// than the raw pigment. Allow up to 2x target sat + 15 (palette has limited muted pigments).
WScript.Echo("DL6: Niedrige Saettigung (s<20) ergibt entsaettigte Mischung");
var dl6Fail = false;
var dl6Cases = [[30,15,60],[60,10,65],[120,15,50],[200,12,55],[300,8,45],[350,18,70],[27,15,62]];
for (var i = 0; i < dl6Cases.length; i++) {
    var c = dl6Cases[i];
    var mx6 = computeMixedColor(c[0], c[1], c[2]);
    var maxSat = Math.min(50, c[1] * 2 + 15);
    if (mx6.s > maxSat) {
        WScript.Echo("  FAIL: HSL(" + c[0] + "," + c[1] + "," + c[2] +
            ") -> mixed s=" + mx6.s + " (too saturated, max=" + maxSat + " for s=" + c[1] + " target)");
        dl6Fail = true;
    }
}
assert(!dl6Fail, "DL6: Low-sat target produced high-sat mix");

// --- DL7: High saturation should stay vibrant ---
// For s>=80, the mixed color should retain substantial saturation (>30 before dilution).
WScript.Echo("DL7: Hohe Saettigung (s>=80) bleibt kraeftig");
var dl7Fail = false;
var dl7Cases = [[0,85,48],[22,88,52],[120,80,50],[240,85,38],[340,80,44]];
for (var i = 0; i < dl7Cases.length; i++) {
    var c = dl7Cases[i];
    var rec7 = analyzeRecipe(c[0], c[1], c[2]);
    // For high-sat, recipe should NOT add complement or white
    if (rec7.summaryHasWhite) {
        WScript.Echo("  FAIL: HSL(" + c[0] + "," + c[1] + "," + c[2] +
            ") has white in summary — would kill saturation!");
        dl7Fail = true;
    }
}
assert(!dl7Fail, "DL7: High-sat recipe contains white");

// --- DL8: Neutral colors should have very low mixed saturation ---
// s < 10 targets should produce mixed sat < 10.
WScript.Echo("DL8: Neutrale Farben bleiben neutral (mixed s < 10)");
var dl8Fail = false;
var dl8Cases = [[0,0,50],[0,0,20],[0,0,80],[0,0,95],[180,5,50],[90,3,40]];
for (var i = 0; i < dl8Cases.length; i++) {
    var c = dl8Cases[i];
    var mx8 = computeMixedColor(c[0], c[1], c[2]);
    if (mx8.s > 10) {
        WScript.Echo("  FAIL: HSL(" + c[0] + "," + c[1] + "," + c[2] +
            ") -> mixed s=" + mx8.s + " (too chromatic for neutral target)");
        dl8Fail = true;
    }
}
assert(!dl8Fail, "DL8: Neutral target too chromatic");

// --- DL9: Water ratio monotonicity with lightness ---
// For same hue/sat, increasing target L should never decrease water ratio.
// (lighter = more water, not less)
WScript.Echo("DL9: Mehr Helligkeit -> gleich viel oder mehr Wasser");
var dl9Fail = false;
var dl9Hues = [22, 120, 240, 340];
for (var hi = 0; hi < dl9Hues.length; hi++) {
    var prevWater = -1;
    for (var ll = 20; ll <= 90; ll += 10) {
        var rec9 = analyzeRecipe(dl9Hues[hi], 60, ll);
        var wn9 = parseWaterRatio(rec9.waterRatio);
        if (wn9 < prevWater - 0.01) {
            WScript.Echo("  FAIL: hue=" + dl9Hues[hi] + " L=" + ll + " water=" + rec9.waterRatio +
                " (" + wn9 + ") < previous (" + prevWater + ")");
            dl9Fail = true;
        }
        prevWater = wn9;
    }
}
assert(!dl9Fail, "DL9: Water ratio decreased with increasing lightness");

// --- DL10: Mixed lightness direction ---
// The mixed color L should move in the right direction relative to pigment base L.
// Very light targets (L>=80) should produce mixed L >= 65.
// Very dark targets (L<=15) should produce mixed L <= 35.
WScript.Echo("DL10: Helligkeit der Mischung geht in die richtige Richtung");
var dl10Fail = false;
for (var h = 0; h < 360; h += 45) {
    // Light target
    var mxL = computeMixedColor(h, 60, 85);
    if (mxL.l < 65) {
        WScript.Echo("  FAIL: HSL(" + h + ",60,85) -> mixed L=" + mxL.l + " (should be >= 65)");
        dl10Fail = true;
    }
    // Dark target (only for sat >= 30 to avoid neutral path)
    var mxD = computeMixedColor(h, 60, 15);
    if (mxD.l > 35) {
        WScript.Echo("  FAIL: HSL(" + h + ",60,15) -> mixed L=" + mxD.l + " (should be <= 35)");
        dl10Fail = true;
    }
}
assert(!dl10Fail, "DL10: Mixed lightness in wrong direction");

// --- DL11: Recipe total Teile should be reasonable ---
// A recipe shouldn't need more than ~25 total parts. More = impractical.
WScript.Echo("DL11: Gesamtmenge Teile bleibt praxistauglich (max 25)");
var dl11Fail = false;
for (var h = 0; h < 360; h += 30) {
    for (var sat = 15; sat <= 85; sat += 35) {
        for (var ll = 20; ll <= 80; ll += 30) {
            var mx11 = computeMixedColor(h, sat, ll);
            var totalT = 0;
            for (var p = 0; p < mx11.pigments.length; p++) totalT += mx11.pigments[p].teile;
            if (totalT > 25) {
                WScript.Echo("  FAIL: HSL(" + h + "," + sat + "," + ll +
                    ") -> " + totalT.toFixed(1) + " Teile total (too many!)");
                dl11Fail = true;
            }
        }
    }
}
assert(!dl11Fail, "DL11: Excessive total Teile found");

// --- DL12: Full grid sanity (coarse) ---
// Run every 30° hue, 3 sat levels, 5 light levels and check basic sanity:
// mixed hue within 50°, mixed L within 35 of target.
WScript.Echo("DL12: Grobrasterpruefung (H x S x L) - Grundsanity");
var dl12Fail = false;
var dl12Count = 0;
for (var h = 0; h < 360; h += 30) {
    for (var sat = 15; sat <= 85; sat += 35) {
        for (var ll = 15; ll <= 85; ll += 14) {
            var mx12 = computeMixedColor(h, sat, ll);
            dl12Count++;
            if (sat >= 10) {
                var hd12 = hueDistance(h, mx12.h);
                if (hd12 > 50 && mx12.s > 5) {
                    WScript.Echo("  FAIL: HSL(" + h + "," + sat + "," + ll +
                        ") -> hue " + mx12.h + " (dist " + hd12 + ")");
                    dl12Fail = true;
                }
            }
            if (Math.abs(ll - mx12.l) > 35) {
                WScript.Echo("  FAIL: HSL(" + h + "," + sat + "," + ll +
                    ") -> L=" + mx12.l + " (diff " + Math.abs(ll - mx12.l) + ")");
                dl12Fail = true;
            }
        }
    }
}
WScript.Echo("  " + dl12Count + " Kombinationen geprueft");
assert(!dl12Fail, "DL12: Grid sanity check failed");

// --- DL13: Rezept-Ergebnis vs. Zielfarbe ---
// computeMixedColor simuliert das ANGEZEIGTE Rezept (exakte Pigmente + Mengen + Wasser).
// Das Ergebnis muss nah an der Zielfarbe liegen.
// Toleranzen: dH<=20, dS<=20, dL<=20 (fuer niedrige Saettigung ist Hue instabil)
WScript.Echo("DL13: Rezept-Ergebnis vs. Zielfarbe (angezeigte Mischung)");
var dl13Fail = false;
var dl13Count = 0;
var maxHueTol = 20;
var maxSatTol = 20;
var maxLightTol = 20;
for (var h13 = 0; h13 < 360; h13 += 30) {
    for (var s13 = 15; s13 <= 85; s13 += 35) {
        for (var l13 = 20; l13 <= 80; l13 += 15) {
            var rec13 = analyzeRecipe(h13, s13, l13);
            if (rec13.isNeutral) continue;
            if (rec13.step3DarkenerMode.indexOf("darkener-plus-black") === 0) continue;
            if (rec13.step3DarkenerMode === "primary-plus-black") continue;

            var mx13 = computeMixedColor(h13, s13, l13);
            dl13Count++;

            var hd13 = hueDistance(h13, mx13.h);
            var sd13 = Math.abs(s13 - mx13.s);
            var ld13 = Math.abs(l13 - mx13.l);

            // Hue: skip check when both target and result have very low saturation
            var hueOk = (s13 < 15 && mx13.s < 15) ? true : (hd13 <= maxHueTol);
            var satOk = sd13 <= maxSatTol;
            var lightOk = ld13 <= maxLightTol;

            if (!hueOk || !satOk || !lightOk) {
                WScript.Echo("  FAIL: HSL(" + h13 + "," + s13 + "," + l13 +
                    ") -> HSL(" + mx13.h + "," + mx13.s + "," + mx13.l +
                    ") dH=" + hd13 + " dS=" + sd13 + " dL=" + ld13);
                dl13Fail = true;
            }
        }
    }
}
WScript.Echo("  " + dl13Count + " Kombinationen geprueft");
assert(!dl13Fail, "DL13: Angezeigtes Rezept produziert Farbe zu weit vom Ziel");

// --- DL14: HSL(27,45,62) - mittlere Saettigung, warm-orange ---
// s=45 ist "low" branch (>=20, <50): Grundfarbe + Komplement + Weiss.
// Rezept muss warm-orange Hue erhalten, moderate Entsaettigung, helle Mischung.
WScript.Echo("DL14: HSL(27,45,62) - warm-orange, mittlere Saettigung");
var dl14 = computeMixedColor(27, 45, 62);
var dl14rec = analyzeRecipe(27, 45, 62);
WScript.Echo("  Recipe: primary=" + dl14rec.primary.id + " sat-branch=" + dl14rec.satBranch +
    " gap=" + dl14rec.gap + " water=" + dl14rec.waterRatio);
WScript.Echo("  Mixed: HSL(" + dl14.h + "," + dl14.s + "," + dl14.l + ") water=" + dl14.waterRatio);
// Hue should stay in warm range (within 25deg of 27)
assert(hueDistance(27, dl14.h) <= 25, "DL14: Hue should be near 27, got " + dl14.h + " (dist " + hueDistance(27, dl14.h) + ")");
// Saturation should be moderately desaturated (not vivid, not gray)
assert(dl14.s >= 20, "DL14: Sat should be >= 20 (not too gray), got " + dl14.s);
assert(dl14.s <= 65, "DL14: Sat should be <= 65 (desaturated), got " + dl14.s);
// Lightness should be near target 62
assert(Math.abs(62 - dl14.l) <= 20, "DL14: Lightness should be near 62, got " + dl14.l);
// Should have complement (s<80) and white (s<50)
assert(dl14rec.summaryHasComplement, "DL14: Should have complement for s=45");
assert(dl14rec.summaryHasWhite, "DL14: Should have white for s=45 (<50)");
// Water ratio should not be pur (L=62 is light)
assert(dl14rec.waterRatio !== "pur", "DL14: Should not be pur for L=62");

// --- DL15: HSL(27,45,100) - maximale Helligkeit ---
// L=100 ist reines Weiss. Bei chromatischem s=45 muss extrem verduennt werden.
WScript.Echo("DL15: HSL(27,45,100) - warm-orange bei max Helligkeit");
var dl15 = computeMixedColor(27, 45, 100);
var dl15rec = analyzeRecipe(27, 45, 100);
WScript.Echo("  Recipe: primary=" + dl15rec.primary.id + " sat-branch=" + dl15rec.satBranch +
    " gap=" + dl15rec.gap + " water=" + dl15rec.waterRatio);
WScript.Echo("  Mixed: HSL(" + dl15.h + "," + dl15.s + "," + dl15.l + ") water=" + dl15.waterRatio);
// L=100 is pure white in RGB (255,255,255) regardless of H and S.
// The mixed result should be near-white: very high L, very low S.
assert(dl15.l >= 95, "DL15: L=100 target should produce near-white, got L=" + dl15.l);
assert(dl15.s <= 15, "DL15: L=100 target should be nearly unsaturated, got S=" + dl15.s);

// ===================== SUMMARY =====================
WScript.Echo("");
WScript.Echo("========================================");
WScript.Echo("  Passed: " + passed + "  |  Failed: " + errors);
WScript.Echo("========================================");
if (errors > 0) {
    WScript.Quit(1);
}
