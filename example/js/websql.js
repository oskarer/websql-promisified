export default (db) => Object.create(prototype, { db: { value: db } })

const prototype = {
  transaction: function(transaction) {
    this.results = [];
    return new Promise((resolve, reject) => {
      this.db.transaction((tx) => {
        this.tx = tx;
        transaction(fakeTransaction.call(this));
      },
      (error) => { reject(error); },
      (result) => { resolve(this.results); });
    });
  }

}

function fakeTransaction() {
  return {
    executeSql: (query, args) => {
      this.tx.executeSql(query, args,
        (tx, result) => { this.results.push(result); });
    }
  }
}
