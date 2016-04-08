# websql-promisified

[![Build Status](https://travis-ci.org/oskarer/skype-js.svg?branch=master)](https://travis-ci.org/oskarer/skype-js)
[![npm version](https://badge.fury.io/js/websql-promisified.svg)](https://badge.fury.io/js/websql-promisified)

Use Web SQL and
[Cordova SQLite](https://github.com/litehelpers/Cordova-sqlite-storage) with
ES6 promises.

## Installation
```bash
npm install --save websql-promisified
```

## Usage
### With then/catch

```javascript
import websql from 'websql-promisified';

const db = openDatabase('mydb', '1.0', 'Test DB', 2 * 1024 * 1024);
const websqlPromise = websql(db);

websqlPromise.transaction((tx) => {
  tx.executeSql('INSERT INTO someTable (someColumn) VALUES (?)', ['a']);
  tx.executeSql('SELECT * FROM someTable').then((result) => {
    // Do something, another tx.executeSql if you like
  })
}).then((results) => {
  // Do something with results array
}).catch((error) => {
  // Something went wrong, see error.message
})
```

### With async/await

```javascript
import websql from 'websql-promisified';

const db = openDatabase('mydb', '1.0', 'Test DB', 2 * 1024 * 1024);
const websqlPromise = websql(db);

try {
  const results = await websqlPromise.transaction(await (tx) => {
    await tx.executeSql('INSERT INTO someTable (someColumn) VALUES (?)', ['a']);
    const subResult = await tx.executeSql('SELECT * FROM someTable');
    // Do something, another tx.executeSql if you like
  })
  // Do something with results array
} catch (error) {
  // Something went wrong, see error.message
}
```

## Found a bug?
Open an issue with a detailed description. Pull requests are most welcome!
