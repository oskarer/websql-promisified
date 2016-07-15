# websql-promisified

[![Build Status](https://travis-ci.org/oskarer/websql-promisified.svg?branch=master)](https://travis-ci.org/oskarer/websql-promisified)
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
  tx.executeSql('SELECT * FROM someTable');
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
  const results = await websqlPromise.transaction((tx) => {
    tx.executeSql('INSERT INTO someTable (someColumn) VALUES (?)', ['a']);
    tx.executeSql('SELECT * FROM someTable');
  })
  // Do something with results array
} catch (error) {
  // Something went wrong, see error.message
}
```

### Query chaining
You can also chain your queries as you would normally do in Web SQL. Pass a
function as the third argument into your `executeSql()` call. It should accept a
transaction object as the first argument and the result as the second. In the
callback you can execute new queries that depend on the result from previous
query.

The results array returned from `transaction()` is filled in the same order
your queries execute.

```javascript
import websql from 'websql-promisified';

const db = openDatabase('mydb', '1.0', 'Test DB', 2 * 1024 * 1024);
const websqlPromise = websql(db);

try {
  const results = await websqlPromise.transaction((tx) => {
    tx.executeSql('INSERT INTO someTable (someColumn) VALUES (?)', ['a']);
    tx.executeSql('SELECT * FROM someTable', [], (tx, result) => {
      const value = result.rows.item(0).someColumn;
      tx.executeSql('INSERT INTO someTable (someColumn) VALUES (?)', [value + value]);
    });
    tx.executeSql('SELECT * FROM someTable');
  })
  
  console.log(results[1].rows.item(0).someColumn) // a
  console.log(results[3].rows.item(0).someColumn) // aa

} catch (error) {
  // Something went wrong, see error.message
}
```

## Found a bug?
Open an issue with a detailed description. Pull requests are most welcome!
