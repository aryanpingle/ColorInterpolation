"use strict"

const print = console.log

const TRANSPARENT = [0, 0, 0]
const WHITE = [255, 255, 255]
const BLACK = [0, 0, 0]
const RED = [255, 0, 0]
const GREEN = [0, 255, 0]
const BLUE = [0, 0, 255]
const PURPLE = [128, 0, 255]
const CYAN = [0, 255, 255]
const ORANGE = [255, 128, 0]
const YELLOW = [255, 255, 0]
const GRAY = [128, 128, 128]
const GREY = GRAY

function lerp(val, lb, ub, lv, uv) {
    return lv + (uv-lv)*(val-lb)/(ub-lb)
}

function get_color_towards(from, to, fraction)
{
    fraction = Math.max(Math.min(1, fraction), 0);
    return [0, 1, 2].map(index => {
        return parseInt(from[index]*(1-fraction) + fraction*to[index]);
    });
}

function rgb_to_text(rgb)
{
    return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
}