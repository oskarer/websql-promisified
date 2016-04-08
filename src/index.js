function fakeTransaction() {
  return {
    executeSql: (query, args) =>
    new Promise((resolve) => {
      this.tx.executeSql(query, args,
        (tx, result) => {
          this.results.push(result);
          resolve(result);
        });
    }),
  };
}

const prototype = {
  transaction(transaction) {
    if (typeof transaction !== 'function') {
      return new Promise((resolve, reject) => {
        reject('Must pass function into transaction');
      });
    }

    this.results = [];
    return new Promise((resolve, reject) => {
      this.db.transaction((tx) => {
        this.tx = tx;
        transaction(fakeTransaction.call(this));
      },
      (error) => { reject(error); },
      () => { resolve(this.results); });
    });
  },
};

export default (db) => Object.create(prototype, { db: { value: db } });
