/**
 * layout.js - Core configuration and character definitions.
 */

window.MORA_LAYOUT = {
    FONT_SIZE: 14,
    CHAR_WIDTH: 14 * 0.6,
    CHAR_HEIGHT: 14,
    BG_COLOR: '#010203',
    AETHER_COLORS: [
        '#0d1422', 
        '#11182a', 
        '#141f40', 
        '#0b1810', 
        '#0e1c28'  
    ],
    BRAILLE_FLOW: "⠀⠁⠙⠫⠻⠿⠿⡿⣿"
};

class CellBase {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.baseAlpha = 0.05 + Math.random() * 0.1;
        this.color = window.MORA_LAYOUT.AETHER_COLORS[0];
        this.alpha = this.baseAlpha;
        this.isBody = false;
        this.char = '⠀';
    }

    draw(ctx) {
        ctx.globalAlpha = Math.min(1, this.alpha);
        ctx.fillStyle = this.color;
        ctx.fillText(this.char, this.x * window.MORA_LAYOUT.CHAR_WIDTH, this.y * window.MORA_LAYOUT.CHAR_HEIGHT);
    }
}
window.CellBase = CellBase;
console.log("MORACORE: layout.js loaded");
