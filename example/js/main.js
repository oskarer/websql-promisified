import websql from './websql';

let db = openDatabase('mydb', '1.0', 'Test DB', 2 * 1024 * 1024);
const time = new Date().toISOString();


(async function () {
  try {
    const queries = [
      { query: 'DROP TABLE IF EXISTS logs' },
      { query: 'CREATE TABLE IF NOT EXISTS logs (log)'},
      { query: 'INSERT INTO logs (log) VALUES (?)', args: [time] },
      { query: 'SELECT * FROM logs'},
    ];

    const websqlPromise = websql(db);

    const results = await websqlPromise.transaction((tx) => {
      tx.executeSql('DROP TABLE IF EXISTS logs')
      tx.executeSql('CREATE TABLE IF NOT EXISTS logs (log)')
      tx.executeSql('INSERT INTO logs (log) VALUES (?)', [time])
    })

    const results2 = await websqlPromise.transaction((tx) => {
      tx.executeSql('INSERT INTO logs (log) VALUES (?)', [time])
    })

    console.log(results)
    console.log(results2)
  } catch (error) {
    console.log(error.message);
  }
})();
