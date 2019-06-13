var url = require('url')
var f_s = require('fs');
var querystring = require('querystring');
var taxilist = {}
var codes = ""
var html = ""
var logging = false
/*******************************************************/
function readCode_trigger(handler){
  f_s.readFile('./data/code.txt', handler)
}
function readCode_handler(err, data){
  if(err){
    console.log(err)
    return
  }
  codes = data.toString()
  var codearr = codes.split("^**^")
  for(var i in codearr){
      var code = codearr[i]
      if(code==""){ continue }
      var strs = code.split("^*^")
      taxilist[strs[0]] = {
          licence: strs[0],
          name: strs[1],
          phone: strs[2],
          area: strs[3],
          note: strs[4],
          timestamp: strs[5],
      } 
  }
  if(logging) console.log("Read!");
  if(logging) console.log(taxilist)
}
function readCode(){
  readCode_trigger(readCode_handler)
}
function readCode_promise(){
  return new Promise(function(resolve, reject){
    readCode_trigger(function(err, data){
      if (err) {
        reject(err)
        return
      }
      readCode_handler(err, data)
      resolve()
    })
  })
}

function writeCode_trigger(handler){
  f_s.writeFile("./data/code.txt", codes, handler)
}
function writeCode_handler(err){
  if(err){
    console.log(err)
    return
  }
  if(logging) console.log("Saved!");
}
function writeCode(){
  writeCode_trigger(writeCode_handler)
}
function writeCode_promise(){
  return new Promise(function(resolve, reject){
    writeCode_trigger(function(err){
      if(err){
        reject(err)
      }
      writeCode_handler(err)
      resolve()
    })
  })
}
function appendCodeSync(taxi){
  code = taxi.licence +
    "^*^" + taxi.name + 
    "^*^" + taxi.phone + 
    "^*^"  + taxi.area + 
    "^*^"  + taxi.note + 
    "^*^"  + taxi.timestamp +
    "^**^"
  try{
    f_s.appendFileSync('./data/code.txt', code);
  }catch(err){
    return err
  }
}
function updateCode(){
    codes = ""
    var taxiarr = Object.values(taxilist)
    taxiarr.sort(function(a, b){return a.timestamp-b.timestamp});
    for(var idx in taxiarr){
        var taxi = taxiarr[idx]
        codes += taxi.licence +
        "^*^" + taxi.name + 
        "^*^" + taxi.phone + 
        "^*^"  + taxi.area + 
        "^*^"  + taxi.note + 
        "^*^"  + taxi.timestamp +
        "^**^"
    }
    if(logging) console.log(codes)
}
/*******************************************************/
function receiveGet_promise(req){
  return new Promise(function(resolve, reject){
    var params = url.parse(req.url, true).query
    if(params.delete != undefined){
      delete taxilist[params.delete]
      updateCode()
      writeCode()
      resolve("update")
    }if(params.raw != undefined){
      resolve("raw")
    }else{
      //resolve("normal")
      reject()
    }
  })
}
function receivePost_promise(req){
  return new Promise(function(resolve, reject){
    var body = "";
    req.on('data', function (chunk) {
      body += chunk;
    });
    req.on('end', function () {
      body = querystring.parse(body);
      if(body.licence != undefined){
        taxilist[body.licence] = {
          licence: body.licence,
          name: body.name,
          phone: body.phone,
          area: body.area,
          note: body.note.replace("\r\n","<br/>").replace("\n","<br/>"),
          timestamp: Date.now()
        }
        updateCode()
        var err = appendCodeSync(taxilist[body.licence])
        resolve()
      }else{
        reject()
      }
    });
  })
}
function generatePage_trigger(handler){
  f_s.readFile(__dirname + '/public/index.html', handler)
}
function generatePage_handler(err, data){
  if(err){
    console.log(err)
    return
  }
  html = data.toString()
  var inner = ""
  inner += `<!---------------------------------------->\n`
  var codearr = codes.split("^**^")
  for(var i=codearr.length-1;i>=0;i--){
      var code = codearr[i]
      if(code==""){ continue }
      var strs = code.split("^*^")
      
      inner += `<tr class='taxi' filter='${strs[3]}'>\n`
      //inner += `<tr class='taxi' filter='${strs[3]}' onclick='toggleDisplay("taxi-detail-${i}")' >\n`
      for (var j=0;j<3;j++){
          inner += `  <td>${strs[j]}</td>\n`
      }
      inner += `</tr>\n`
      inner += `<tr class='taxi taxi-detail togglable' filter='${strs[3]}' id='taxi-detail-${i}' >\n`
      //inner += `<tr class='taxi taxi-detail' filter='${strs[3]}' onclick='toggleDisplay("taxi-detail-${i}")' id='taxi-detail-${i}' >\n`
      inner += `  <td colspan='3'>
    <div class='row'>
      <div class='col' style='text-align: left;'>
        ${strs[4]}
      </div>
    </div>
    <div class='row'>
      <div class='col' style='text-align: right;'>
        ＠: ${strs[3]}<br>
        <div class='timestamp' value='${strs[5]}'>↻: </div>
      </div>
    </div>
  </td>\n`
      inner += `</tr>\n`
  }
  inner += `<!---------------------------------------->`
  html = html.replace("<%=content%>", inner)
}
function generatePage(){
  generatePage_trigger(generatePage_handler)
}
function generatePage_promise(){
  return new Promise(function(resolve, reject){
    generatePage_trigger(function(err, data){
      if (err) {
        reject(err)
        return
      }
      generatePage_handler(err, data)
      resolve()
    })
  })
}
function generatePageAndRespond(res){
  generatePage_promise().then(function(){
    respondPage(res)
  })
}
function respondPage(res){
  res.writeHead(200, {'Content-Type': 'text/html'}) 
  res.write(html)
  res.end()
}
function respondList(req, res){
  var params = url.parse(req.url, true).query
  if(params.delete != undefined){
    delete taxilist[params.delete]
    updateCode()
  }
  res.write("<script>")
    res.write(`appendToList("${codes}")`)
    res.write("</script>")
}
/*******************************************************/
function initStorage(handler){
  return new Promise(function(resolve, reject){
    readCode_promise().then(function(){
      updateCode()
      writeCode_promise().then(function(){
        generatePage_promise().then(resolve).catch(reject)
      }).catch(reject)
    }).catch(reject)
  })
}
function mainRespond(req, res){
  var proc = function(){
    if(req.method=="POST"){
      receivePost_promise(req).then(function(){
        generatePageAndRespond(res)
      }).catch(function(){
        respondPage(res)
      })
    }else{
      receiveGet_promise(req).then(function(ins){
        if(ins == "update"){
          generatePageAndRespond(res)
        }else if(ins == "normal"){
          respondPage(res)
        }else if(ins=="raw"){
          res.write(codes)
          res.end()
        }
      }).catch(function(){
        //generatePageAndRespond(res)
        respondPage(res)
      })
    }
  }
  if(html==""){
    initStorage().then(proc).catch(console.log)
  }else{
    proc()
  }
  
}
/*******************************************************/
/*******************************************************/
var port = process.env.PORT || 3000, 
    http = require('http'), 
    fs = require('fs') 
    
