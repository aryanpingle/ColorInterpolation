"use strict"

const print = console.log

const TRANSPARENT = [0, 0, 0, 0]
const WHITE = [255, 255, 255, 255]
const BLACK = [0, 0, 0, 255]
const RED = [255, 0, 0, 255]
const GREEN = [0, 255, 0, 255]
const BLUE = [0, 0, 255, 255]
const PURPLE = [152, 0, 255, 255]
const CYAN = [0, 255, 255, 255]
const ORANGE = [255, 152, 0, 255]
const YELLOW = [255, 255, 0, 255]
const GRAY = [128, 128, 128, 255]
const GREY = GRAY

function lerp(val, lb, ub, lv, uv) {
    return lv + (uv-lv)*(val-lb)/(ub-lb)
}

function get_color_towards(from, to, fraction)
{
    if(from.length==3)
    {
        from.push(255);
    }
    if(to.length==3)
    {
        to.push(255);
    }
    fraction = Math.max(Math.min(1, fraction), 0);
    return [0, 1, 2, 3].map((i)=>{
        return parseInt(from[i]*(1-fraction) + fraction*to[i]);
    });
}

function range(from, to, percentage)
{
    return get_color_towards(from, to, percentage);
}

/* IDIOT, this accepts rgba as well as rgb, but only gives an average of the rgb channels */
function average(rgb)
{
    return (rgb[0]+rgb[1]+rgb[2])/3;
}

function average_color(c1, c2)
{
    return [0, 1, 2, 3].map((i)=>{
        return parseInt((c1[i]+c2[i])/2);
    });
}

function rgba_to_text(rgba)
{
    return `rgba(${rgba[0]}, ${rgba[1]}, ${rgba[2]}, ${rgba.length==4?rgba[3]:255})`;
}

function putPixel(rgba, index, imgdata)
{
    if (rgba==undefined)
    {
        print(index)
        return;
    }
    imgdata.data[index  ] = rgba[0];
    imgdata.data[index+1] = rgba[1];
    imgdata.data[index+2] = rgba[2];
    imgdata.data[index+3] = rgba[3];
}