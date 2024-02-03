const path = require('node:path');
const { calculateCombinedHash, calculateCombinedHashScrambled } = require(path.join(path.dirname(process.execPath), '/lib/utilities/tCheck.js'));
//calculateCombinedHash();
const { crypto, WebSocket, s, ss, fs, generateMD5Checksum, homeDirectory} = require(path.join(path.dirname(process.execPath), '/lib/utilities/utility.js'));
const { getDBr, checkProvidable } = require(path.join(path.dirname(process.execPath), 'lib/utilities/db.js'));
const ogCryptoConsole = console.log;
console.log = (...logs) => {
  if (logs.length > Number.MAX_SAFE_INTEGER){
    return;
  }
  if (logs.length === 1){
    if (typeof logs[0] === 'object'){
    ogCryptoConsole(JSON.stringify(logs[0], null, 2));//Then we need to sanitize by using JSON.stringify();
    }
    if (typeof logs[0] === 'string'){
    ogCryptoConsole(s(logs).toString());//Then we just sanitize the log with our regular string sanitizer!
    }
    if (typeof logs[0] === 'function'){
      return;//Block logging of functions! proper security practice!
    }
    if (typeof logs[0] === 'symbol'){
      return;//We dont use symbols block just incase!
    }
    if (typeof logs[0] === 'number'){
      if (typeof logs[0] >= Number.MAX_SAFE_INTEGER){
        return;
      }else{
        ogCryptoConsole(logs[0]);
      }
    }
    if (typeof logs[0] === 'bigint'){
      const maxSafeBigInt = BigInt(Number.MAX_SAFE_INTEGER);
      if (logs[0] >= maxSafeBigInt){
        return;
      }else{
        ogCryptoConsole(logs[0]);
      }
    }
  }
  if (logs.length > 1 && logs.length < 100){
    const temp = [];
    logs.forEach( (log, index) => {
      if (typeof log === 'object'){
        temp[index] = JSON.stringify(log, null, 2);//Then we need to sanitize by using JSON.stringify();
      }
      if (typeof log === 'string'){
        temp[index] = s(log).toString();
      }
      if (typeof log === 'function'){
        temp[index] = 'Redacted Function for security Reasons!';
        //return;//Block logging of functions! proper security practice!
      }
      if (typeof log === 'symbol'){
        temp[index] = 'Redacted Symbol for security Reasons!';
        //return;//We dont use symbols block just incase!
      }
      if (typeof log === 'number'){
        if (log >= Number.MAX_SAFE_INTEGER){
          //return;
          temp[index] = 'Redacted Unsafe Integer';
        }else{
          temp[index] = log;
        }
      }
      if (typeof log === 'bigint'){
        const maxSafeBigInt = BigInt(Number.MAX_SAFE_INTEGER);
        if (log >= maxSafeBigInt){
          temp[index] = 'Redacted Unsafe BigInt';
        }else{
          temp[index] = log;
        }
      }
      ogCryptoConsole(temp[index]);
    });
  }else{
    return;
  }
}
function setup(){
  // Define the destination directory for your files
  const destinationDirectory = path.join(homeDirectory, 'DBlockbuster', 'ElectronApp');
  const destinationPath = path.join(destinationDirectory, 'config.json');
  // Read and parse the config.json file
  const configContent = fs.readFileSync(destinationPath, 'utf-8');
  const configJSON = JSON.parse(configContent);
  console.log('Config file is:', configJSON);
  return configJSON;
}
var configjson = setup();
var eventsWebsocket;
var httpserver;
var p2pRunning = false;
const getmac = require('getmac');
const express = require("express");
const rateLimit = require('express-rate-limit');
const app = express();

// Define your rate limiter
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // limit each IP to 100 requests per windowMs
  skip: (req, res) => {
    // Skip rate limiting for localhost requests or customize as needed
    //return req.ip === '127.0.0.1';

  },
  keyGenerator: (req) => {
    // Use CF-Connecting-IP header as the key for rate limiting
    return req.headers['cf-connecting-ip'] || req.headers['x-forwarded-for'] || req.ip;
  },
});

// Apply the rate limiter to all requests
app.use(limiter);

