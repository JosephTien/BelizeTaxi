function openForm() {
    document.getElementById("form-screen").style.display = "block";
}
function closeForm() {
    document.getElementById("form-screen").style.display = "none";
}
function toggleDisplay(id){
    if(document.getElementById(id).style.display=="none"){
        document.getElementById(id).style.display = ""
    }else{
        document.getElementById(id).style.display = "none"
    }
}
function toggleAllDisplay(){
    var togglables = document.getElementsByClassName("togglable");
    for(var i=0;i<togglables.length;i++){
        if(togglables[i].style.display=="none"){
            togglables[i].style.display = ""
        }else{
            togglables[i].style.display = "none"
        }
    }
}
function onFilterChange(){
    var selector = document.getElementById("filter");
    var selectedValue = selector.options[selector.selectedIndex].value;
    var listcols = document.getElementsByClassName("taxi");
    var avaliable = false
    for (var i = 0; i < listcols.length; i++) {
        var listcol = listcols[i]
        if(selectedValue=="" || listcol.getAttribute("filter") == selectedValue){
            listcol.style.display = "";
            avaliable = true
        }else{
            listcol.style.display = "none";
        }
    }
    if(avaliable){
        document.getElementById("taxi-noava").style.display = "none"
    }else{
        document.getElementById("taxi-noava").style.display = ""
    }
    calAllLap()
}
function calAllLap(){
    var timestamps = document.getElementsByClassName("timestamp");
    for (var i = 0; i < timestamps.length; i++) {
        timestamps[i].innerHTML=="↻: "+calLap(parseInt(timestamps[i].getAttribute("value")))
    }
}
function calLap(timestamp){
    var curtime = new Date().getTime()
    var lap =  Math.floor((curtime - timestamp)/60000);
    var lapstr = ""
    if(lap < 60){
        if(lap < 2){
            lapstr = lap + " min ago"
        }
        lapstr = lap + " mins ago"
    }else if(lap < 1440){
        lap = Math.floor(lap/60)
        if(lap < 2){
            lapstr = lap + " hour ago"
        }
        lapstr = lap + " hours ago"
    }else{
        lap = Math.floor(lap/1440)
        if(lap < 2){
            lapstr = lap + " day ago"
        }
        lapstr = lap + " days ago"
    }
    return lapstr
}
/********************************************************************/
window.history.replaceState({}, document.title, "/");
onFilterChange()