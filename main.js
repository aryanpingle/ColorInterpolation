"use strict"

// Global Variables
let INTERPOLATION_COUNT = 0

// Initialize
function init() {
    // Event Listeners
    CANVAS.addEventListener("dragenter", preventDefault, false)
    CANVAS.addEventListener("dragleave", canvas_dragleave, false)
    CANVAS.addEventListener("dragover", canvas_dragover, false)
    CANVAS.addEventListener("drop", canvas_dropped, false)

    // Setup the slider thingy
    setup_interpolation_input()

    let preset_colors = document.querySelectorAll("#wheel > :not(.add-color)")
    preset_colors.forEach(normalize)

    // Select the first color by default
    select_color(preset_colors[0])

    // Load the initial image
    load_image('images/Arkham Knight.jpg')
}

init()

function load_image(src) {
    img.src = src
}

function preventDefault(e) {
    e.preventDefault()
    e.stopPropagation()
}

function canvas_dragleave(event) {
    event.preventDefault()
    CANVAS.style.filter = ""
}

function canvas_dragover(event) {
    event.preventDefault()
    CANVAS.style.filter = "blur(2px)"
}

function canvas_dropped(event) {
    event.preventDefault()
    CANVAS.style.filter = ""
    let data = event.dataTransfer
    let txt = data.getData('text')
    const eds = ["jpg", "png"]
    if (data.files.length != 0) {
        print("Detected: %c File ", "color:white;background-color:green;text-transform:uppercase;")
        print("DATA:", event)
        uploaded(data)
        // setup_slider()
    }
    else if (eds.includes(txt.substring(txt.lastIndexOf(".") + 1))) {
        print("Detected: %c URL ", "color:white;background-color:green;text-transform:uppercase;")
        print(txt)
        load_image(txt)
    }
    else {
        print("Uploaded file/url is invalid")
    }
}

function file_upload(event) {
    if (event.button == 0) // LMB
    {
        document.getElementById("file").click()
    }
}

function uploaded(x) {
    load_image(URL.createObjectURL(x.files[0]))
}

function create_color(targetElement, v) {
    let ele = document.createElement("div")
    ele.setAttribute("onclick", "select_color(this)")
    ele.setAttribute("text", targetElement.parentElement.querySelector(".active").getAttribute("text"))
    if (v == 0) {
        // Add to right
        targetElement.after(ele)
        // console.log(targetElement.previousElement)
    }
    else {
        targetElement.before(ele)
        // console.log(targetElement.previousElement)
    }
    normalize(ele)
    select_color(ele)

    select_text()
}

function select_text() {
    let sss = document.createRange()
    sss.selectNodeContents(document.querySelector("ctext"))
    window.getSelection().removeAllRanges()
    window.getSelection().addRange(sss)
}

function select_color(x) {
    if (x == null) x = document.querySelectorAll("#wheel .active")[0]
    x.parentElement.querySelectorAll(".active").forEach(ele => {
        ele.classList.remove("active")
        ele.setAttribute("text", document.querySelector("ctext").innerText)
        normalize(ele)
    })
    x.classList.add("active")
    let add_buttons = document.querySelectorAll("div.add-color")
    x.before(add_buttons[0])
    x.after(add_buttons[1])

    document.querySelector("ctext").innerHTML = x.getAttribute("text")
    select_text()
}

/**
* Takes in the color button, changes its color, validates input
* If the parameter <b>x</b> is null, the function find the currently active color button
*/
function normalize(x) {
    if (x == null) x = document.querySelectorAll("#wheel .active")[0]
    let text = x.getAttribute("text").trim().toUpperCase()
    if (text.match(/\//)) {
        // Make all word arguments uppercase
        let [left_color, right_color] = text.split(/\s*\/\s*/g)
        left_color = eval(left_color)
        right_color = eval(right_color)

        // Set the [left_color, right_color] value of the element
        let value = `[[${left_color}], [${right_color}]]`
        x.setAttribute("value", value)

        // Set the background to a linear gradient
        x.style.setProperty("background", `linear-gradient(to right, ${rgb_to_text(left_color)}, ${rgb_to_text(right_color)})`)
    }
    else {
        let color = eval(text)

        // Set the [left_color, right_color] value of the element
        let value = `[[${color}], [${color}]]`
        x.setAttribute("value", value)

        // Set the background to simple color
        x.style.setProperty("background", rgb_to_text(color))
    }
}

function delete_selected() {
    let wheel = document.querySelector("#wheel")
    if(wheel.childElementCount == 3) return

    let selected = wheel.querySelector(".active")
    let selected_after_deleting = wheel.querySelector(":not(.active, .add-color)")
    print(selected_after_deleting)
    select_color(selected_after_deleting)
    selected.remove()
}

function ctext_pressed(event) {
    if (event.keyCode == 13) { // [ENTER]
        print(event.target)
        document.querySelectorAll("#wheel .active")[0].setAttribute("text", event.target.innerText)

        try {
            normalize(null)
        }
        catch (event) {
            print(event)
            print("%cINVALID COLOR!", "color:red")
        }
        event.preventDefault()
    }
}

function setup_interpolation_input() {
    document.querySelector(".interpolation__decrease").onclick = event => {
        if(INTERPOLATION_COUNT == 0) return

        changeInterpolation(-1)
    }
    document.querySelector(".interpolation__increase").onclick = event => {
        if(INTERPOLATION_COUNT == 8) return
        
        changeInterpolation(1)
    }
}

function changeInterpolation(DELTA) {
    INTERPOLATION_COUNT += DELTA

    // Show the count
    document.querySelector(".interpolation__count").innerText = INTERPOLATION_COUNT
    
    // DEBUGGING: Print the number of generated colors
    const PALETTE_COUNT = document.querySelector("#wheel").childElementCount - 2
    print(`${1 + (PALETTE_COUNT - 1) * (2**INTERPOLATION_COUNT)} colors will be created`)
    
    paint()
}

const HIDDEN_DOWNLOAD_LINK_ELEMENT = document.createElement("A")

function save_image() {
    HIDDEN_DOWNLOAD_LINK_ELEMENT.setAttribute('download', `Lerp.jpg`);
    HIDDEN_DOWNLOAD_LINK_ELEMENT.setAttribute('href', CANVAS.toDataURL("image/jpg").replace("image/jpg", "image/octet-stream"));
    HIDDEN_DOWNLOAD_LINK_ELEMENT.click();
}