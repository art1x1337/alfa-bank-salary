const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("./database.db");

db.serialize(() => {

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
      name TEXT,
      price INTEGER,
      category TEXT
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

  db.get("SELECT COUNT(*) as count FROM products", (err, row) => {

    if (err) {
      console.error("Ошибка проверки products:", err);
      return;
    }

    if (row && row.count === 0) {

  const stmt = db.prepare(
    "INSERT INTO products (name, price, category) VALUES (?, ?, ?)"
  );

  stmt.run("ДК/ЗПК/РЕ", 310, "done");
  stmt.run("КК", 570, "done");
  stmt.run("Терминал", 510, "done");
  stmt.run("Крос дет нов", 430, "done");
  stmt.run("РЕ", 270, "done");
  stmt.run("РКО", 830, "done");
  stmt.run("СелфиДК", 380, "done");
  stmt.run("СелфиКК", 570, "done");
  stmt.run("Страховка", 100, "done");
  stmt.run("КроссДК", 270, "done");
  stmt.run("КроссКК", 570, "done");
  stmt.run("АИ", 270, "done");
  stmt.run("ЦП", 30, "done");
  stmt.run("УП", 230, "done");
  stmt.run("Прил (заявка)", 310, "done");

  stmt.run("PPI", 0, "sales");
  stmt.run("CC", 0, "sales");
  stmt.run("Кросс ДК", 0, "sales");
  stmt.run("Комбо", 0, "sales");
  stmt.run("Селфи ДК", 0, "sales");
  stmt.run("ЦП Продажа", 0, "sales");
  stmt.run("Смарт", 0, "sales");
  stmt.run("Кэшбек", 0, "sales");
  stmt.run("ЖКУ", 0, "sales");
  stmt.run("Пенсия", 0, "sales");

  stmt.run("БС", 0, "contest");
  stmt.run("СИМКИ", 0, "contest");
  stmt.run("КОРОБКА", 0, "contest");
  stmt.run("ДЕТСКАЯ", 0, "contest");

  stmt.finalize();

  console.log("Все продукты добавлены");
}
  });

});

module.exports = db;