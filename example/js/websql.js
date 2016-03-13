export default function websqlPromisify(db) {
  this.db = db;
}

function fakeTransaction() {
  return {
    executeSql: (query, args) => {
      console.log(this, query, args);
      this.tx.executeSql(query, args,
        (tx, result) => { this.results.push(result); });
    }
  }
}




websqlPromisify.prototype.transaction = function(transaction) {
  return new Promise((resolve, reject) => {
    this.results = [];
    this.db.transaction((tx) => {
      this.tx = tx;
      transaction(fakeTransaction.call(this));
    },
    (error) => { reject(error); },
    (result) => { resolve(this.results); });
  });
};
