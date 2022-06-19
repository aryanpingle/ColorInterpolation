"use strict"

// Normal Constants
const canvas = document.getElementById("main")
const ctx = canvas.getContext("2d")
let WIDTH = 0, HEIGHT = 0
let pixels = []

var img = new Image()
img.crossOrigin = "Anonymous"

var max_img_w = document.body.clientWidth/1.5, max_img_h = document.body.clientHeight - 40
var INTERPOLATION_TYPE = 0
// Normal, Along x, along y

img.onload = function() {
    let starttime = 0
    let factor = Math.min(max_img_w/img.width, max_img_h/img.height)
    canvas.width = img.width*factor
    canvas.height = img.height*factor
    
    WIDTH = canvas.width
    HEIGHT = canvas.height
    
    ctx.drawImage(img, 0, 0, WIDTH, HEIGHT)
    
    // Setup pixels
    starttime = new Date().getTime()
    pixels = ctx.getImageData(0, 0, WIDTH, HEIGHT).data
    print(`Pixels set up in %c${new Date().getTime()-starttime} ms`, 'color:greenyellow')
}

// Variables
var standards = []
var frac1 = ORANGE, frac2 = BLUE

function load_image(src)
{
    img.src = src
}

function interpolate(INTERPOLATION_LIMIT)
{
    for(let k = 0; k < INTERPOLATION_LIMIT; ++k)
    {
        let n = standards.length
        for(let i = 0; i < n-1; ++i)
        {
            standards.splice(i*2+1, 0, average_color(standards[i*2], standards[i*2+1]))
        }
    }
}

function f(rgba)
{
    let f = average(rgba)*standards.length/255-0.01
    return standards[Math.max(0, parseInt(f))]
}

function get_interpolated_color(grayscale, SOURCE_COLORS) {
    const N = SOURCE_COLORS.length
    
    // The grayscale can be in one of N-1 buckets
    // So I'm assigning it a bucket based on the starting index of the bucket i.e. N - 2 possible values

    let combination_start_index = Math.floor(lerp(grayscale, 0, 256, 0, N - 1))

    let unit = 255 / (N - 1)
    let fr = lerp(grayscale, combination_start_index*unit, (combination_start_index + 1)*unit, 0, 1)

    return get_color_towards(SOURCE_COLORS[combination_start_index], SOURCE_COLORS[combination_start_index+1], fr)
}

function paint() {
    let INTERPOLATION_LIMIT = document.getElementById("interpolation-limit").getAttribute("value")

    const WHEEL_COLORS = [...document.querySelectorAll("#wheel > div:not(.add-color)")].map(ele => ele.getAttribute("value"))
    standards = [...WHEEL_COLORS]

    // Figure out here which type of interpolation it is
    INTERPOLATION_TYPE = 0
    for(const a of standards)
    {
        if(a.startsWith("get_color_towards"))
        {
            INTERPOLATION_TYPE = 1
            break
        }
    }

    if(INTERPOLATION_TYPE == 0)
    {
        print("Normal Interpolation")
        for(let i=0; i < standards.length; ++i)
        {
            standards[i] = eval(standards[i])
        }
    }

    let imgdata = new ImageData(WIDTH, HEIGHT)
    let starttime = new Date().getTime()
    for(let x = 0; x < WIDTH; ++x)
    {
        let fr = x / WIDTH
        // Perform fractional interpolation
        if(INTERPOLATION_TYPE == 1)
        {
            standards = new Array(WHEEL_COLORS.length)
            for(let i = 0; i < standards.length; ++i)
            {
                standards[i] = eval(WHEEL_COLORS[i])
            }
        }
        
        for(let j = 0; j < HEIGHT; ++j)
        {
            let index = 4*(j*WIDTH + x)
            let rgba = [pixels[index], pixels[index+1], pixels[index+2]]
            putPixel(get_interpolated_color(average(rgba), standards), index, imgdata)
        }
    }
    print(`New Image created in %c${new Date().getTime()-starttime}ms`, 'color: greenyellow;')
    ctx.putImageData(imgdata, 0, 0)
}