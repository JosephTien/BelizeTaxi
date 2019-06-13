var codes = ""
function appendToList(data){
    codes = data
    updateList()
}
function updateList(){
    var selector = document.getElementById("filter");
    var selectedValue = selector.options[selector.selectedIndex].value;
    var codestr = codes.split("^**^")
    var list = document.getElementById("list")
    list.innerHTML = ""
    for(var i=codestr.length-1;i>=0;i--){
        var code = codestr[i]
        if(code==""){ continue }
        var strs = code.split("^*^")
        if(selectedValue!="" && strs[3]!=selectedValue){ continue }
        strs[5] = calLap(parseInt(strs[5]))
        var tr = document.createElement("tr");
        tr.setAttribute("class", "listcol");
        tr.setAttribute("listcol-area", strs[3]);
        for (j in strs){
            if(j==4) continue // show note at the next line
            var str = strs[j]
            var td = document.createElement("td"); 
            var text = document.createTextNode(str);
            td.appendChild(text);
            tr.appendChild(td);
        }
        list.appendChild(tr);

        tr = document.createElement("tr");
        var td = document.createElement("td"); 
        var text = document.createTextNode(strs[4]);
        td.setAttribute("colspan", 6);
        td.appendChild(text);
        tr.appendChild(td);
        list.appendChild(tr);
    }
}