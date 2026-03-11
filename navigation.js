/**
 * navigation.js - Click-to-expand navigation with floating physics (desktop)
 *                 and vertical list (mobile).
 */

(function () {
    const CW = window.MORA_LAYOUT.CHAR_WIDTH;
    const CH = window.MORA_LAYOUT.CHAR_HEIGHT;

    const NAV_LINKS = [
        { text: "github", url: "https://github.com/moracore", apk: null, desc: "moracore github profile", color: '#00cc80', disabled: false, actionLabel: 'profile >' },
        { text: "construct", url: "https://moracore.github.io/construct", apk: "https://github.com/moracore/construct/releases/latest", desc: "fully customizable gym app — build workouts from the ground up", color: '#ee5a14', disabled: false, actionLabel: 'web app >' },
        { text: "pathway", url: "https://moracore.github.io/pathway", apk: "https://github.com/moracore/pathway/releases/latest", desc: "modular personal organizer with projects, goals & trackers", color: '#6830f0', disabled: false, actionLabel: 'web app >' },
        { text: "vellum", url: "https://moracore.github.io/vellum", apk: null, desc: "ttrpg character sheet organizer with live database sync", color: '#e8b800', disabled: false, actionLabel: 'web app >' },
        { text: "torsion", url: "https://moracore.github.io/torsion", apk: null, desc: "interactive tool for understanding torsion angles in protein structures", color: '#e0205a', disabled: false, actionLabel: 'web app >' },
        { text: "mora", url: "#", apk: null, desc: "??????????????", color: '#505050', disabled: true, actionLabel: '' },
        { text: "oneiro", url: "#", apk: null, desc: "world-building toolkit — in development", color: '#505050', disabled: true, actionLabel: '' },
    ];

    // Mobile: sort disabled last
    const MOBILE_ORDER = Array.from({ length: NAV_LINKS.length }, (_, i) => i).sort((a, b) => {
        if (NAV_LINKS[a].disabled === NAV_LINKS[b].disabled) return a - b;
        return NAV_LINKS[a].disabled ? 1 : -1;
    });

    const LEFT_PAD = 4;
    const TOP_START = 12;
    const ROW_GAP = 5;

    // Desktop physics
    const bodies = NAV_LINKS.map((link, i) => ({
        x: 5 + Math.random() * 40,
        y: 8 + i * 6 + Math.random() * 4,
        vx: (Math.random() - 0.5) * 0.06,
        vy: (Math.random() - 0.5) * 0.04,
        r: Math.ceil(link.text.length / 2) + 1,
    }));

    let lastTime = Date.now();
    let physicsReady = false;

    // Shared expanded state (-1 = none expanded)
    let expandedIndex = -1;
    let expandedTime = 0;

    function isMobile() {
        return (window.innerWidth / window.innerHeight) < (2 / 3);
    }

    function getPlanetCollider() {
        const w = window.innerWidth, h = window.innerHeight;
        const planetScale = Math.max(w, h) * 0.6;
        return {
            x: (w - planetScale * 0.2) / CW,
            y: (h + planetScale * 0.1) / CH,
            r: (Math.max(w, h) * 0.3) / CW + 2
        };
    }

    function stepPhysics(time) {
        const dt = Math.min(50, time - lastTime) / 32;
        lastTime = time;
        const cols = Math.ceil(window.innerWidth / CW);
        const rows = Math.ceil(window.innerHeight / CH);
        const planet = getPlanetCollider();

        for (let i = 0; i < bodies.length; i++) {
            const a = bodies[i];
            // Freeze expanded item
            if (i === expandedIndex) { a.vx = 0; a.vy = 0; continue; }

            a.x += a.vx * dt;
            a.y += a.vy * dt;

            const maxX = cols * 0.75;
            if (a.x - a.r < 1) { a.x = 1 + a.r; a.vx = Math.abs(a.vx); }
            if (a.x + a.r > maxX) { a.x = maxX - a.r; a.vx = -Math.abs(a.vx); }
            if (a.y - a.r < 1) { a.y = 1 + a.r; a.vy = Math.abs(a.vy); }
            if (a.y + a.r > rows - 2) { a.y = rows - 2 - a.r; a.vy = -Math.abs(a.vy); }

            // Planet bounce
            const dpx = a.x - planet.x, dpy = a.y - planet.y;
            const dpDist = Math.sqrt(dpx * dpx + dpy * dpy);
            const minPDist = a.r + planet.r;
            if (dpDist < minPDist && dpDist > 0) {
                const nx = dpx / dpDist, ny = dpy / dpDist;
                a.x = planet.x + nx * minPDist;
                a.y = planet.y + ny * minPDist;
                const dot = a.vx * nx + a.vy * ny;
                a.vx -= 2 * dot * nx;
                a.vy -= 2 * dot * ny;
            }

            // Label-label bounce
            for (let j = i + 1; j < bodies.length; j++) {
                const b = bodies[j];
                const dx = b.x - a.x, dy = b.y - a.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const minDist = a.r + b.r;
                if (dist < minDist && dist > 0) {
                    const nx = dx / dist, ny = dy / dist;
                    const overlap = (minDist - dist) / 2;
                    a.x -= nx * overlap; a.y -= ny * overlap;
                    b.x += nx * overlap; b.y += ny * overlap;
                    const dvx = a.vx - b.vx, dvy = a.vy - b.vy;
                    const dot = dvx * nx + dvy * ny;
                    a.vx -= dot * nx; a.vy -= dot * ny;
                    b.vx += dot * nx; b.vy += dot * ny;
                }
            }

            a.vx *= 0.9995; a.vy *= 0.9995;
            const speed = Math.sqrt(a.vx * a.vx + a.vy * a.vy);
            if (speed < 0.015) {
                a.vx += (Math.random() - 0.5) * 0.01;
                a.vy += (Math.random() - 0.5) * 0.01;
            }
        }
    }

    // Word-wrap helper
    function wrapText(text, maxW) {
        const words = text.split(' ');
        const lines = [];
        let cur = '';
        for (const w of words) {
            const test = cur ? cur + ' ' + w : w;
            if (test.length > maxW && cur) { lines.push(cur); cur = w; }
            else cur = test;
        }
        if (cur) lines.push(cur);
        return lines;
    }

    // Get label position for a given link index
    function getLabelPos(i, mobile) {
        if (mobile) {
            const slot = MOBILE_ORDER.indexOf(i);
            return { x: LEFT_PAD, y: TOP_START + slot * ROW_GAP };
        }
        return { x: Math.round(bodies[i].x), y: Math.round(bodies[i].y) };
    }

    window.MORA_NAV = {
        NAV_LINKS: NAV_LINKS,
        getNavGridPos: function () { return { x: 0, y: 0 }; },

        // No hover states needed anymore — but keep the interface for compat
        updateLinkHoverStates: function (time, navPos, mouseX, mouseY, linkHoverStates) {
            const mobile = isMobile();
            if (!mobile) {
                if (!physicsReady) {
                    const cols = Math.ceil(window.innerWidth / CW);
                    bodies.forEach((b, i) => {
                        b.x = 6 + (i % 3) * (cols * 0.22);
                        b.y = 10 + Math.floor(i / 3) * 14;
                    });
                    physicsReady = true;
                }
                stepPhysics(time);
            }

            // Sync expandedIndex into linkHoverStates for rendering
            for (let i = 0; i < NAV_LINKS.length; i++) {
                linkHoverStates[i].active = (i === expandedIndex);
                if (linkHoverStates[i].active && linkHoverStates[i].startTime === 0) {
                    linkHoverStates[i].startTime = expandedTime;
                }
            }
        },

        updateNavigation: function (cell, time, navPos, linkHoverStates) {
            const mobile = isMobile();
            const cols = Math.ceil(window.innerWidth / CW);

            for (let i = 0; i < NAV_LINKS.length; i++) {
                const link = NAV_LINKS[i];
                const pos = getLabelPos(i, mobile);
                const lx = pos.x, ly = pos.y;
                const isExpanded = (i === expandedIndex);

                // Link name
                if (cell.y === ly && cell.x >= lx && cell.x < lx + link.text.length) {
                    const ci = cell.x - lx;
                    cell.isBody = true;
                    cell.char = link.text[ci];
                    cell.color = link.disabled ? '#808080' : (isExpanded ? link.color : '#fff');
                    cell.alpha = link.disabled ? 0.55 : (isExpanded ? 1.0 : 0.7);
                    return true;
                }

                // Expanded content
                if (isExpanded) {
                    const elapsed = time - expandedTime;
                    const maxW = cols - lx - 2;
                    const descLines = wrapText(link.desc, maxW);

                    // Description lines
                    for (let ln = 0; ln < descLines.length; ln++) {
                        const line = descLines[ln];
                        const lineY = ly + 1 + ln;
                        if (cell.y === lineY && cell.x >= lx && cell.x < lx + line.length) {
                            const ci = cell.x - lx;
                            let totalIdx = ci;
                            for (let p = 0; p < ln; p++) totalIdx += descLines[p].length;
                            if (elapsed > totalIdx * 20) {
                                cell.isBody = true;
                                cell.char = line[ci];
                                cell.color = 'rgba(255,255,255,0.5)';
                                cell.alpha = 0.5;
                                return true;
                            }
                        }
                    }

                    // Action links row (below description)
                    const actionY = ly + 1 + descLines.length;
                    if (!link.disabled && cell.y === actionY) {
                        const webLabel = link.actionLabel;
                        const apkLabel = link.apk ? '  apk >' : '';
                        const fullAction = webLabel + apkLabel;
                        const totalDescChars = descLines.reduce((s, l) => s + l.length, 0);
                        const actionDelay = totalDescChars * 20 + 200;

                        if (elapsed > actionDelay && cell.x >= lx && cell.x < lx + fullAction.length) {
                            const ci = cell.x - lx;
                            cell.isBody = true;
                            cell.char = fullAction[ci];
                            // Color the web app part vs apk part
                            if (ci < webLabel.length) {
                                cell.color = link.color;
                            } else {
                                cell.color = '#00cc80';
                            }
                            cell.alpha = 1.0;
                            return true;
                        }
                    }
                }
            }
            return false;
        },

        handleNavClick: function (mouseX, mouseY, navPos, linkHoverStates) {
            const mgx = Math.floor(mouseX / CW);
            const mgy = Math.floor(mouseY / CH);
            const mobile = isMobile();
            const cols = Math.ceil(window.innerWidth / CW);
            const padX = mobile ? 4 : 0;
            const padY = mobile ? 1 : 0;

            // PRIORITY: if an item is expanded, its entire region takes precedence
            if (expandedIndex >= 0) {
                const link = NAV_LINKS[expandedIndex];
                const pos = getLabelPos(expandedIndex, mobile);
                const lx = pos.x, ly = pos.y;
                const maxW = cols - lx - 2;
                const descLines = wrapText(link.desc, maxW);
                const actionY = ly + 1 + descLines.length;
                const expandedBottom = actionY + 1; // bottom edge of expanded content

                // Is the click inside the expanded region (name + desc + action)?
                if (mgy >= ly - padY && mgy <= expandedBottom + padY && mgx >= lx) {
                    // Check action links first (big hit area)
                    if (!link.disabled && mgy >= actionY - padY && mgy <= actionY + padY) {
                        const webLabel = link.actionLabel;
                        if (webLabel && mgx >= lx && mgx < lx + webLabel.length + padX + 2) {
                            if (link.url !== '#') window.open(link.url, '_blank');
                            return;
                        }
                        if (link.apk) {
                            const apkStart = lx + (webLabel ? webLabel.length : 0) + 2;
                            const apkLabel = 'apk >';
                            if (mgx >= apkStart - 1 && mgx < apkStart + apkLabel.length + padX + 2) {
                                window.open(link.apk, '_blank');
                                return;
                            }
                        }
                    }

                    // Click on the expanded item's name → collapse it
                    if (mgy >= ly - padY && mgy <= ly + padY && mgx < lx + link.text.length + padX) {
                        expandedIndex = -1;
                        for (let j = 0; j < linkHoverStates.length; j++) {
                            linkHoverStates[j].active = false;
                            linkHoverStates[j].startTime = 0;
                        }
                        return;
                    }

                    // Click landed in expanded region but not on a link — just absorb it
                    return;
                }
            }

            // Check if clicking on a link name
            for (let i = 0; i < NAV_LINKS.length; i++) {
                const link = NAV_LINKS[i];
                const pos = getLabelPos(i, mobile);
                if (mgy >= pos.y - padY && mgy <= pos.y + padY && mgx >= pos.x && mgx < pos.x + link.text.length + padX) {
                    expandedIndex = i;
                    expandedTime = Date.now();
                    for (let j = 0; j < linkHoverStates.length; j++) {
                        linkHoverStates[j].active = false;
                        linkHoverStates[j].startTime = 0;
                    }
                    return;
                }
            }

            // Clicked elsewhere — collapse
            expandedIndex = -1;
            for (let j = 0; j < linkHoverStates.length; j++) {
                linkHoverStates[j].active = false;
                linkHoverStates[j].startTime = 0;
            }
        }
    };
    console.log("MORACORE: navigation.js loaded (click-to-expand)");
})();
