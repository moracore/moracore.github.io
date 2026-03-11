/**
 * app.js - Main entry point and orchestrator.
 * Uses global objects for maximum compatibility.
 */

(function() {
    console.log("MORACORE: app.js loaded");

    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');

    let width, height, cols, rows;
    let grid = [];
    let navPos = { x: 0, y: 0 };
    let mouseX = -100, mouseY = -100;

    const linkHoverStates = window.MORA_NAV.NAV_LINKS.map(() => ({ active: false, startTime: 0 }));

    class Cell extends window.CellBase {
        constructor(x, y) {
            super(x, y);
        }

        update(time, planetCenter) {
            // 1. Branding
            if (window.MORA_BRANDING.updateBranding(this, time, cols)) return;

            // 2. Navigation
            if (window.MORA_NAV.updateNavigation(this, time, navPos, linkHoverStates)) return;

            // 3. Planet
            if (window.MORA_PLANET.updatePlanet(this, time, width, height)) return;

            // 4. Aether
            window.MORA_AETHER.updateAether(this, time, planetCenter);
        }
    }

    function init() {
        console.log("MORACORE: Initializing...");
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;

        document.body.style.backgroundColor = window.MORA_LAYOUT.BG_COLOR;

        cols = Math.ceil(width / window.MORA_LAYOUT.CHAR_WIDTH);
        rows = Math.ceil(height / window.MORA_LAYOUT.CHAR_HEIGHT);

        navPos = window.MORA_NAV.getNavGridPos(cols, rows);

        grid = [];
        for (let y = 0; y < rows; y++) {
            let row = [];
            for (let x = 0; x < cols; x++) {
                row.push(new Cell(x, y));
            }
            grid.push(row);
        }

        ctx.font = `${window.MORA_LAYOUT.FONT_SIZE}px 'Fira Code', 'Noto Sans Symbols 2', monospace`;
        ctx.textBaseline = 'top';
        console.log("MORACORE: Init complete.");
    }

    function animate() {
        if (!ctx || grid.length === 0) {
            requestAnimationFrame(animate);
            return;
        }
        
        ctx.fillStyle = window.MORA_LAYOUT.BG_COLOR;
        ctx.fillRect(0, 0, width, height);

        const time = Date.now();
        const planetCenter = window.MORA_PLANET.getPlanetCenter(width, height);
        
        window.MORA_NAV.updateLinkHoverStates(time, navPos, mouseX, mouseY, linkHoverStates);

        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                grid[y][x].update(time, planetCenter);
                grid[y][x].draw(ctx);
            }
        }

        requestAnimationFrame(animate);
    }

    // Coordinate mapping: canvas pixel coords from client event coords
    // Handles CSS scaling / device pixel ratio mismatches
    function canvasCoords(clientX, clientY) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY
        };
    }

    let isTouchDevice = false;

    window.addEventListener('mousemove', (e) => {
        if (isTouchDevice) return;
        const c = canvasCoords(e.clientX, e.clientY);
        mouseX = c.x;
        mouseY = c.y;
    });

    window.addEventListener('mousedown', (e) => {
        if (isTouchDevice) return;
        const c = canvasCoords(e.clientX, e.clientY);
        window.MORA_NAV.handleNavClick(c.x, c.y, navPos, linkHoverStates);
    });

    // Mobile: use touchend for reliable "tap", touchstart/move for tracking
    window.addEventListener('touchstart', (e) => {
        isTouchDevice = true;
        const t = e.touches[0];
        const c = canvasCoords(t.clientX, t.clientY);
        mouseX = c.x;
        mouseY = c.y;
    }, { passive: true });

    window.addEventListener('touchend', (e) => {
        // Use last known mouseX/mouseY from touchstart
        window.MORA_NAV.handleNavClick(mouseX, mouseY, navPos, linkHoverStates);
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
        const t = e.touches[0];
        const c = canvasCoords(t.clientX, t.clientY);
        mouseX = c.x;
        mouseY = c.y;
    }, { passive: true });

    window.addEventListener('resize', init);

    init();
    animate();
    console.log("MORACORE: Engine running.");
})();
