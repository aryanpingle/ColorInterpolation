window.onload = function () {
    // Service Worker
    if("serviceWorker" in navigator) {
        navigator.serviceWorker.register("sw.js")
    }

    canvas.addEventListener("dragenter", preventDefault, false);
    canvas.addEventListener("dragleave", canvas_dragleave, false);
    canvas.addEventListener("dragover", canvas_dragover, false);
    canvas.addEventListener("drop", canvas_dropped, false);
    setup_slider();
    link_toggle_buttons();
    let t = document.getElementById("wheel").children;
    normalize(t[1]);
    normalize(t[2]);
    select_color(t[1]);
    load_image('images/Arkham Knight.jpg');
};

function preventDefault(e) {
    e.preventDefault();
    e.stopPropagation();
}

var mysoul = 0;

function canvas_dragleave(event) {
    event.preventDefault();
    canvas.style.filter = "";
}

function canvas_dragover(event) {
    event.preventDefault();
    canvas.style.filter = "blur(2px)";
}

function canvas_dropped(event) {
    event.preventDefault();
    canvas.style.filter = "";
    let data = event.dataTransfer;
    let txt = data.getData('text');
    const eds = ["jpg", "png"];
    if (data.files.length != 0) {
        print("Detected: %c File ", "color:white;background-color:green;text-transform:uppercase;");
        print("DATA:", event);
        uploaded(data);
        setup_slider();
    }
    else if (eds.includes(txt.substring(txt.lastIndexOf(".") + 1))) {
        print("Detected: %c URL ", "color:white;background-color:green;text-transform:uppercase;");
        print(txt);
        load_image(txt);
    }
    else {
        print("Uploaded file/url is invalid");
    }
}

function file_upload(event) {
    if (event.button == 0) // LMB
    {
        document.getElementById("file").click();
    }
}

function uploaded(x) {
    load_image(URL.createObjectURL(x.files[0]));
}

function create_color(x, v) {
    let ele = document.createElement("div");
    ele.setAttribute("onclick", "select_color(this)");
    ele.setAttribute("text", "WHITE");
    if (v == 0) {
        $(x).after(ele);
    }
    else {
        $(x).before(ele);
    }
    normalize(ele);
    select_color(ele);

    select_text();
}

function select_text() {
    let sss = document.createRange();
    sss.selectNodeContents($("ctext")[0]);
    window.getSelection().removeAllRanges();
    window.getSelection().addRange(sss);
}

function select_color(x) {
    if (x == null) x = $("#wheel .active")[0];
    print("Selecting element:", x);
    $(x.parentElement).find(".active").each(function () {
        this.classList.remove("active");
        this.setAttribute("text", $("ctext")[0].innerText);
        normalize(this);
    });
    $(x).addClass("active");
    let hhh = $("div.add-color");
    $(x).before(hhh[0]);
    $(x).after(hhh[1]);

    $("ctext")[0].innerHTML = x.getAttribute("text");
    select_text();
}

/**
* Takes in the color button, changes its color, validates input
* If the parameter <b>x</b> is null, the function find the currently active color button
*/
function normalize(x) {
    if (x == null) x = $("#wheel .active")[0];
    print("Normalizing element:", x);
    let text = x.getAttribute("text");
    if (text.startsWith("range")) {
        print("Setting to a %cCOLOR RANGE", "color:orange");
        let fr = 0;
        text = text.replace(/(?<=,|\()([a-zA-Z]+)(?=\)|,)/gm, ($0, $1) => { return $0.replace($1, $1 != "fr" ? $1.toUpperCase() : $1) });
        text = text.substring(6, text.length - 1);
        print(text);
        if (eval("[" + text + "]").length == 2) {
            text += ", fr";
        }
        let value = "get_color_towards(" + text + ")";
        x.setAttribute("value", value);
        text = eval("[" + text + "]");
        $(x).css("background", "linear-gradient(to right, " + rgba_to_text(text[0]) + ", " + rgba_to_text(text[1]) + ")");
    }
    else {
        text = text.toUpperCase();
        let value = eval(text);
        // Add alpha
        if (value.length == 3) {
            value.push(255);
        }
        print("Color set to %c" + value + "", "color:rgba(" + value + ")");
        x.setAttribute("value", "[" + value + "]");
        $(x).css("background", rgba_to_text(value));
    }
}

function delete_selected() {
    let a = $("#wheel > *");
    if (a.length > 3) {
        a.filter(".active").remove();
        select_color(a.filter(":not(.active,.add-color)")[0]);
    }
}

function ctext_pressed(event) {
    if (event.keyCode == 13) {
        $("#wheel .active")[0].setAttribute("text", $("ctext")[0].innerText);

        try {
            normalize(null);
        }
        catch (event) {
            print(event);
            print("%cINVALID COLOR!", "color:red");
        }
        event.preventDefault();
    }
}