const express = require('express');
const jwt = require('jsonwebtoken');
const mysql = require('mysql2/promise');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

const PORT = 3000;
const JWT_SECRET = 'test-secret-key';

// MySQL 연결
const db = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'tkddnjs7201@', // ← 본인 MySQL 비밀번호로 변경
  database: 'receipt_app'
});

// 인증 미들웨어
function authenticateToken(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ message: '토큰 없음' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(403).json({ message: '토큰 검증 실패' });
  }
}

// 날짜 범위
function getThisMonthRange() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return [`${year}-${month}-01`, `${year}-${month}-31`];
}

// 감정별 지출
app.post('/api/graph/emotion', authenticateToken, async (req, res) => {
  const userId = req.user.user_id;
  const [start, end] = getThisMonthRange();

  const [rows] = await db.execute(`
    SELECT emotion_type, SUM(total_amount) AS total_spent
    FROM receipt
    WHERE user_id = ? AND receipt_date BETWEEN ? AND ?
    GROUP BY emotion_type
  `, [userId, start, end]);

  res.json(rows);
});

// 테스트용 토큰 발급
app.get('/api/token', (req, res) => {
  const token = jwt.sign({ user_id: 1 }, JWT_SECRET, { expiresIn: '1h' });
  res.json({ token });
});

app.listen(PORT, () => {
  console.log(`🚀 서버 실행 중: http://localhost:${PORT}`);
}); 