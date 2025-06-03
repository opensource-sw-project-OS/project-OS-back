const express = require('express');
const jwt = require('jsonwebtoken');
const mysql = require('mysql2/promise');
const cors = require('cors');
const app = express();

// CORS 설정: 모든 오리진 허용
app.use(cors({ origin: '*' }));
app.use(express.json());

const PORT = 3000;
const JWT_SECRET = 'test-secret-key';

// 모든 요청에 대해 실행되는 미들웨어 (요청 도달 확인용)
app.use((req, res, next) => {
  console.log(`요청 수신: ${req.method} ${req.url}`); // <-- 모든 요청에 대한 로그
  next();
});

// MySQL 연결
const db = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'tkddnjs7201@', // ← 본인 MySQL 비밀번호로 변경
  database: 'receipt_app'
});

// 인증 미들웨어
function authenticateToken(req, res, next) {
  console.log('Authenticate token middleware called'); // <-- 미들웨어 호출 로그
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) {
    console.log('토큰 없음: 인증 실패'); // <-- 로그 추가
    return res.status(401).json({ message: '토큰 없음' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    console.log('토큰 검증 성공:', decoded.user_id); // <-- 로그 추가
    next();
  } catch (err) {
    console.error('토큰 검증 실패:', err.message); // <-- 로그 추가
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
app.get('/api/graph/emotion', authenticateToken, async (req, res) => {
  console.log('Emotion graph API called'); // <-- 라우트 도달 확인 로그
  const userId = req.user.user_id;
  const [start, end] = getThisMonthRange(); // 현재 달의 15일부터 다음 달 15일까지

  try {
    const [rows] = await db.execute(`
      SELECT emotion_type, SUM(total_amount) AS total_amount
      FROM receipt
      WHERE user_id = ? AND receipt_date BETWEEN ? AND ?
      GROUP BY emotion_type
      HAVING emotion_type IS NOT NULL AND emotion_type != ''
    `, [userId, start, end]);

    res.json(rows);
  } catch (error) {
    console.error('감정별 지출 조회 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

// 카테고리별 총 지출 금액 조회 API
app.get('/api/graph/category', authenticateToken, async (req, res) => {
  console.log('Category graph API called'); // <-- 라우트 도달 확인 로그
  const userId = req.user.user_id;
  const [start, end] = getThisMonthRange(); // 현재 달의 15일부터 다음 달 15일까지

  try {
    const [rows] = await db.execute(`
      SELECT category, SUM(total_amount) AS total_amount
      FROM receipt
      WHERE user_id = ? AND receipt_date BETWEEN ? AND ?
      GROUP BY category
      HAVING category IS NOT NULL AND category != ''
    `, [userId, start, end]);

    res.json(rows);
  } catch (error) {
    console.error('카테고리별 지출 조회 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

// 일별 총 지출 금액 조회 API (현재 월 전체)
app.get('/api/graph/daily', authenticateToken, async (req, res) => {
  console.log('Daily graph API called'); // <-- 라우트 도달 확인 로그
  const userId = req.user.user_id;
  const [start, end] = getThisMonthRange(); // 현재 달의 15일부터 다음 달 15일까지

  try {
    const [rows] = await db.execute(`
      SELECT DATE_FORMAT(receipt_date, '%Y-%m-%d') AS expense_date, SUM(total_amount) AS total_amount
      FROM receipt
      WHERE user_id = ? AND receipt_date BETWEEN ? AND ?
      GROUP BY expense_date
      ORDER BY expense_date ASC
    `, [userId, start, end]);

    res.json(rows);
  } catch (error) {
    console.error('일별 지출 조회 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

// 지출 및 감정 기록 API
app.post('/api/receipts', authenticateToken, async (req, res) => {
  console.log('Receipts POST API called'); // <-- 로그 추가
  const userId = req.user.user_id; // 인증된 사용자 ID
  const { receipt_date, category, total_amount, emotion_type, emotion_description } = req.body;

  // 필수 필드 유효성 검사
  if (!receipt_date || !category || total_amount === undefined) {
    return res.status(400).json({ message: '날짜, 카테고리, 금액은 필수 입력 항목입니다.' });
  }

  // total_amount가 유효한 숫자인지 확인
  if (isNaN(total_amount) || total_amount < 0) {
      return res.status(400).json({ message: '올바른 금액을 입력해주세요.' });
  }

  try {
    // 데이터베이스에 영수증(지출) 정보 삽입
    const query = `
      INSERT INTO receipt (user_id, receipt_date, category, total_amount, emotion_type, emotion_description)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    const [result] = await db.execute(
      query,
      [userId, receipt_date, category, total_amount, emotion_type || null, emotion_description || null]
    );

    // 성공 응답
    res.status(201).json({ message: '지출 및 감정 기록이 성공적으로 저장되었습니다.', receiptId: result.insertId });

  } catch (error) {
    console.error('지출 기록 저장 오류:', error);
    res.status(500).json({ message: '지출 기록 저장 중 서버 오류가 발생했습니다.' });
  }
});

// 회원가입 API
app.post('/api/signup', async (req, res) => {
  console.log('Signup API called'); // <-- 로그 추가
  const { username, password } = req.body;

  // 기본적인 유효성 검사
  if (!username || !password) {
    return res.status(400).json({ message: '아이디와 비밀번호를 모두 입력해주세요.' });
  }

  try {
    // TODO: 실제 서비스에서는 비밀번호를 반드시 해싱하여 저장해야 합니다!
    const [result] = await db.execute(
      'INSERT INTO user (username, password) VALUES (?, ?)',
      [username, password]
    );

    // 성공 응답
    res.status(201).json({ message: '회원가입이 성공적으로 완료되었습니다.', userId: result.insertId });

  } catch (error) {
    console.error('회원가입 오류:', error);

    // 중복 아이디 오류 감지 (MySQL 오류 코드 1062)
    if (error.errno === 1062) {
      return res.status(409).json({ message: '이미 존재하는 아이디입니다.' });
    }

    // 기타 서버 오류
    res.status(500).json({ message: '회원가입 중 서버 오류가 발생했습니다.' });
  }
});

// 로그인 API
app.post('/api/login', async (req, res) => {
  console.log('Login API called'); // <-- 로그 추가
  const { username, password } = req.body;

  // 기본적인 유효성 검사
  if (!username || !password) {
    return res.status(400).json({ message: '아이디와 비밀번호를 모두 입력해주세요.' });
  }

  try {
    // 1. 데이터베이스에서 사용자 찾기
    const [users] = await db.execute(
      'SELECT user_id, username, password FROM user WHERE username = ?',
      [username]
    );

    const user = users[0];

    // 2. 사용자 존재 및 비밀번호 확인
    // TODO: 실제 서비스에서는 비밀번호 해싱 비교 로직이 들어가야 합니다!
    if (!user || user.password !== password) {
      return res.status(401).json({ message: '아이디 또는 비밀번호가 일치하지 않습니다.' });
    }

    // 3. JWT 토큰 생성
    const token = jwt.sign({ user_id: user.user_id }, JWT_SECRET, { expiresIn: '1h' });

    // 4. 성공 응답 (토큰 반환)
    res.status(200).json({ message: '로그인 성공', token: token });

  } catch (error) {
    console.error('로그인 오류:', error);
    res.status(500).json({ message: '로그인 중 서버 오류가 발생했습니다.' });
  }
});

// 예산 설정/수정 API
app.post('/api/budget', authenticateToken, async (req, res) => {
  console.log('Budget POST API called'); // <-- 로그 추가
  const userId = req.user.user_id;
  const { year, month, budget_amount } = req.body;

  // 필수 필드 유효성 검사
  if (!year || !month || budget_amount === undefined) {
    return res.status(400).json({ message: '년, 월, 예산 금액은 필수 입력 항목입니다.' });
  }

  // budget_amount가 유효한 숫자인지 확인
  if (isNaN(budget_amount) || budget_amount < 0) {
      return res.status(400).json({ message: '올바른 예산 금액을 입력해주세요.' });
  }

  try {
    // 예산 정보 삽입 또는 업데이트 (user_id, year, month 기준으로)
    const query = `
      INSERT INTO budget (user_id, year, month, budget_amount)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE budget_amount = VALUES(budget_amount)
    `;
    const [result] = await db.execute(
      query,
      [userId, year, month, budget_amount]
    );

    // 성공 응답
    res.status(201).json({ message: '예산이 성공적으로 설정/수정되었습니다.' });

  } catch (error) {
    console.error('예산 설정/수정 오류:', error);
    res.status(500).json({ message: '예산 설정/수정 중 서버 오류가 발생했습니다.' });
  }
});

// 예산 조회 API
app.get('/api/budget', authenticateToken, async (req, res) => {
  console.log('Budget GET API called'); // <-- 로그 추가
  const userId = req.user.user_id;
  const { year, month } = req.query; // 쿼리 파라미터에서 year, month를 가져옴

  // 필수 필드 유효성 검사
  if (!year || !month) {
    return res.status(400).json({ message: '년, 월은 필수 쿼리 파라미터입니다.' });
  }

  try {
    // 예산 정보 조회
    const [rows] = await db.execute(
      'SELECT budget_amount FROM budget WHERE user_id = ? AND year = ? AND month = ?',
      [userId, year, month]
    );

    if (rows.length > 0) {
      // 예산이 존재하는 경우
      res.status(200).json({ budget_amount: rows[0].budget_amount });
    } else {
      // 예산이 설정되지 않은 경우
      res.status(404).json({ message: '해당 월의 예산이 설정되지 않았습니다.', budget_amount: null });
    }

  } catch (error) {
    console.error('예산 조회 오류:', error);
    res.status(500).json({ message: '예산 조회 중 서버 오류가 발생했습니다.' });
  }
});

// 특정 기간 지출 내역 조회 API (달력 등에서 사용)
app.get('/api/receipts/usage/range', authenticateToken, async (req, res) => {
  console.log('Receipts usage range API called'); // <-- 로그 추가
  const userId = req.user.user_id;
  const { start, end } = req.query; // 쿼리 파라미터에서 시작일과 종료일을 가져옴 (YYYY-MM-DD)

  // 날짜 유효성 검사 (간단)
  if (!start || !end || !/^\d{4}-\d{2}-\d{2}$/.test(start) || !/^\d{4}-\d{2}-\d{2}$/.test(end)) {
    return res.status(400).json({ message: '유효하지 않은 날짜 형식입니다. YYYY-MM-DD 형식으로 start, end 쿼리 파라미터를 보내주세요.' });
  }

  try {
    const [rows] = await db.execute(`
      SELECT receipt_date AS date, emotion_type AS emotion, total_amount AS amount
      FROM receipt
      WHERE user_id = ? AND receipt_date BETWEEN ? AND ?
      ORDER BY receipt_date ASC
    `, [userId, start, end]);

    res.json(rows);
  } catch (error) {
    console.error('기간별 지출 내역 조회 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

// 특정 기간 감정 일기 조회 API (다이어리 등에서 사용)
app.get('/api/emotion-diary/range', authenticateToken, async (req, res) => {
  console.log('Emotion diary range API called'); // <-- 로그 추가
  const userId = req.user.user_id;
  const { start, end } = req.query; // 쿼리 파라미터에서 시작일과 종료일을 가져옴 (YYYY-MM-DD)

   // 날짜 유효성 검사 (간단)
  if (!start || !end || !/^\d{4}-\d{2}-\d{2}$/.test(start) || !/^\d{4}-\d{2}-\d{2}$/.test(end)) {
    return res.status(400).json({ message: '유효하지 않은 날짜 형식입니다. YYYY-MM-DD 형식으로 start, end 쿼리 파라미터를 보내주세요.' });
  }

  try {
    // receipt 테이블의 emotion_description 컬럼을 감정 일기 내용으로 사용
    const [rows] = await db.execute(`
      SELECT receipt_date AS date, emotion_type AS emotion, emotion_description AS sentence
      FROM receipt
      WHERE user_id = ? AND receipt_date BETWEEN ? AND ? AND emotion_description IS NOT NULL
      ORDER BY receipt_date ASC
    `, [userId, start, end]);

    res.json(rows);
  } catch (error) {
    console.error('기간별 감정 일기 조회 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

// 테스트용 토큰 발급
app.get('/api/token', (req, res) => {
  console.log('Token API called'); // <-- 로그 추가
  const token = jwt.sign({ user_id: 1 }, JWT_SECRET, { expiresIn: '1h' });
  res.json({ token });
});

app.listen(PORT, () => {
  console.log(`🚀 서버 실행 중: http://localhost:${PORT}`);
}); 