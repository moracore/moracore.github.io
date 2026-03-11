/**
 * aether.js - Background cosmic swirl logic.
 */

(function() {
    window.MORA_AETHER = {
        updateAether: function(cell, time, planetCenter) {
            const px = cell.x * window.MORA_LAYOUT.CHAR_WIDTH;
            const py = cell.y * window.MORA_LAYOUT.CHAR_HEIGHT;

            const dxP = px - planetCenter.x;
            const dyP = py - planetCenter.y;
            const distP = Math.sqrt(dxP*dxP + dyP*dyP);
            
            const gravityPull = Math.max(0, 1 - (distP - planetCenter.r) / (planetCenter.r * 1.5));
            const glowPull = Math.max(0, 1 - (distP - (planetCenter.r + 28)) / 450); 
            
            let h = Math.sin(time*0.0003 + cell.x*0.01 + cell.y*0.005)*0.4 + Math.cos(time*0.0008 + Math.sqrt(cell.x*cell.x+cell.y*cell.y)*0.03)*0.3;
            
            const angle = Math.atan2(dyP, dxP);
            h += Math.sin(time*0.001 - angle*4 + distP*0.005)*gravityPull*0.5;
            
            if (glowPull > 0) h += glowPull * 0.8;
            
            cell.color = window.MORA_LAYOUT.AETHER_COLORS[Math.min(2, Math.max(0, Math.floor((h + 1.25) * 2)))];
            cell.alpha = cell.baseAlpha + (h + 1.2) * 0.3 + (glowPull > 0 ? glowPull * 0.25 : 0);
            cell.char = window.MORA_LAYOUT.BRAILLE_FLOW[Math.floor(Math.max(0, Math.min(window.MORA_LAYOUT.BRAILLE_FLOW.length-1, (h + 1.2)*4)))];
        }
    };
    console.log("MORACORE: aether.js loaded");
})();
