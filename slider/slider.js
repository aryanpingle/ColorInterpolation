function setup_slider()
{
    $("slider").each(function(){
        let max = this.getAttribute("max-value");
        let min = this.getAttribute("min-value");
        let value = parseInt((min+max)/2);
        if(this.getAttribute("value") == null) this.setAttribute("value", this.getAttribute("default")!=null?(value=this.getAttribute("default")):value);
        this.innerHTML = value;
        $(this).css("--progress", ((value-min)/(max-min))*100+"%");
    });
}

var new_slider_value = 0;
var slider_start_mx = 0;
var slider_min = 0;
var slider_max = 0;
$("slider").mousedown(function(event){
    // Obvious
    slider_max = this.getAttribute("max-value");
    slider_min = this.getAttribute("min-value");
    slider_start_mx = event.clientX;
    this.setAttribute("slider-on", true);
}).mouseup(function(event){
    this.setAttribute("value", new_slider_value);
    this.setAttribute("slider-on", false);
}).mousemove(function(event){
    if(this.getAttribute("slider-on") == "true")
    {
        // Change in x
        let dx = event.clientX - slider_start_mx;
        dx *= 2;
        
        new_slider_value = parseInt(this.getAttribute("value"));
        
        // Change value based on dx
        new_slider_value = Math.max(Math.min(new_slider_value+parseInt(dx / (this.offsetWidth / (slider_max-slider_min))), slider_max), slider_min);
        this.innerHTML = new_slider_value;
        
        $(this).css("--progress", ((new_slider_value-slider_min)/(slider_max-slider_min))*100+"%");

        if(new_slider_value!=this.getAttribute("value"))
        {
            slider_start_mx = event.clientX;
            this.setAttribute("value", new_slider_value);
            
            if(this.getAttribute("use"))
            {
                eval(this.getAttribute("use"));
            }
        }
    }
}).mouseout(function(event){
    if(this.getAttribute("slider-on") == "true")
    {
        this.setAttribute("value", new_slider_value);
        this.setAttribute("slider-on", false);
    }
});