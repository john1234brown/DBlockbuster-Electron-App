const path = require('path');
const Database = require(path.join(path.dirname(process.execPath), 'resources', 'app.asar', 'node_modules', 'better-sqlite3'));
const os = require('os');
const fs = require('fs');
// Your bundled application directory
const appDirectory = path.join(path.dirname(process.execPath));

// Function to copy files to a destination directory
function copyFile(source, destination) {
    fs.copyFileSync(source, destination);
}
// Function to set up the required files
function setupFiles() {
  // Get the user's home directory
  const homeDirectory = os.homedir();

  // Define the destination directory for your files
  const destinationDirectory = path.join(homeDirectory, 'DBlockbuster', 'ElectronApp');

  // Ensure the destination directory exists
  if (!fs.existsSync(destinationDirectory)) {
      fs.mkdirSync(destinationDirectory, {recursive: true});
  }

  // Define paths for config.json and database.sqlite3 in the source and destination
  const sourceConfigPath = path.join(appDirectory, 'config.json');
  const destinationConfigPath = path.join(destinationDirectory, 'config.json');
  const sourceEulaPath = path.join(appDirectory, 'eula.json');
  const destinationEulaPath = path.join(destinationDirectory, 'eula.json');
  const sourceDBPath = path.join(appDirectory, 'database.sqlite3');
  const destinationDBPath = path.join(destinationDirectory, 'database.sqlite3');

  // Check if config.json already exists in the destination directory
  if (!fs.existsSync(destinationEulaPath)) {
    // Copy config.json to the destination directory
    copyFile(sourceEulaPath, destinationEulaPath);
    console.log('eula.json copied successfully!');
} else {
    console.log('eula.json already exists in the destination directory.');
}

  // Check if config.json already exists in the destination directory
  if (!fs.existsSync(destinationConfigPath)) {
      // Copy config.json to the destination directory
      copyFile(sourceConfigPath, destinationConfigPath);
      console.log('config.json copied successfully!');
  } else {
      console.log('config.json already exists in the destination directory.');
  }

  // Check if database.sqlite3 already exists in the destination directory
  if (!fs.existsSync(destinationDBPath)) {
      // Copy SQLite database files to the destination directory
      copyFile(sourceDBPath, destinationDBPath);
      console.log('database.sqlite3 copied successfully!');
  } else {
      console.log('database.sqlite3 already exists in the destination directory.');
  }

  // Read and parse the config.json file
  const configContent = fs.readFileSync(destinationConfigPath, 'utf-8');
  configJSON = JSON.parse(configContent);
  console.log('Files and globalVariable set up successfully!');
}
setupFiles();
// Get the user's home directory
const homeDirectory = os.homedir();
// Define the destination directory for your files
const destinationDirectory = path.join(homeDirectory, 'DBlockbuster', 'ElectronApp');
const destinationDBPath = path.join(destinationDirectory, 'database.sqlite3');
const DB = new Database(destinationDBPath);
const DBr = new Database(destinationDBPath, { readonly: true });

function getDB(){
  return new Database(destinationDBPath);
}

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

async function updateMovieFileIndex(i, filePath, id) {
  const fresult = DB.prepare('UPDATE "Movies" SET "FileIndex"=? WHERE FilePath=? AND Id=?').run(i, filePath, id);
  console.log(fresult);
}

async function updateTVShowFileIndex(i, filePath, id) {
  const fresult = DB.prepare('UPDATE "TVShows" SET "FileIndex"=? WHERE FilePath=? AND Id=?').run(i, filePath, id);
  console.log(fresult);
}

module.exports = { DB, DBr, getDB, getDBr, checkProvidable, getProvidableFileAmounts, updateMovieFileIndex, updateTVShowFileIndex };