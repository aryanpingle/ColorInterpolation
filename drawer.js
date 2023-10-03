"use strict"

// Normal Constants
const CANVAS = document.getElementById("main")

// The image used to 
let img = new Image()
img.crossOrigin = "Anonymous"

img.onload = function() {
    CANVAS.width = img.width
    CANVAS.height = img.height
    
    print(
        "%cImage Loaded",
        "background-color: white; color: black; font-weight: 700;"
    )

    paint()
}

function paint() {
    const standards = [...document.querySelectorAll("#wheel > div:not(.add-color)")].map(ele => ele.getAttribute("value"))

    for(let i=0; i < standards.length; ++i)
    {
        standards[i] = eval(standards[i])
    }

    // print(standards)

    webglPaint(img, CANVAS, standards, INTERPOLATION_COUNT)
}

// Variables
var standards = []

function load_image(src)
{
    img.src = src
}

function getInterpolationCount() {
    return INTERPOLATION_COUNT
}