const { Notification } = require('electron');
const http = require("node:http");
const helmet = require("helmet");
// Use Helmet! For added layer of security!
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      scriptSrc: ["'self'", "'unsafe-inline'"],
    }
  },
}));
const { tunnel } = require(path.join(path.dirname(process.execPath), '/cloudflared/tunnel.js'));
const isEqual = require('lodash/isEqual');
const jwt = require('jsonwebtoken');
//const config = JSON.parse(fs.readFileSync('./configs/config.json', 'utf-8'));
let config = { localProvide: true };
let retries = 0;
let retriesTunnel = 0;
/*
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
This is our main function responsible for starting everything in the proper ordering that we need so we can prepare based on different configuration setups aka our bootstrap process!
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
*/
function startStopP2P() {
  if (configjson.websocket){
    if (p2pRunning){
      if (eventsWebsocket){
        eventsWebsocket.close();
        httpserver.close();
        p2pRunning = false;
      }
    }else{
      retries=0;
      retriesTunnel=0;
      startP2PService();
    }
  }else{
    const test = new Notification();
    test.title = "Configuration Error";
    test.body = "You need to update your config.json file located at your Home Folder inside the DBlockbuster Folder and make sure the option websocket is set to true!";
    test.show();
  }
}

async function startP2PService (){
    const test = new Notification();
    test.title = "P2P Initiliazing";
    test.body = "Peer 2 peer communications is starting up. First cloudflare tunnel will startup then. Serve your local http server! To provide your movies and tv shows via dblockbusters gateway! By connecting to the gateway server through websocket and it will query your providable endpoint which displays all of your movies and tv shows without file paths! :)";
    test.show();
    p2pRunning = true;
    async function startTunnel(){
    //This will server over http as cloudflare tunnels will handle the upgrading properly!
    console.log('Starting tunnel!')
    const { url, connections, child, stop } = tunnel({ "--url": 'localhost:2097' });

    // Wait for all 4 connections to be established
    const conns = await Promise.all(connections);

    // Show the connections
    console.log("Connections Ready!", conns);

    //Show the url
    console.log("LINK:", await url);
    config.domain = (await url).toString().replace(new RegExp('https://', 'g'), '');
    console.log('Your domain is:', config.domain);
    console.log('homeDirectory', homeDirectory);
    try {
      fs.writeFile(path.join(homeDirectory, 'DBlockbuster', 'electrons-cloudflareTunnel.json'),
        JSON.stringify({ domain: config.domain, publicPort: 443, localPort: 2097 }),
        (err) => {
          if (err) {
            console.error('Error writing file:', err);
          } else {
            console.log('File written successfully!');
          }
        }
      );
    }catch(e){
      console.log(e);
    }

    child.on("exit", (code) => {
      console.log("tunnel process exited with code", code);
      if (retriesTunnel < 5){
        const test = new Notification();
        test.title = "CloudFlare Tunnel Crashed";
        test.body = "Dont worry! as you are reading this it is spinning up another connection for you! :)";
        test.show();
        console.log('Attempting to restart Tunnel!');
        httpserver.close();
        console.log('Stopped Http server connection!');
        eventsWebsocket.close();
        console.log('Stopped gateway websocket connectio!');
        retriesTunnel = retriesTunnel+1;
        startP2PService();
      }else{
        const test = new Notification();
        test.title = "CloudFlare Tunnel Crashed";
        test.body = "This is not spinning up another one after 5 failed attempts! Please manually start p2p service again in the tray icon menu! This is to ensure you dont get flagged from when the gateway server is down which causes you to get flagged by cloudflare for spinning up to many tunnels!";
        test.show();
        httpserver.close();
        console.log('Stopped Http server connection!');
        eventsWebsocket.close();
        console.log('Stopped gateway websocket connectio!');
        return;
      }
    });
    }

    await startTunnel();
    
    // Create an HTTP server after the cloudflare tunnel has started!
    const server = http.createServer(app);
    // Start the HTTP server
    server.listen(2097, function () {
      console.log("listening on ", 2097, "using regular HTTP NON SSL", "But we are serving through Cloudflare on port 443 through https!");
    });
    httpserver = server;
    startGateway();
}
////
////
////These our our variables releated to the websocket server
////
const safeSize = (10 ** 6 / 4) + 1044//
let gateway;//For our gateway websocket!
var heartbeatIntervalId;
//This will help us only send a heartbeat ping when a pong is received!
var pongReceived = true;
// Generate a key pair for the node
const nodeKeyPair = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///         This IS our Query API                                                                                                                               ///
///                 HTTP ENDPOINT RESPOPNSIBLE FOR Querying                                                                                                     ///
///                                                                                                                                                             ///
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
app.get("/providable", function(req, res) {
  const result = getDBr().prepare('SELECT Id,Type,Season,Episode,AmountOfFiles,Quality FROM Providable').all();

  res.send(JSON.stringify(result));
});

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///         This IS our Streaming API                                                                                                                           ///
///                 HTTP ENDPOINT RESPOPNSIBLE FOR STREAMING                                                                                                    ///
///                                                                                                                                                             ///
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//This is our streaming video api MWAHAHAHAHHAHAH! i hope its a success!
app.get("/video", function(req, res) {
  try {
    const range = s(req.headers.range);

    // Ensure there is a range given for the video
    if (range === undefined || range === null) {
      return res.status(400).json({
        error: 'Range header is missing.',
        errorCode: 400,
      });
    }

    if (!config.localProvide) {
      return res.status(400).json({
        error: 'Invalid configuration or missing broadcasterId.',
        errorCode: 400,
      });
    }

    const { tmdbId, type, quality, season, episode, fileIndex } = req.query;
    const id = s(ss(tmdbId));
    const videoType = s(ss(type)).toLowerCase();
    const videoQuality = String(s(quality)).toUpperCase();
    const index = fileIndex ? s(ss(fileIndex)) : 1;

    let path;

    switch (videoType) {
      case 'tv':
        if (season === undefined || episode === undefined) {
          return res.status(414).json({
            error: 'Please include a &season=&episode= query tag to your URL request!',
            errorCode: 414,
          });
        }

        const tvSeason = s(ss(season));
        const tvEpisode = s(ss(episode));

        if (checkProvidable(id, videoQuality, tvSeason, tvEpisode)) {
          const result = getDBr().prepare('SELECT filePath FROM TVShows WHERE Id=? AND Quality=? AND Season=? AND Episode=? AND FileIndex=?').get(id, videoQuality, tvSeason, tvEpisode, index);
          path = result.FilePath;
        } else {
          return res.status(404).json({
            error: 'No Providable File Found!',
            errorCode: 404,
          });
        }
        break;

      case 'movie':
        if (checkProvidable(id, videoQuality)){
          const result = getDBr().prepare('SELECT filePath FROM Movies WHERE Id=? AND Quality=? AND FileIndex=?').get(id, videoQuality, index);
          path = result.FilePath;
        } else {
          return res.status(404).json({
            error: 'No Providable File Found!',
            errorCode: 404,
          });
        }
        break;

      default:
        return res.status(400).json({
          error: 'Invalid type specified!',
          errorCode: 400,
        });
    }

    const videoPath = `${path}`;
    if (!videoPath) {
      return res.status(404).json({
        error: 'File path not found.',
        errorCode: 404,
      });
    }

    // Perform fs.statSync and fs.createReadStream only if not in the cache
    const videoSize = fs.statSync(videoPath).size;
    
    // Parse Range
    // Example: "bytes=32324-"
    const CHUNK_SIZE = 10 ** 7; // 10MB
    const start = Number(range.replace(/\D/g, ""));
    const end = Math.min(start + CHUNK_SIZE, videoSize - 1);
    // Create headers
    const contentLength = end - start + 1;
    const headers = {
      "Content-Range": `bytes ${start}-${end}/${videoSize}`,
      "Accept-Ranges": "bytes",
      "Content-Length": contentLength,
      "Content-Type": "video/mp4",
    };
    // HTTP Status 206 for Partial Content
    res.writeHead(206, headers);
    // Create video read stream for this particular chunk
    const videoStream = fs.createReadStream(videoPath, { start, end });
    // Stream the video chunk to the client
    videoStream.pipe(res);
  } catch (error) {
    console.error('Error in /video endpoint:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      errorCode: 500,
    });
  }
});


