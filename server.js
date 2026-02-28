const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET = "supersecretkey";

app.use(express.json());
app.use(express.static('public'));


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


app.get('/products', authenticateToken, (req, res) => {
  db.all("SELECT * FROM products", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});


app.post("/set-goal", authenticateToken, (req, res) => {
  const { goal } = req.body;
  const user_id = req.user.id;

  db.run(
    "UPDATE users SET goal = ? WHERE id = ?",
    [goal, user_id],
    function (err) {
      if (err) {
        console.error("Ошибка установки цели:", err);
        return res.status(500).json({ error: "DB error" });
      }

      res.json({ success: true });
    }
  );
});

app.post("/sales", authenticateToken, (req, res) => {
  const { product_id } = req.body;

  if (!product_id) {
    return res.status(400).json({ error: "Нет product_id" });
  }

  db.run(
    "INSERT INTO sales (user_id, product_id) VALUES (?, ?)",
    [req.user.id, product_id],
    function (err) {
      if (err) {
        console.error("Ошибка sales:", err);
        return res.status(500).json({ error: "DB error" });
      }

      res.json({ success: true });
    }
  );
});

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


app.get("/stats", authenticateToken, (req, res) => {
  const userId = req.user.id;
  const period = req.query.period;

  let dateFilter = "";

  if (period === "today") {
    dateFilter = "AND date(s.created_at) = date('now')";
  }

  if (period === "month") {
    dateFilter = "AND strftime('%Y-%m', s.created_at) = strftime('%Y-%m', 'now')";
  }

  const query = `
    SELECT 
      p.id,
      p.name,
      p.price,
      p.category,
      COUNT(s.id) as total_quantity,
      COUNT(s.id) * p.price as total_income
    FROM products p
    LEFT JOIN sales s 
      ON p.id = s.product_id 
      AND s.user_id = ?
      ${dateFilter}
    GROUP BY p.id
  `;

  db.all(query, [userId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });

    const totalIncome = rows.reduce((sum, row) => sum + (row.total_income || 0), 0);

    db.get(
      "SELECT goal FROM users WHERE id = ?",
      [userId],
      (err, user) => {

        const goal = user?.goal || 0;
        const percent = goal > 0 ? Math.floor((totalIncome / goal) * 100) : 0;

        res.json({
          products: rows,
          total_income: totalIncome,
          goal,
          percent
        });
      }
    );
  });
});


app.listen(PORT, () => {
  console.log("Server started on port", PORT);
});