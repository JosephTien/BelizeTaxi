function openForm(){document.getElementById("form-screen").style.display="block"}function closeForm(){document.getElementById("form-screen").style.display="none"}function toggleDisplay(e){"none"==document.getElementById(e).style.display?document.getElementById(e).style.display="":document.getElementById(e).style.display="none"}function toggleAllDisplay(){for(var e=document.getElementsByClassName("togglable"),t=0;t<e.length;t++)"none"==e[t].style.display?e[t].style.display="":e[t].style.display="none"}function onFilterChange(){for(var e=document.getElementById("filter"),t=e.options[e.selectedIndex].value,n=document.getElementsByClassName("taxi"),l=!1,o=0;o<n.length;o++){var a=n[o];""==t||a.getAttribute("filter")==t?l=!(a.style.display=""):a.style.display="none"}document.getElementById("taxi-noava").style.display=l?"none":"",calAllLap()}function calAllLap(){for(var e=document.getElementsByClassName("timestamp"),t=0;t<e.length;t++)e[t].innerHTML="↻: "+calLap(parseInt(e[t].getAttribute("value")))}function calLap(e){var t=(new Date).getTime(),n=Math.floor((t-e)/6e4);return n<60?(n<2&&n+" min ago",n+" mins ago"):n<1440?((n=Math.floor(n/60))<2&&n+" hour ago",n+" hours ago"):((n=Math.floor(n/1440))<2&&n+" day ago",n+" days ago")}window.history.replaceState({},document.title,"/"),onFilterChange();