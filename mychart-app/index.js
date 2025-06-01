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
  const month = now.getMonth(); // 0부터 시작 (0: 1월, 11: 12월)

  // 이번 달 15일
  const currentMonth15th = new Date(year, month, 15);
  const currentMonth15thString = `${currentMonth15th.getFullYear()}-${String(currentMonth15th.getMonth() + 1).padStart(2, '0')}-15`;

  // 전달 15일
  const previousMonth15th = new Date(year, month - 1, 15);
  const previousMonth15thString = `${previousMonth15th.getFullYear()}-${String(previousMonth15th.getMonth() + 1).padStart(2, '0')}-15`;

  return [previousMonth15thString, currentMonth15thString];
}

// 감정별 지출
app.post('/api/graph/emotion', authenticateToken, async (req, res) => {
  const userId = req.user.user_id;
  const [start, end] = getThisMonthRange();

  const [rows] = await db.execute(`
    SELECT receipt_date, emotion_type, SUM(total_amount) AS total_spent
    FROM receipt
    WHERE user_id = ? AND receipt_date BETWEEN ? AND ?
    GROUP BY receipt_date, emotion_type
    ORDER BY receipt_date ASC
  `, [userId, start, end]);

  res.json(rows);
});

// 카테고리별 총 지출 금액 조회 API
app.post('/api/graph/category', authenticateToken, async (req, res) => {
  const userId = req.user.user_id;
  const [start, end] = getThisMonthRange();

  const [rows] = await db.execute(`
    SELECT category, SUM(total_amount) AS total_spent
    FROM receipt
    WHERE user_id = ? AND receipt_date BETWEEN ? AND ?
    GROUP BY category
  `, [userId, start, end]);

  res.json(rows);
});

// 지출 날짜 기반, 감정 및 총 지출 금액 API
app.post('/api/graph/daily', authenticateToken, async (req, res) => {
  const userId = req.user.user_id;
  const { target_date } = req.body; // 요청 바디에서 target_date를 가져옴

  // 날짜 유효성 검사 (간단)
  if (!target_date || !/^\d{4}-\d{2}-\d{2}$/.test(target_date)) {
    return res.status(400).json({ message: '유효하지 않은 날짜 형식입니다. YYYY-MM-DD 형식으로 보내주세요.' });
  }

  try {
    const [rows] = await db.execute(`
      SELECT DATE_FORMAT(receipt_date, '%Y-%m-%d') AS receipt_date, emotion_type, SUM(total_amount) AS total_spent
      FROM receipt
      WHERE user_id = ? AND receipt_date = ?
      GROUP BY receipt_date, emotion_type
      ORDER BY receipt_date ASC
    `, [userId, target_date]); // 특정 날짜로 필터링

    res.json(rows);
  } catch (error) {
    console.error('일별 지출 조회 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

// 테스트용 토큰 발급
app.get('/api/token', (req, res) => {
  const token = jwt.sign({ user_id: 1 }, JWT_SECRET, { expiresIn: '1h' });
  res.json({ token });
});

app.listen(PORT, () => {
  console.log(`🚀 서버 실행 중: http://localhost:${PORT}`);
}); 