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
        <div class='timestamp' value='${strs[5]}'></div>
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
  } else if(req.url.indexOf('/bus') != -1) { 
    respondBusTable(req, res)
  } else{ 
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

/*******************************************************/
/*******************************************************/
//const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');
// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = 'key/token.json';
const CREDENTIALS_PATH = 'key/credentials.json';
// Load client secrets from a laocal file.
fs.readFile(CREDENTIALS_PATH, (err, content) => {
  if (err) return console.log('Error loading client secret file:', err);
  // Authorize a client with credentials, then call the Google Sheets API.
  authorize(JSON.parse(content),mainFetchProcess);
});
/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
  const {client_secret, client_id, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
      client_id, client_secret, redirect_uris[0]);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getNewToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client);
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getNewToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error('Error while trying to retrieve access token', err);
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return console.error(err);
        console.log('Token stored to', TOKEN_PATH);
      });
      callback(oAuth2Client);
    });
  });
}
//-----------------------------------------------------------------------
var busSheetId = '18ZWZgy-PeEetBdmz9aXqLwO6nyB0yXdegqsmKa0zsIk'
var guidline = {
    'parameters':['line={tag of line}'],
    'lines': [
        {'tag': 'BVO_BZE','description': 'Western, from Benque Viejo to Belize City.'},
        {'tag': 'BZE_BVO','description': 'Western, from Belize City to Benque Viejo.'},
        {'tag': 'SE_BZE','description': 'Northern, from Santa Elena Border to Belize City.'},
        {'tag': 'BZE_SE','description': 'Northern, from Belize City to Santa Elena Border.'},
        {'tag': 'PG_BZE','description': 'Southern, from Punta Gorda to Belize City.'},
        {'tag': 'BZE_PG','description': 'Southern, from Belize City to Punta Gorda.'}
    ]
}
var guidlineJSON = JSON.stringify(guidline, undefined, 2)
var busTable = {}
var busTableJSON = {}
//-----------------------------------------------------------------------
var auth
var cnt;
function mainFetchProcess(_auth){
    auth = _auth
    cnt=0;
    for(var i=0;i<6;i++){
        fetchSheetData(guidline['lines'][i]['tag'])
    }
}
function finishFetchHandler(){
    cnt++
    if(cnt==guidline['lines'].length){}
}
function setLineData(linetag, rows) {
    var pack = {}
    var buses = []
    var terminals = []
    rows.map((row, idx) => { 
        if(idx==0){
            for(var i=4;i<row.length;i+=2){
                terminals.push(rows[0][i])
            }
        }else{
            var bus = {}
            bus['id']=row[0]
            bus['company']=row[1]
            bus['rsp']=row[2]
            bus['days']=row[3]
            bus['arrive']=[]
            bus['depart']=[]
            function st(str){ return str==undefined?'':str;}
            for(var j=0;j<terminals.length;j++){
                bus['arrive'].push(st(row[4+j*2]))
                bus['depart'].push(st(row[4+j*2+1]))
            }
            buses.push(bus)
        }
    })
    pack['line'] = linetag
    for(var i=0;i<guidline['lines'].length;i++){
        if(guidline['lines'][i]['tag']==linetag){
            pack['description'] = guidline['lines'][i]['description']
            break;
        }
    }
    pack['terminals'] = terminals
    pack['buses'] = buses
    busTable[linetag]=pack
    busTableJSON[linetag]=JSON.stringify(pack, undefined, 2)
    finishFetchHandler()
}
function fetchSheetData(linetag){
    const sheets = google.sheets({version: 'v4', auth});
    sheets.spreadsheets.values.get({
      spreadsheetId: busSheetId,
      range: linetag+'!A1:Z',
    }, (err, res) => {
      if (err) return console.log('The API returned an error: ' + err);
      const rows = res.data.values;
      if (rows.length) {
        //rows.map((row) => { console.log(row); });
        setLineData(linetag, rows)
      } else {
        console.log('No data found.');
      }
    });
}
//-----------------------------------------------------------------------
function respondBusTable(req, res){
  var params = url.parse(req.url, true).query
    if(params.line == undefined){
      res.write(guidlineJSON)
      res.end()
    }else{
      if(params.line=='' || busTableJSON[params.line]){
        res.write("Bad Request")
      }else{
        res.write(busTableJSON[params.line]) 
      }
      res.end()
    }
}