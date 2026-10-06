'use strict';
// Minimal better-sqlite3 compatible API on top of node:sqlite (Node >= 22.13).
// Only the surface used by @rckflr/easydb's SQLite adapter is implemented.
const { DatabaseSync } = require('node:sqlite');

const toParam = (v) => {
  if (v === undefined) return null;
  if (typeof v === 'boolean') return v ? 1 : 0;
  if (v instanceof Date) return v.toISOString();
  if (v !== null && typeof v === 'object' && !ArrayBuffer.isView(v)) return JSON.stringify(v);
  return v;
};

class Statement {
  constructor(stmt) {
    this._stmt = stmt;
  }
  run(...params) {
    const info = this._stmt.run(...params.map(toParam));
    return { changes: Number(info.changes), lastInsertRowid: info.lastInsertRowid };
  }
  get(...params) {
    const row = this._stmt.get(...params.map(toParam));
    return row ? { ...row } : undefined;
  }
  all(...params) {
    return this._stmt.all(...params.map(toParam)).map((r) => ({ ...r }));
  }
}

let spId = 0;

class Database {
  constructor(filename = ':memory:') {
    this._db = new DatabaseSync(filename);
    this.open = true;
  }
  prepare(sql) {
    return new Statement(this._db.prepare(sql));
  }
  exec(sql) {
    this._db.exec(sql);
    return this;
  }
  pragma(str) {
    this._db.exec(`PRAGMA ${str}`);
  }
  transaction(fn) {
    const db = this._db;
    return (...args) => {
      const sp = `shim_txn_${++spId}`;
      db.exec(`SAVEPOINT ${sp}`);
      try {
        const result = fn(...args);
        db.exec(`RELEASE SAVEPOINT ${sp}`);
        return result;
      } catch (err) {
        db.exec(`ROLLBACK TO SAVEPOINT ${sp}`);
        db.exec(`RELEASE SAVEPOINT ${sp}`);
        throw err;
      }
    };
  }
  close() {
    if (this.open) this._db.close();
    this.open = false;
  }
}

module.exports = Database;
module.exports.default = Database;
