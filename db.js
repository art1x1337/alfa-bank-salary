const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.db');
console.log("DB file path:", dbPath);

const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  console.log("Создаю таблицы Bank Edition...");

  db.run(`
     CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    password TEXT,
    goal INTEGER DEFAULT 0
  )
`);

  db.run(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE,
      price INTEGER
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      product_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const defaultProducts = [
    { name: "ДК/ЗПК/RE", price: 310 },
    { name: "КК", price: 570 },
    { name: "Терминал", price: 510 },
    { name: "Детская карта", price: 430 },
    { name: "Сим", price: 270 },
    { name: "РКО", price: 830 }
  ];

  defaultProducts.forEach(product => {
    db.run(
      "INSERT OR IGNORE INTO products (name, price) VALUES (?, ?)",
      [product.name, product.price]
    );
  });

  db.all("SELECT name FROM sqlite_master WHERE type='table'", [], (err, rows) => {
    console.log("Текущие таблицы:", rows);
  });

});

module.exports = db;