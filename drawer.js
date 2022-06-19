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

function paint() {
    print("Inside paint()")
    let INTERPOLATION_LIMIT = document.getElementById("interpolation-limit").getAttribute("value")

    standards = []
    for(const a of document.querySelectorAll("#wheel > div:not(.add-color)"))
    {
        standards.push(a.getAttribute("value"))
    }
    print(standards)

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
        print("STANDARDS:", standards)
        interpolate(INTERPOLATION_LIMIT)
    }
    
    let starttime = new Date().getTime()
    let imgdata = new ImageData(WIDTH, HEIGHT)
    for(let x = 0; x < WIDTH; ++x)
    {
        let fr = x/WIDTH
        // Perform fractional interpolation
        if(INTERPOLATION_TYPE == 1)
        {
            standards = []
            for(const a of document.querySelectorAll("#wheel > div:not(.add-color)"))
            {
                standards.push(eval(a.getAttribute("value")))
                if(typeof standards[-1] == Array && standards[-1].length==3)
                {
                    standards[-1].push(255)
                }
            }
            interpolate(INTERPOLATION_LIMIT)
        }
        
        for(let j = 0; j < HEIGHT; ++j)
        {
            let index = 4*(j*WIDTH + x)
            let rgba = pixels.slice(index, index+4)
            putPixel(f(rgba), index, imgdata)
        }
    }
    print(`New Image created in %c${new Date().getTime()-starttime}ms`, 'color: greenyellow;')
    starttime = new Date().getTime()
    ctx.putImageData(imgdata, 0, 0)
    print(`Finished drawing in %c${new Date().getTime()-starttime}ms`, 'color: greenyellow;')
}