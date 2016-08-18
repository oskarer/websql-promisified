/* global JasminePromiseMatchers */
import log from 'loglevel';
import websql from '../src';
import asyncTest from './helpers/asyncTest';

log.setLevel('trace');

describe('index', () => {
  it('should return object with db property set', () => {
    const db = openDatabase('mydb', '1.0', 'Test DB', 2 * 1024 * 1024);
    const websqlPromise = websql(db);
    expect(websqlPromise.db).toBe(db);
  });

  it('should return object with transaction function', () => {
    const db = openDatabase('mydb', '1.0', 'Test DB', 2 * 1024 * 1024);
    const websqlPromise = websql(db);
    expect(typeof websqlPromise.transaction).toBe('function');
  });

  describe('transaction', () => {
    it('should reject when no function passed',
    asyncTest(async (done) => {
      const db = openDatabase('mydb', '1.0', 'Test DB', 2 * 1024 * 1024);
      const websqlPromise = websql(db);
      try {
        await websqlPromise.transaction();
        done.fail();
      } catch (error) {
        done();
      }
    }));

    it('should resolve empty array when no executeSql executions',
    asyncTest(async (done) => {
      const db = openDatabase('mydb', '1.0', 'Test DB', 2 * 1024 * 1024);
      const websqlPromise = websql(db);
      const results = await websqlPromise.transaction(() => {});
      expect(results).toEqual([]);
      done();
    }));

    it('should execute given function passing object with executeSql function',
    asyncTest(async (done) => {
      const db = openDatabase('mydb', '1.0', 'Test DB', 2 * 1024 * 1024);
      const websqlPromise = websql(db);
      await websqlPromise.transaction((tx) => {
        expect(typeof tx.executeSql).toBe('function');
        done();
      });
    }));

    it('should resolve array of results from queries',
    asyncTest(async (done) => {
      const db = openDatabase('mydb', '1.0', 'Test DB', 2 * 1024 * 1024);
      const websqlPromise = websql(db);

      // Set up table
      await new Promise((resolve, reject) => {
        db.transaction((tx) => {
          tx.executeSql('DROP TABLE IF EXISTS logs');
          tx.executeSql('CREATE TABLE IF NOT EXISTS logs (log)');
        }, reject, resolve);
      });

      const result = await websqlPromise.transaction((tx) => {
        tx.executeSql('INSERT INTO logs (log) VALUES (?)', ['hello1']);
        tx.executeSql('INSERT INTO logs (log) VALUES (?)', ['hello2']);
        tx.executeSql('SELECT * FROM logs');
      });
      expect(result.length).toBe(3);
      expect(result[2].rows.item(0)).toEqual({ log: 'hello1' });
      expect(result[2].rows.item(1)).toEqual({ log: 'hello2' });
      done();
    }));

    it('should be able to execute parallel transactions',
    asyncTest(async (done) => {
      const db = openDatabase('mydb', '1.0', 'Test DB', 2 * 1024 * 1024);
      const websqlPromise = websql(db);

      // Fill database
      await new Promise((resolve, reject) => {
        db.transaction((tx) => {
          tx.executeSql('DROP TABLE IF EXISTS logs');
          tx.executeSql('CREATE TABLE IF NOT EXISTS logs (log)');
          tx.executeSql('INSERT INTO logs (log) VALUES (?)', ['hello1']);
          tx.executeSql('INSERT INTO logs (log) VALUES (?)', ['hello2']);
        }, reject, resolve);
      });

      websqlPromise.transaction((tx) => {
        tx.executeSql('SELECT * FROM logs LIMIT 1');
      })
      .then((results) => {
        expect(results.length).toBe(1);
        expect(results[0].rows.length).toBe(1);
        expect(results[0].rows.item(0)).toEqual({ log: 'hello1' });
      });
      websqlPromise.transaction((tx) => {
        tx.executeSql('SELECT * FROM logs LIMIT 2');
      })
      .then((results) => {
        expect(results.length).toBe(1);
        expect(results[0].rows.length).toBe(2);
        expect(results[0].rows.item(0)).toEqual({ log: 'hello1' });
        expect(results[0].rows.item(1)).toEqual({ log: 'hello2' });
      });
      setTimeout(done, 100); // Ugly, but gets the job done
    }));

    describe('tx.executeSql', () => {
      it('should make transaction reject when called with no query',
      asyncTest(async (done) => {
        const db = openDatabase('mydb', '1.0', 'Test DB', 2 * 1024 * 1024);
        const websqlPromise = websql(db);
        try {
          await websqlPromise.transaction((tx) => {
            tx.executeSql();
          });
          done.fail();
        } catch (error) {
          done();
        }
      }));

      it('should make transaction fail when given invalid query',
      asyncTest(async (done) => {
        const db = openDatabase('mydb', '1.0', 'Test DB', 2 * 1024 * 1024);
        const websqlPromise = websql(db);
        try {
          await websqlPromise.transaction((tx) => {
            tx.executeSql('ASDF');
          });
          done.fail();
        } catch (error) {
          done();
        }
      }));

      describe('callback', () => {
        beforeEach(asyncTest(async (done) => {
          const db = openDatabase('mydb', '1.0', 'Test DB', 2 * 1024 * 1024);
          // Fill database
          await new Promise((resolve, reject) => {
            db.transaction((tx) => {
              tx.executeSql('DROP TABLE IF EXISTS logs');
              tx.executeSql('CREATE TABLE IF NOT EXISTS logs (log)');
              tx.executeSql('INSERT INTO logs (log) VALUES (?)', ['hello1']);
              tx.executeSql('INSERT INTO logs (log) VALUES (?)', ['hello2']);
              tx.executeSql('INSERT INTO logs (log) VALUES (?)', ['hello3']);
            }, reject, resolve);
          });
          done();
        }));

        it('should be called with tx that has correct executeSql',
        asyncTest(async (done) => {
          const db = openDatabase('mydb', '1.0', 'Test DB', 2 * 1024 * 1024);
          const websqlPromise = websql(db);

          await websqlPromise.transaction((tx) => {
            tx.executeSql('SELECT * from logs WHERE log = "hello1"', [],
              (chainTx) => {
                // Not the _same_ function since fakeTransaction returns new
                // instance, but the implementation should be the same.
                // Not perfect solution but it' is something.
                expect(chainTx.executeSql.toString())
                  .toEqual(tx.executeSql.toString());
                done();
              });
          });
        }));

        it('should be called with correct result',
        asyncTest(async (done) => {
          const db = openDatabase('mydb', '1.0', 'Test DB', 2 * 1024 * 1024);
          const websqlPromise = websql(db);

          await websqlPromise.transaction((tx) => {
            tx.executeSql('SELECT * from logs WHERE log = "hello1"', [],
              (tx, result) => {
                expect(result.rows.item(0).log).toEqual('hello1');
                done();
              });
          });
        }));

        it('should support nested callbacks with results in correct order',
        asyncTest(async (done) => {
          const db = openDatabase('mydb', '1.0', 'Test DB', 2 * 1024 * 1024);
          const websqlPromise = websql(db);

          const result = await websqlPromise.transaction((tx) => {
            tx.executeSql('SELECT * from logs WHERE log = "hello1"', [],
            (tx) => {
              tx.executeSql('SELECT * from logs WHERE log = "hello2"', [],
              (tx) => {
                tx.executeSql('SELECT * from logs WHERE log = "hello3"');
              });
            });
          });

          expect(result[0].rows.item(0).log).toEqual('hello1');
          expect(result[0].rows.length).toBe(1);
          expect(result[1].rows.item(0).log).toEqual('hello2');
          expect(result[1].rows.length).toBe(1);
          expect(result[2].rows.item(0).log).toEqual('hello3');
          expect(result[2].rows.length).toBe(1);
          done();
        }));
      });

      describe('errorCallback', () => {
        beforeEach(asyncTest(async (done) => {
          const db = openDatabase('mydb', '1.0', 'Test DB', 2 * 1024 * 1024);
          // Fill database
          await new Promise((resolve, reject) => {
            db.transaction((tx) => {
              tx.executeSql('DROP TABLE IF EXISTS logs');
              tx.executeSql('CREATE TABLE IF NOT EXISTS logs (log)');
              tx.executeSql('INSERT INTO logs (log) VALUES (?)', ['hello1']);
              tx.executeSql('INSERT INTO logs (log) VALUES (?)', ['hello2']);
              tx.executeSql('INSERT INTO logs (log) VALUES (?)', ['hello3']);
            }, reject, resolve);
          });
          done();
        }));
        it('should be called with tx that has correct executeSql',
        asyncTest(async (done) => {
          const db = openDatabase('mydb', '1.0', 'Test DB', 2 * 1024 * 1024);
          const websqlPromise = websql(db);

          await websqlPromise.transaction((tx) => {
            tx.executeSql('SELECT * from nonExistingTable',
              [], () => {},
              (chainTx) => {
                expect(chainTx.executeSql.toString())
                  .toEqual(tx.executeSql.toString());
                done();
              });
          });
        }));

        it('should be called with correct error',
        asyncTest(async (done) => {
          const db = openDatabase('mydb', '1.0', 'Test DB', 2 * 1024 * 1024);
          const websqlPromise = websql(db);

          await websqlPromise.transaction((tx) => {
            tx.executeSql('SELECT * from nonExistingTable', [],
              () => {},
              (tx, error) => {
                expect(error.message)
                  .toEqual('could not prepare statement (1 no such table: ' +
                  'nonExistingTable)');
                done();
              });
          });
        }));

        it('should support nested callbacks with results in correct order',
        asyncTest(async (done) => {
          const db = openDatabase('mydb', '1.0', 'Test DB', 2 * 1024 * 1024);
          const websqlPromise = websql(db);

          const result = await websqlPromise.transaction((tx) => {
            tx.executeSql('SELECT * from nonExistingTable', [],
            () => {},
            (tx) => {
              tx.executeSql('SELECT * from logs WHERE log = "hello2"', [],
              (tx) => {
                tx.executeSql('SELECT * from logs WHERE log = "hello3"');
              });
            });
          });

          expect(result[0].message)
            .toEqual('could not prepare statement (1 no such table: ' +
            'nonExistingTable)');
          expect(result[1].rows.item(0).log).toEqual('hello2');
          expect(result[1].rows.length).toBe(1);
          expect(result[2].rows.item(0).log).toEqual('hello3');
          expect(result[2].rows.length).toBe(1);
          done();
        }));
      });

      it('should continue execution when errorCallback return false',
      asyncTest(async (done) => {
        const db = openDatabase('mydb', '1.0', 'Test DB', 2 * 1024 * 1024);
        const websqlPromise = websql(db);

        const result = await websqlPromise.transaction((tx) => {
        tx.executeSql('SELECT * from nonExistingTable', [],
          () => {},
          (tx) => {
            return false;
          });
          tx.executeSql('SELECT * from logs WHERE log = "hello2"', [],
          (tx) => {
          tx.executeSql('SELECT * from logs WHERE log = "hello3"');
          });
        });

        expect(result[0].message)
          .toEqual('could not prepare statement (1 no such table: ' +
          'nonExistingTable)');
        expect(result[1].rows.item(0).log).toEqual('hello2');
        expect(result[1].rows.length).toBe(1);
        expect(result[2].rows.item(0).log).toEqual('hello3');
        expect(result[2].rows.length).toBe(1);
        done();
      }));

      it('should reject transaction when errorCallback return true',
      asyncTest(async (done) => {
        const db = openDatabase('mydb', '1.0', 'Test DB', 2 * 1024 * 1024);
        const websqlPromise = websql(db);

        try {
          const result = await websqlPromise.transaction((tx) => {
            tx.executeSql('SELECT * from nonExistingTable', [],
            () => {},
            (tx) => {
              return true;
            });
          });
          done.fail();
        } catch (e) {
          done();
        }
      }));
    });
  });
});
