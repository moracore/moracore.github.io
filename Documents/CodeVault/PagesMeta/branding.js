/**
 * branding.js — MORACORE logo.
 * Hand-crafted Unicode art, rendered character-by-character.
 */

(function () {

    // ── Logo Art ─────────────────────────────────────────────
    // Spaces replaced with ⠀ for consistent monospace width.
    const LOGO = [
        '⢂⣄⢂⢂⢂⢂⣠⢂⢂⢂⢂⢂⢂⢂⢂⢂⢂⢂⢂⢂⢂⢂⢂⢂⢂⢂⢂⢂⢂⢂⢂⢂⢂⢂⢂⢂⢂⢂⢂⢂⢂⢂⢂⢂⢂⢂⢂',
        '⢸⣿⣄⢂⢂⣠⣿⢂⢂⣶⣿⣶⢂⢂⣿⣿⣷⢂⢂⢂⣼⣿⣧⢂⢂⢂⣤⣶⣿⣿⢂⢂⣶⣿⣶⢂⢂⣿⣿⣷⢂⢂⣿⣿⣿⠿⠛',
        '⢸⣿⢻⣄⣠⡟⣿⢂⣼⡏⢂⢹⣧⢂⣿⢂⣸⡇⢂⣸⡏⢂⢹⣧⢂⣼⡏⢂⢂⢹⢂⣼⣿⣿⣿⣧⢂⣿⢂⣸⡇⢂⣿⡇⢂⢂⢂',
        '⢸⣿⢂⢻⡟⢂⣿⢂⣿⢂⢂⢂⣿⢂⣿⣿⣿⢂⢂⣿⠛⠛⠛⣿⢂⣿⢂⢂⢂⢂⢂⣿⣿⣿⣿⣿⢂⣿⣿⣿⢂⢂⣿⣿⠿⠛⢂',
        '⢸⣿⢂⢂⢂⢂⣿⢂⢻⣇⢂⣸⡟⢂⣿⢂⢻⣇⢂⣿⢂⢂⢂⣿⢂⢻⣇⢂⢂⣸⢂⢻⣿⣿⣿⡟⢂⣿⢂⢻⣧⢂⣿⡇⢂⢂⢂',
        '⢂⣿⢂⢂⢂⢂⣿⢂⢂⠿⣿⠿⢂⢂⣿⢂⢂⠻⣧⢹⡇⢂⢸⡏⢂⢂⠛⠿⣿⣿⢂⢂⠿⣿⠿⢂⢂⣿⢂⢂⠻⣧⠹⣿⣿⣶⣤',
        '⢂⠉⢂⢂⢂⢂⠉⢂⢂⢂⢂⢂⢂⢂⢂⢂⢂⢂⠙⢂⢂⢂⢂⢂⢂⢂⢂⢂⢂⢂⢂⢂⢂⢂⢂⢂⢂⢂⢂⢂⢂⠙⢷⢂⢂⢂⢂',
    ];

    // At runtime, swap ⢂ placeholders with Braille blank ⠀ (invisible)
    const LOGO_RENDERED = LOGO.map(row => row.replace(/⢂/g, '⠀'));

    // Convert to char arrays
    const ROWS = LOGO_RENDERED.map(row => [...row]);
    const BH = ROWS.length;
    const BW = Math.max(...ROWS.map(r => r.length));
    for (let i = 0; i < BH; i++) {
        while (ROWS[i].length < BW) ROWS[i].push('⠀');
    }

    // ── Colour: animated downward wave ────────────────────────────
    // Cycle: green → purple → brown → purple → green (repeat)
    const STOPS = [
        [0, 204, 128],   // #00cc80 vivid emerald
        [152, 60, 255],  // electric purple
        [210, 120, 10],  // warm amber
        [152, 60, 255],  // electric purple
    ];

    function waterfallColor(phase) {
        const N = STOPS.length;
        const t = ((phase % N) + N) % N; // normalise to [0, N)
        const i = Math.floor(t);
        const f = t - i;
        const s = f * f * (3 - 2 * f); // smoothstep
        const a = STOPS[i], b = STOPS[(i + 1) % N];
        return `rgb(${Math.round(a[0] + (b[0] - a[0]) * s)},${Math.round(a[1] + (b[1] - a[1]) * s)},${Math.round(a[2] + (b[2] - a[2]) * s)})`;
    }

    window.MORA_BRANDING = {
        updateBranding(cell, time, cols) {
            const aspect = window.innerWidth / window.innerHeight;
            const brandX = aspect < 2 / 3
                ? Math.floor((cols - BW) / 2)   // centered on mobile
                : cols - (BW + 4);               // top-right on desktop
            const brandY = 2;
            if (cell.y < brandY || cell.y >= brandY + BH) return false;
            if (cell.x < brandX || cell.x >= brandX + BW) return false;

            const bx = cell.x - brandX;
            const by = cell.y - brandY;
            const ch = ROWS[by][bx];

            if (!ch || ch === '⠀') return false;

            cell.isBody = true;
            cell.char = ch;

            // Downward wave: time moves the phase, row offsets spread it vertically
            const speed = 0.00006;
            const rowOffset = by * 0.08;
            const phase = time * speed - rowOffset;
            cell.color = waterfallColor(phase);
            cell.alpha = 1.0;
            return true;
        }
    };

    console.log('MORACORE: branding.js loaded (' + BW + '×' + BH + ')');
})();