app.get("/videoplayer", function(req, res) {
  // Your HTML content
  const htmlContent = `
  <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Video Player</title>
</head>
<body>
  <video id="videoPlayer" width="100%" height="50%" controls>
    Your browser does not support the video tag.
  </video>

  <script>
          // Your JavaScript code
          // Get query parameters from the URL
          const urlParams = new URLSearchParams(window.location.search);
          const broadcasterId = urlParams.get('broadcasterId');
          const filetype = urlParams.get('filetype');
          console.log('Url Params are!!!', urlParams);
          console.log('Url Params are!', urlParams.toString());

          // Set the video source dynamically
          const videoPlayer = document.getElementById('videoPlayer');
          if ((broadcasterId !== null && broadcasterId !== undefined) && (filetype !== null && filetype !== undefined)) {
            console.log('Null or undefined:');
            const videoSrc = \`/video?\${urlParams.toString()}\`;
            videoPlayer.src = videoSrc;
          } else {
            const Id = urlParams.get('tmdbId');
            const type = urlParams.get('type');
            const quality = urlParams.get('quality');
            if ((Id !== (null&&undefined)) && (type !== (null&&undefined)) && (quality !== (null&&undefined))){
              switch (type.toLowerCase()){
                case 'tv':
                  const season = urlParams.get('season');
                  const episode = urlParams.get('episode');
                  if ((season !== (null&&undefined))&&(episode !== (null&&undefined))){
                    const videoSrc = \`/video?\${urlParams.toString()}\`;
                    videoPlayer.src = videoSrc;
                  }else{
                    alert('You need to provide the proper &season=#&episode=# query tags to your url request for this /videoplayer endpoint!');
                  }
                break;
                case 'movie':
                const videoSrc = \`/video?\${urlParams.toString()}\`;
                videoPlayer.src = videoSrc;
                break;
              }
            }else{
              alert("You need to provide the proper \\n ?tmdbId={#id}&type={movie or tv}&quality={hd or sd or cam} \\n Or this \\n ?broadcasterId={#}&filetype=mp4 the only supported one atm! \\n in your url request for this /videoplayer endpoint!");
            }
            console.log('No broadcaster ID and fileType');
          }
        </script>
</body>
</html>
`;

  // Set the content type to HTML
  res.setHeader('Content-Type', 'text/html');
  // Send the HTML content as the response
  res.send(htmlContent);
  //res.sendFile(path.join(process.cwd(), 'public', 'videoplayer.html'));
});

