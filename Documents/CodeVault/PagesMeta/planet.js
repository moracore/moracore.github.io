/**
 * planet.js - Planet with domain-warped FBM continent noise.
 *
 * Coastline resolution: each Braille character cell is sampled at
 * all 8 dot positions (2 cols × 4 rows).  The land/ocean decision
 * is made per-dot and OR'd into the Braille codepoint, so coasts
 * have sub-character detail that looks hand-drawn.
 *
 * Only two colours: #1e6faa (ocean) and #2f8c3a (land).
 * Domain warping (q-warp) adds turbulent, realistic coastline shapes.
 */

(function() {

    // ── Braille dot layout ──────────────────────────────────────
    // Each dot is [colFrac, rowFrac, unicodeBit]
    // colFrac ∈ {0, 0.5}, rowFrac ∈ {0, 0.25, 0.5, 0.75}
    const DOTS = [
        [0.0, 0.00, 0x01],  // dot 1
        [0.0, 0.25, 0x02],  // dot 2
        [0.0, 0.50, 0x04],  // dot 3
        [0.0, 0.75, 0x40],  // dot 7
        [0.5, 0.00, 0x08],  // dot 4
        [0.5, 0.25, 0x10],  // dot 5
        [0.5, 0.50, 0x20],  // dot 6
        [0.5, 0.75, 0x80],  // dot 8
    ];

    // ── Raw FBM – 8 octaves ────────────────────────────────────
    function fbm(u, v, seed) {
        // 5 octaves: large continent shapes + detailed coasts, no ultra-high-freq boil
        const O = [
            [ 1.90,  2.30,  0.00,  1.30,  1.000],
            [ 3.70,  4.50,  2.10,  0.70,  0.500],
            [ 7.30,  8.90,  1.50,  3.90,  0.250],
            [14.50, 11.70,  4.20,  2.10,  0.125],
            [28.30, 23.10,  0.90,  5.40,  0.0625],
        ];
        let n = 0, amp = 0;
        for (const [fu, fv, pu, pv, w] of O) {
            const ru = u * fu + v * (fu * 0.37 + seed * 0.41) + pu;
            const rv = v * fv - u * (fv * 0.29 - seed * 0.37) + pv;
            n   += (Math.sin(ru) * Math.cos(rv)
                  + Math.cos(ru * 0.71 + rv * 1.37) * 0.45
                  + Math.sin(rv * 0.83 - ru * 0.61) * 0.25) * w;
            amp += w * 1.70;
        }
        return n / amp;
    }

    // ── Domain-warped sample ───────────────────────────────────
    // First fbm pass gives a warp vector; main fbm is sampled
    // at the warped coordinates.  This produces the chaotic,
    // turbulent coasts that look hand-drawn.
    function warpedNoise(u, v, seed) {
        // Low warp = complex coasts without swirly distortion
        const wScale = 0.25;
        const wu = fbm(u + 0.0, v + 0.0, seed + 3.71) * wScale;
        const wv = fbm(u + 5.2, v + 1.3, seed + 7.13) * wScale;
        return fbm(u + wu, v + wv, seed);
    }

    // ── Is this (angle, lat) coordinate land? ─────────────────
    // ~25-30% land coverage (Earth-like ocean-dominant)
    const LAND_THRESH = 0.05;
    function isLand(angle, lat, seed) {
        return warpedNoise(angle, lat, seed) > LAND_THRESH;
    }

    window.MORA_PLANET = {

        updatePlanet: function(cell, time, width, height) {
            const CW = window.MORA_LAYOUT.CHAR_WIDTH;
            const CH = window.MORA_LAYOUT.CHAR_HEIGHT;

            const px = cell.x * CW;
            const py = cell.y * CH;

            const planetR     = Math.max(width, height) * 0.30;
            const planetScale = Math.max(width, height) * 0.60;
            const cx          = width  - planetScale * 0.20;
            const cy          = height + planetScale * 0.10;

            const dxP   = px - cx;
            const dyP   = py - cy;
            const distP = Math.sqrt(dxP * dxP + dyP * dyP);

            // ── Atmosphere ─────────────────────────────────────
            const atmosR  = 26;
            const factor  = (distP - planetR) / atmosR;
            if (factor > 0 && factor < 1) {
                cell.isBody = true;
                cell.char   = ['⠿','⠶','⠤','⠠'][Math.floor(factor * 3.99)];
                cell.color  = '#3a5878';
                cell.alpha  = 0.30 * (1 - factor);
                return true;
            }

            if (distP >= planetR) return false;

            // ── Planet surface ────────────────────────────────
            cell.isBody = true;

            // Rotation: time drives the angle offset so the planet spins
            const rot = time * 0.000075; // slightly faster so spin is unmistakable

            // Count land dots among all 8 sub-pixel positions
            let code      = 0;
            let landCount = 0;

            for (const [cf, rf, bit] of DOTS) {
                // Sub-pixel world position of this dot
                const dpx = px + cf * CW;
                const dpy = py + rf * CH;

                const ddx = dpx - cx;
                const ddy = dpy - cy;
                const dd  = Math.sqrt(ddx * ddx + ddy * ddy);

                // Keep dots inside the circle
                if (dd >= planetR) continue;

                // Spherical-ish coordinates
                const angle = Math.atan2(ddy, ddx) - rot;
                const lat   = (dd / planetR) * Math.PI * 0.95;

                if (isLand(angle, lat, 1.37)) {
                    code      |= bit;
                    landCount += 1;
                }
            }

            // Choose colour by majority vote
            if (landCount > 0) {
                // Land-majority or any land dot
                if (landCount >= 4) {
                    cell.color = '#2f8c3a';
                } else {
                    // Mixed coast cell: land is present but minority — still green
                    // (the braille char itself shows the exact shape)
                    cell.color = '#2f8c3a';
                }
                cell.char = code === 0 ? '⠀' : String.fromCodePoint(0x2800 | code);
            } else {
                // Pure ocean
                cell.color = '#1a5fa8';
                cell.char  = '⠀';
            }

            // Limb darkening + terminator shadow
            const rim    = distP / planetR;
            const shadow = Math.max(0.35, 1.0 - rim * 0.75);
            cell.alpha   = shadow * (0.85 + Math.cos(rim * Math.PI * 0.5) * 0.15);
            return true;
        },

        getPlanetCenter: function(width, height) {
            const planetScale = Math.max(width, height) * 0.60;
            return {
                x: width  - planetScale * 0.20,
                y: height + planetScale * 0.10,
                r: Math.max(width, height) * 0.30,
            };
        },
    };

    console.log('MORACORE: planet.js loaded');
})();