var app = http.createServer(function (req, res) { 
  if (req.url.indexOf('/img') != -1) { 
    var filePath = req.url.split('/img')[1] 
    fs.readFile(__dirname + '/public/img' + filePath, function (err, data) { 
      if (err) { 
        res.writeHead(404, {'Content-Type': 'text/plain'}) 
        res.write('Error 404: Resource not found.') 
        console.log(err) 
      } else { 
        res.writeHead(200, {'Content-Type': 'image/svg+xml'}) 
        res.write(data) 
      } 
      res.end() 
    }) 
  } else if (req.url.indexOf('/js') != -1) { 
    var filePath = req.url.split('/js')[1] 
    fs.readFile(__dirname + '/public/js' + filePath, function (err, data) { 
      if (err) { 
        res.writeHead(404, {'Content-Type': 'text/plain'}) 
        res.write('Error 404: Resource not found.') 
        console.log(err) 
      } else { 
        res.writeHead(200, {'Content-Type': 'text/javascript'}) 
        res.write(data) 
      } 
      res.end() 
    }) 
  } else if(req.url.indexOf('/css') != -1) { 
    var filePath = req.url.split('/css')[1] 
    fs.readFile(__dirname + '/public/css' + filePath, function (err, data) { 
      if (err) { 
        res.writeHead(404, {'Content-Type': 'text/plain'}) 
        res.write('Error 404: Resource not found.') 
        console.log(err) 
      } else { 
        res.writeHead(200, {'Content-Type': 'text/css'}) 
        res.write(data) 
      } 
      res.end() 
    }) 
  } else {
    mainRespond(req, res)////////////////
    /*
    fs.readFile(__dirname + '/public/index.html', function (err, data) { 
      if (err) {
        res.writeHead(404, {'Content-Type': 'text/plain'}) 
        res.write('Error 404: Resource not found.') 
        console.log(err)
      } else { 
        res.writeHead(200, {'Content-Type': 'text/html'}) 
        res.write(data)
      } 
      res.end() 
    })
    */
  } 
}).listen(port, '0.0.0.0') 

module.exports = app