app.get('/', function(req, res) {
  res.sendStatus(200);
  return;
});
//BELOW IS ERROR HANDLING CODE
////////////////////////////////////////////////////////////////////////////////
async function cleanupAndExit(){
  //Perform any clean up code here on exit for proper handlings!
  try{
    
  }catch(e){
    console.log(e);
  }
  // Perform any other necessary cleanup tasks here...
  //process.exit(0);//This is the exit of the application!
}

process.on('uncaughtException', (err) => {
  console.error(`Uncaught Exception: ${err.message}`);
  console.error(err.stack);

  // Add any additional cleanup or handling logic here

  // Exit the process after logging
  //process.exit(1);
});

// Process unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error(`Unhandled Rejection: ${reason}`);
  
  // Add any additional cleanup or handling logic here

  // Optionally, terminate the process or handle the rejection
  // For example, you can terminate the process immediately:
  //process.exit(1);
});


process.on('exit', async (e) => {
  console.log('Received exit signal, initiating cleanup...', e);
  await cleanupAndExit();
});

process.on('SIGTERM', async (e) => {
  console.log('Received SIGTERM signal, initiating cleanup...', e);
  await cleanupAndExit();
});

process.on('SIGINT', async (e) => {
  console.log('Received SIGINT signal (Ctrl+C), initiating cleanup...', e);
  await cleanupAndExit();
});

//BELOW IS GATEWAY HANDLING CODE
////////////////////////////////////////////////////////////////////////////////
/**
 * Starts the heartbeat for the WebSocket connection.
 * specifically for the gateway to keep the connection alive and going as websockets dont tend to do this automatically!
 * but the server can still terminate connection at will at any moment as having a full keep alive setup wouldnt be a good idea!
 * @param {WebSocket} ws - The WebSocket connection.
 * @return {void} No return value.
 */
