import websql from './websql';

let db = openDatabase('mydb', '1.0', 'Test DB', 2 * 1024 * 1024);
const time = new Date().toISOString();


(async function () {
  try {
    const websqlPromise = websql(db);

    const results = await websqlPromise.transaction(async (tx) => {
      tx.executeSql('DROP TABLE IF EXISTS logs')
      tx.executeSql('CREATE TABLE IF NOT EXISTS logs (log)')

      const insert =
        await tx.executeSql('INSERT INTO logs (log) VALUES (?)', [time])
      console.log('Inserted at', insert.insertId)

      const select = await tx.executeSql('SELECT * FROM logs')
      console.log('Selected', select.rows.item(0))
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
