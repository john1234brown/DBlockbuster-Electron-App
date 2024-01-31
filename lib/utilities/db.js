const path = require('node:path');
const Database = require(path.join(path.dirname(process.execPath), 'resources', 'app.asar', 'node_modules', 'better-sqlite3'));
const os = require('node:os');
// Get the user's home directory
const homeDirectory = os.homedir();
// Define the destination directory for your files
const destinationDirectory = path.join(homeDirectory, 'DBlockbuster', 'ElectronApp');
const destinationDBPath = path.join(destinationDirectory, 'database.sqlite3');
const DBr = new Database(destinationDBPath, { readonly: true });

function getDBr(){
  return new Database(destinationDBPath, { readonly: true });
}

function checkProvidable(Id, quality, season, episode){
  if (season && episode){//Add a check to ensure to check for tv types 
    return !!DBr.prepare('SELECT * FROM "Providable" WHERE Id=? AND Season=? AND Episode=? AND Quality=?').get(Id, season, episode, quality);// Returns true if result is truthy (row found), false otherwise
  }else{//If season and episode are undefined or null then its movie just go off id!
  return !!DBr.prepare('SELECT * FROM "Providable" WHERE Id=? AND Quality=?').get(Id, quality);// Returns true if result is truthy (row found), false otherwise
  }
}

function getProvidableFileAmounts(Id){
  return DBr.prepare('SELECT AmountOfFiles FROM "Providables" WHERE Id=?').get(Id);
}

module.exports = { DBr, getDBr, checkProvidable, getProvidableFileAmounts };