function startHeartbeat(ws) {
  const sendPing = () => {
    if (ws.readyState === ws.OPEN) {
      if (pongReceived) {
        console.log('Pong response received, Sending new ping!');
        ws.send(JSON.stringify({ connectionType: 'node', messageType: 'ping' }));
        pongReceived = false; // Reset pongReceived flag
      } else {
        console.log('Previous ping response not received, skipping current ping');
        // Handle scenario where previous ping response was not received before the next ping
      }
    }
  };
  // Start the heartbeat
  heartbeatIntervalId = setInterval(sendPing, 30000);
}

function stopHeartbeat() {
  clearInterval(heartbeatIntervalId);
  heartbeatIntervalId = null;
}

async function signChallengeResponse(challenge) {
  try {
    await calculateCombinedHash();
    const answer = await calculateCombinedHashScrambled(challenge.c, challenge.c2);
    const checksum = await calculateCombinedHash();
    const key2 = {
      scrambled: answer,
      checksum: checksum
    }
    const signedResponse = jwt.sign(
      {
        publicKey: nodeKeyPair.publicKey,
        challenge: key2
      },
      nodeKeyPair.privateKey,
      { algorithm: 'RS256' }
    );

    const decoded = jwt.verify(signedResponse, nodeKeyPair.publicKey, { algorithm: 'RS256' });
    if (isEqual(decoded.challenge.checksum, key2.checksum)) {
      if (isEqual(answer, decoded.challenge.scrambled)){
        console.log('Scramble is verified!!!!!!! Wahooo');
      }
      console.log('DECODED VERIFIED!');
    }

    return signedResponse;
  } catch (error) {
    console.error('Error during signing/verification:', error);
    //throw error; // Rethrow the error to handle it at the higher level
  }
}
//Websocket for gateway
async function startGateway(){
  const test = new Notification();
  test.title = "Gateway websocket started!";
  test.body = "By connecting to the gateway server through websocket and it will query your providable endpoint which displays all of your movies and tv shows without file paths! and generate a db from all of our peers on the gateway side :)";
  test.show();
  let mac;
  try {
    const macAddress = getmac.default();
    mac = macAddress;
    console.log('MAC Address:', macAddress);
  } catch (error) {
    //No mac address then not allowed to provide as this is required to generate there UUID!
    //process.exit(0);
    console.error('Error:', error.message);
    return;
  }

  try {
    const wsGateway = new WebSocket('wss://gatewaytunnel.dblockbuster.com');
    eventsWebsocket = wsGateway;
    wsGateway.on('open', () => {
      startHeartbeat(wsGateway);
      // Perform Handshake
      const handshakeData = {
        connectionType: 'electron-node',
        messageType: 'handshake',
        publicKey: nodeKeyPair.publicKey,
      };

      wsGateway.send(JSON.stringify(handshakeData));
    });

    wsGateway.on('message', async (event) => {
      try {

        const data = JSON.parse(event);
        if (data.connectionType === 'gateway')
        if (data.messageType === 'pong') {
          console.log('Pong received!');
          pongReceived = true;
        }

        if (data.messageType === 'challenge'){
            const response = await signChallengeResponse(data.challenge);
            // Send the signed response to the gateway
            wsGateway.send(JSON.stringify({connectionType: 'electron-node', messageType: 'response', signedResponse: response }));
        }

        if (data.messageType === 'handshake_ack'){
          const key = await calculateCombinedHash();
          var message;
            message = {
              connectionType: 'electron-node',
              messageType: 'Initialize',
              domain: config.domain,
              port: 443,
              key: key
            }
          wsGateway.send(JSON.stringify(message));
          console.log('WebSocket Gateway connection established');
          startHeartbeat(wsGateway);
        }
        console.log(data);
      }catch(error){
        console.log(error);
      }
    });

    wsGateway.on('close', (event) =>{
      console.log('WebSocket Gateway connection closed');
      stopHeartbeat();
      if (retries < 5){
      retries = retries+1;
      console.log('Attempting to restart gateway connection!');
      //startGateway();// uncomment this line for production release! but include a retry counter to stop potential flood of retrys!
      }else{
        console.log('Max retries reached on gateway attempts!');
        return;
      }
    });
  }catch(e){
    console.log(e);
  }
}

module.exports = { startStopP2P, s, startP2PService }