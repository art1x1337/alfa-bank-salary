const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('./db');

const app = express();
const PORT = 3000;
const SECRET = "supersecretkey";

app.use(express.json());
app.use(express.static('public'));


// ================== АВТОРИЗАЦИЯ ==================

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.sendStatus(401);

  jwt.verify(token, SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}


// Регистрация
app.post('/register', async (req, res) => {
  const { email, password } = req.body;

  const hashedPassword = await bcrypt.hash(password, 10);

  db.run(
    "INSERT INTO users (email, password) VALUES (?, ?)",
    [email, hashedPassword],
    function (err) {
      if (err) return res.status(400).json({ error: err.message });

      res.json({ message: "Пользователь создан" });
    }
  );
});


// Логин
app.post('/login', (req, res) => {
  const { email, password } = req.body;

  db.get(
    "SELECT * FROM users WHERE email = ?",
    [email],
    async (err, user) => {

      if (!user) return res.status(400).json({ error: "Пользователь не найден" });

      const valid = await bcrypt.compare(password, user.password);

      if (!valid) return res.status(403).json({ error: "Неверный пароль" });

      const token = jwt.sign({ id: user.id }, SECRET);

      res.json({ token });
    }
  );
});


// ================== ПРОДУКТЫ ==================

const defaultProducts = [
  { name: "ДК/ЗПК/RE", price: 310 },
  { name: "КК", price: 570 },
  { name: "Терминал", price: 510 },
  { name: "Детская карта", price: 430 },
  { name: "Сим", price: 270 },
  { name: "РКО", price: 830 }
];



// Получить список продуктов
app.get('/products', authenticateToken, (req, res) => {
  db.all("SELECT * FROM products", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});


// ================== ПРОДАЖИ ==================

// +1 продажа (кнопка)
app.post('/sales', authenticateToken, (req, res) => {
  const { product_id } = req.body;

  db.run(
    "INSERT INTO sales (user_id, product_id) VALUES (?, ?)",
    [req.user.id, product_id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });

      res.json({ message: "Продажа добавлена" });
    }
  );
});

app.post('/set-goal', authenticateToken, (req, res) => {
  const { goal } = req.body;

  db.run(
    "UPDATE users SET goal = ? WHERE id = ?",
    [goal, req.user.id],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "Цель обновлена" });
    }
  );
});


// Удалить последнюю продажу продукта (если ошибся)
app.delete('/sales/:product_id', authenticateToken, (req, res) => {

  db.get(
    `SELECT id FROM sales
     WHERE user_id = ? AND product_id = ?
     ORDER BY created_at DESC
     LIMIT 1`,
    [req.user.id, req.params.product_id],
    (err, row) => {

      if (!row) return res.status(404).json({ error: "Нет продаж для удаления" });

      db.run("DELETE FROM sales WHERE id = ?", [row.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Последняя продажа удалена" });
      });
    }
  );
});


// ================== СТАТИСТИКА ==================

app.get('/stats', authenticateToken, (req, res) => {

   const period = req.query.period;

  let dateFilter = "";
  if (period === "today") {
    dateFilter = "AND DATE(s.created_at) = DATE('now')";
  } else if (period === "month") {
    dateFilter = "AND strftime('%Y-%m', s.created_at) = strftime('%Y-%m', 'now')";
  }

  db.all(`
     SELECT p.id, p.name, p.price,
         COUNT(s.id) as total_quantity,
         COUNT(s.id) * p.price as total_income
  FROM products p
  LEFT JOIN sales s ON p.id = s.product_id
    AND s.user_id = ?
    ${dateFilter}
  GROUP BY p.id
`, [req.user.id], (err, rows) => {

    if (err) return res.status(500).json({ error: err.message });

    const grandTotal = rows.reduce((sum, p) => sum + (p.total_income || 0), 0);

    // Получаем goal
    db.get(
      "SELECT goal FROM users WHERE id = ?",
      [req.user.id],
      (err2, user) => {

        if (err2) return res.status(500).json({ error: err2.message });

        const goal = user ? user.goal : 0;
        const percent = goal > 0
          ? Math.min(100, Math.round((grandTotal / goal) * 100))
          : 0;

        res.json({
          products: rows,
          total_income: grandTotal,
          goal: goal,
          percent: percent
        });

      }
    );

  });

});


// ==================

app.listen(PORT, () => {
  console.log("Server started on port", PORT);
});