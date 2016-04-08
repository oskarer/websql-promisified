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
  it('should', asyncTest(async (done) => {
    const db = openDatabase('mydb', '1.0', 'Test DB', 2 * 1024 * 1024);
    const websqlPromise = websql(db);
    const time = new Date().toISOString();
    const results = await websqlPromise.transaction((tx) => {
      tx.executeSql('DROP TABLE IF EXISTS logs');
      tx.executeSql('CREATE TABLE IF NOT EXISTS logs (log)');
      tx.executeSql('INSERT INTO logs (log) VALUES (?)', [time]);
      tx.executeSql('SELECT * FROM logs');
    });
    done();
  }));

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
  });
});
