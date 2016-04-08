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

      it('should resolve its promise with result when query is valid',
      asyncTest(async (done) => {
        const db = openDatabase('mydb', '1.0', 'Test DB', 2 * 1024 * 1024);
        const websqlPromise = websql(db);

        // Set up table
        await new Promise((resolve, reject) => {
          db.transaction((tx) => {
            tx.executeSql('DROP TABLE IF EXISTS logs');
            tx.executeSql('CREATE TABLE IF NOT EXISTS logs (log)');
            tx.executeSql('INSERT INTO logs (log) VALUES (?)', ['hello']);
          }, reject, resolve);
        });

        await websqlPromise.transaction(async (tx) => {
          const result = await tx.executeSql('SELECT * FROM logs');
          expect(result.rows.length).toBe(1);
          expect(result.rows.item(0).log).toEqual('hello');
          done();
        });
      }));

      it('should be possible to await several calls',
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

        const result = await websqlPromise.transaction(async (tx) => {
          await tx.executeSql('INSERT INTO logs (log) VALUES (?)', ['a']);
          await tx.executeSql('INSERT INTO logs (log) VALUES (?)', ['b']);
          await tx.executeSql('SELECT * FROM logs');
        });

        expect(result[2].rows.item(0)).toEqual({ log: 'a' });
        expect(result[2].rows.item(1)).toEqual({ log: 'b' });
        done();
      }));
    });
  });
});
