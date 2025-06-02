const express = require('express');
const jwt = require('jsonwebtoken');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bcrypt = require('bcrypt');
const receiptsRouter = require('./routes/receipts'); // ← 여기에 주의

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3000;
const JWT_SECRET = 'test-secret-key';

// MySQL 연결
const db = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '비밀번호', // ← 본인 비번
  database: 'receipt_app'
});

// 토큰 인증 미들웨어
function authenticateToken(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ err: '토큰 없음' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(403).json({ err });
  }
}

// 👇 이거 필수! receiptsRouter 등록
app.use('/api/receipts', receiptsRouter);

// 회원가입
app.post('/api/signup', async (req, res) => {
  const { Userid, Userpassword } = req.body;
  if (!Userid || !Userpassword) return res.json({ err: '아이디와 비밀번호가 필요합니다.' });

  try {
    const [rows] = await db.execute('SELECT * FROM user WHERE username = ?', [Userid]);
    if (rows.length > 0) return res.json({ err: '이미 존재하는 사용자입니다.' });

    const hashedPassword = await bcrypt.hash(Userpassword, 10);
    await db.execute('INSERT INTO user (username, password) VALUES (?, ?)', [Userid, hashedPassword]);

    res.json({ err: null });
  } catch (error) {
    console.error(error);
    res.json({ err: '서버 오류가 발생했습니다.' });
  }
});

// 로그인
app.post('/api/login', async (req, res) => {
  const { Userid, Userpassword } = req.body;
  if (!Userid || !Userpassword) return res.json({ err: '아이디와 비밀번호가 필요합니다.' });

  try {
    const [rows] = await db.execute('SELECT * FROM user WHERE username = ?', [Userid]);
    if (rows.length === 0) return res.json({ err: '존재하지 않는 사용자입니다.' });

    const user = rows[0];
    const match = await bcrypt.compare(Userpassword, user.password);
    if (!match) return res.json({ err: '비밀번호가 틀렸습니다.' });

    const token = jwt.sign({ Userid: user.user_id }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ err: null, token: token, Userid: user.user_id });
  } catch (error) {
    console.error(error);
    res.json({ err: '서버 오류가 발생했습니다.' });
  }
});

// 감정 분석 저장 (OCR+감정 분석 후 저장)
app.post('/api/data', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.Userid;
    const { date, category, total, emotion_string } = req.body;
    if (!date || !category || !total || !emotion_string) {
      return res.status(400).json({ err: '필수 데이터 누락' });
    }

    const emotion = emo_analy(emotion_string);
    const emotion_response = emo_string(emotion_string, emotion);

    await db.execute(`
      INSERT INTO receipt (user_id, receipt_date, total_amount, emotion_description, category)
      VALUES (?, ?, ?, ?, ?)
    `, [userId, date, total, emotion_string, category]);

    res.json({ err: null, emotion_response });
  } catch (error) {
    console.error('에러 발생:', error);
    res.status(500).json({ err: '서버 내부 오류 발생' });
  }
});

function emo_analy(text) {
  // 임시 분석기
  return 'neutral';
}
function emo_string(text, emotion) {
  return '오늘도 수고했어요!';
}

// 그래프용 API
function getThisMonthRange() {
  const end = new Date(); // 오늘
  const start = new Date();
  start.setDate(end.getDate() - 30);

  const toDateString = (d) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  return [toDateString(start), toDateString(end)];
}

app.get('/api/graph/emotion', authenticateToken, async (req, res) => {
  const userId = req.user.Userid;
  const [start, end] = getThisMonthRange();
  const [rows] = await db.execute(`
    SELECT emotion_type, SUM(total_amount) AS total_spent
    FROM receipt
    WHERE user_id = ? AND receipt_date BETWEEN ? AND ?
    GROUP BY emotion_type
  `, [userId, start, end]);

  const formatted = rows.map(row => ({
    emotion: row.emotion_type,
    total: Number(row.total_spent)
  }));

  res.json(formatted);
});

app.get('/api/graph/category', authenticateToken, async (req, res) => {
  const userId = req.user.Userid;
  const [start, end] = getThisMonthRange();
  const [rows] = await db.execute(`
    SELECT category, SUM(total_amount) AS total_spent
    FROM receipt
    WHERE user_id = ? AND receipt_date BETWEEN ? AND ?
    GROUP BY category
  `, [userId, start, end]);

  const formatted = rows.map(row => ({
    category: row.category,
    total: Number(row.total_spent)
  }));

  res.json(formatted);
});

app.get('/api/graph/daily', authenticateToken, async (req, res) => {
  const userId = req.user.Userid;
  const [start, end] = getThisMonthRange();
  const [rows] = await db.execute(`
    SELECT receipt_date AS date, emotion_type, SUM(total_amount) AS total_spent
    FROM receipt
    WHERE user_id = ? AND receipt_date BETWEEN ? AND ?
    GROUP BY receipt_date, emotion_type
    ORDER BY receipt_date ASC
  `, [userId, start, end]);

  const formatted = rows.map(row => ({
    date: row.date,
    emotion: row.emotion_type,
    total: Number(row.total_spent)
  }));

  res.json(formatted);
});

app.listen(PORT, () => {
  console.log(`✅ 서버 실행 중: http://localhost:${PORT}`);
});


app.get('/api/emotion-diary/range', authenticateToken, async (req, res) => {
  const userId = req.query.userId;
  const start = req.query.start;
  const end = req.query.end;

  try {
    const [rows] = await db.execute(`
      SELECT receipt_date AS date, emotion_type AS emotion, emotion_description AS sentence
      FROM receipt
      WHERE user_id = ? AND receipt_date BETWEEN ? AND ?
      ORDER BY receipt_date DESC
    `, [userId, start, end]);

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ err: "서버 오류 발생" });
  }
});

