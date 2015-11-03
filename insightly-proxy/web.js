var http = require('http'),
    httpProxy = require('http-proxy');
 
// 
// Create a proxy server with custom application logic 
// 
var proxy = httpProxy.createProxyServer({});

var API_KEY = process.env.INSIGHTLY_API_KEY;

var ENCODED_API_KEY = new Buffer(API_KEY).toString('base64');

// 
// Create your custom server and just call `proxy.web()` to proxy 
// a web request to the target passed in the options 
// also you can use `proxy.ws()` to proxy a websockets request 
// 
var server = http.createServer(function(req, res) {
    // For CORS support - allows AJAX calls
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:8080');

    console.log('Proxying:', req.headers);

    // req.headers = {};
      
    req.on('data', function(chunk) {
      console.log("Received body data:");
      console.log(chunk.toString());
    });
    
    req.headers['Authorization'] = 'Basic ' + ENCODED_API_KEY;
    req.headers['host'] = 'api.insight.ly';

    console.log('Post processing:', req.headers);

    proxy.web(req, res, { target: 'https://api.insight.ly/' });
});
 
console.log("listening on port", process.env.PORT || 5000)
server.listen(process.env.PORT || 5000);