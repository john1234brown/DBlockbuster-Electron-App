const fs = require('node:fs');
const http = require('node:http');
const crypto = require('node:crypto');
const os = require('node:os');
const path = require('node:path');
const WebSocket = require(path.join(path.dirname(process.execPath), 'resources', 'app.asar', 'node_modules', 'ws'));
const { s, ss, containsAnySubstring, deepReplaceEscapeSequences } = require('./sanitizers.js');

// Get the user's home directory
const homeDirectory = os.homedir();
console.log('Home Directory:', homeDirectory);
// Define the destination directory for your files
/*const tmpFolderConfigPath = path.join(homeDirectory, 'DBlockbuster', 'VideoRelay', 'tmp');
//Define the videoRelay's Server Folder Under DBlockbuster Application Folder!
const dBlockbusterFolderPath = path.join(homeDirectory, 'DBlockbuster', 'VideoRelay');
const sizeLimitInBytes = 10 * 1024 * 1024 * 1024; // 10 GB in bytes

function check() {
  // Check if DBlockbuster folder exists
  if (!fs.existsSync(dBlockbusterFolderPath)) {
    // DBlockbuster folder doesn't exist, create it
    fs.mkdirSync(dBlockbusterFolderPath, { recursive: true });
  }

  // Check if tmp folder exists
  if (!fs.existsSync(tmpFolderConfigPath)) {
    // tmp folder doesn't exist, create it
    fs.mkdirSync(tmpFolderConfigPath, { recursive: true });
  }
  //console.log('Folders checked and created if necessary.');
}

// Call the check function
check();
// Helper function to generate a random ID
function generateId() {
  return Math.random().toString(36).substr(2, 9);
}

async function cleanupAndExit(){
  try {
    const files = await fs.promises.readdir(tmpFolderConfigPath);
    for (const file of files) {
      const filePath = path.join(tmpFolderConfigPath, file);
      await fs.promises.unlink(filePath);
    }
    console.log('Successfully deleted all files in the tmp folder.');
  } catch (error) {
    console.error('Error deleting tmp files:', error);
  }
  // Perform any other necessary cleanup tasks here...

  process.exit(0);
}*/

function generateMD5Checksum(data) {
  const utf8Encoder = new TextEncoder();
  const encodedData = utf8Encoder.encode(data);

  return new Promise((resolve, reject) => {
    crypto.subtle.digest('sha-256', encodedData).then(hashBuffer => {
      const hexHash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
      resolve(hexHash.slice(0, 16)); // Truncate to 16 characters
    }).catch(error => {
      reject(error);
    });
  });
}

function sendEventsToAllProviders(json, ws){
  ws.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN && client.connectionType === 'Provider') {
      client.send(JSON.stringify(json));
    }
  });
}

function fetchPublicIPv4() {
  return new Promise((resolve, reject) => {
    const options = {
      host: 'api.ipify.org',
      port: 80,
      path: '/',
    };

    const req = http.get(options, (resp) => {
      let data = '';

      resp.on('data', (chunk) => {
        data += chunk;
      });

      resp.on('end', () => {
        resolve(data);
      });
    });

    req.on('error', (err) => {
      reject(err);
    });
  });
}

function fetchPublicIPv6() {
  return new Promise((resolve, reject) => {
    const options = {
      host: 'api64.ipify.org',
      port: 80,
      path: '/',
    };

    const req = http.get(options, (resp) => {
      let data = '';

      resp.on('data', (chunk) => {
        data += chunk;
      });

      resp.on('end', () => {
        resolve(data);
      });
    });

    req.on('error', (err) => {
      reject(err);
    });
  });
}


return module.exports = { crypto, sendEventsToAllProviders, s, deepReplaceEscapeSequences, containsAnySubstring, ss, generateMD5Checksum, fs, WebSocket, path, fetchPublicIPv4, fetchPublicIPv6, homeDirectory};