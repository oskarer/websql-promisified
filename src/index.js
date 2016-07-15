function fakeTransaction(results) {
  return {
    executeSql: (query, args, callback) => {
      this.tx.executeSql(query, args, (tx, result) => {
        results.push(result);
        if (typeof callback === 'function') {
          // Pass itself to support chaining
          callback(fakeTransaction.call(this, results), result);
        }
      });
    },
  };
}

const prototype = {
  transaction(transaction) {
    if (typeof transaction !== 'function') {
      return new Promise((resolve, reject) => {
        reject('Must pass function into transaction');
      });
    }

    return new Promise((resolve, reject) => {
      const results = [];
      this.db.transaction((tx) => {
        this.tx = tx;
        transaction(fakeTransaction.call(this, results));
      },
      (error) => { reject(error); },
      () => { resolve(results); });
    });
  },
};

export default (db) => Object.create(prototype, { db: { value: db } });
