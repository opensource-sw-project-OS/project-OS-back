const express = require('express');
const jwt = require('jsonwebtoken');
const mysql = require('mysql2/promise');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

const PORT = 3000;
const JWT_SECRET = 'test-secret-key';

// 이건 템플릿을 위해서 생성한 것입니다
/*
    Userid 가 좀 복잡합니다.
    정확히는 회원가입과 로그인 과정에서의 쓰임과, 인증 이후의 쓰임이 좀 다릅니다.

    회원가입과 로그인을 할 땐 사용자가 입력한 User ID의 문자열이 담깁니다.
    회원가입에서 데이터를 등록할 때 Userid 프로퍼티 값은 'username' 컬럼의 값과 비교하게 됩니다.

    서버는 token에 해당 프로퍼티로 user 테이블의 INT 형 pk 값을 저장합니다.

    로그인 이후의 통신에서는 token에 저장된 INT 데이터를 바탕으로 
    쿼리문의 user 테이블에서 값을 찾는 것으로 사용합니다.

*/
res_json = {
  Userid : null, //사용자 id
  Userpassword : null, // 사용자 password 
  
  data : null, // 그외 데이터 (base64 코드 등)
  token : null, // token 정보
  err : null, // 에러 유무 저장 (에러가 없으면 null, 에러가 있으면 해당 사유)
  
  date : null, // 날짜 -> '단일 날짜' or '기간'[시작, 끝] 
  total : null, // 총 지출 금액
  category : null, // 카테고리
  
  emotion : null, // 감정 타입(종류)
  emotion_string : null, // 감정 문장(사용자 입력 문장)
  emotion_response : null // 위로 문장(임시 명칭)
}

// MySQL 연결
const db = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'tkddnjs7201@', // ← 본인 MySQL 비밀번호로 변경
  database: 'receipt_app'
});

// 토큰 인증 미들웨어
function authenticateToken(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ err: '토큰 없음' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // 유저에 decoded가 저장됨 -> token에 들어있던 Userid가 자동으로 할당됨
    next();
  } catch (err) {
    res.status(403).json({ err });
  }
}

//----------------------------------------------------------------------------------//
// 회원가입
app.post('/api/signup', async (req, res) => {
  const { Userid, Userpassword } = req.body;

  if (!Userid || !Userpassword) {
    return res.json({ err: '아이디와 비밀번호가 모두 필요합니다.' });
  }

  try {
    const [rows] = await db.execute('SELECT * FROM user WHERE username = ?', [Userid]);
    if (rows.length > 0) {
      return res.json({ err: '이미 존재하는 사용자입니다.' });
    }

    const hashedPassword = await bcrypt.hash(Userpassword, 10);

    // 해당 쿼리문은 실제로 동작하는지 확인할 것
    await db.execute('INSERT INTO user (username, password) VALUES (?, ?)', [Userid, hashedPassword]);

    res.json({ err: null });
  } catch (error) {
    console.error(error);
    res.json({ err: '서버 오류가 발생했습니다.' });
  }
});

// 로그인 -  토큰 전달
app.post('/api/login', async (req, res) => {
  const { Userid, Userpassword } = req.body;

  if (!Userid || !Userpassword) {
    return res.json({ err: '아이디와 비밀번호가 필요합니다.' });
  }

  try {
    const [rows] = await db.execute('SELECT * FROM user WHERE username = ?', [Userid]);
    if (rows.length === 0) {
      return res.json({ err: '존재하지 않는 사용자입니다.' });
    }

    const user = rows[0];
    const match = await bcrypt.compare(Userpassword, user.password);
    if (!match) {
      return res.json({ err: '비밀번호가 틀렸습니다.' });
    }

    const token = jwt.sign({ 
        Userid: user.user_id
        }, JWT_SECRET, { expiresIn: '1h' });

    res.json({
      err: null,
      token: token,
      Userid: user.user_id
    });
  } catch (error) {
    console.error(error);
    res.json({ err: '서버 오류가 발생했습니다.' });
  }
});
//----------------------------------------------------------------------------------//
// OCR + 감정 분석

//app.post('/api/OCR')

// 최종 데이터 전달됨
/*
    전달된 json 데이터에 저장된 값

    User id <- 전달된 token에 의해 자동으로 확인 됨    
    date(날짜)
    category(카테고리)
    total(총 지출 금액)
    emotion_string(감정 문장)
*/

app.post('/api/data', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.Userid;
    const { date, category, total, emotion_string } = req.body;

    if (!date || !category || !total || !emotion_string) {
      return res.status(400).json({ err: '필수 데이터 누락' });
    }

    const emotion = emo_analy(emotion_string);
    const emotion_response = emo_string(emotion_string, emotion);

    // DB 저장
    await db.execute(`
      테이블에 데이터를 저장하는 쿼리문
    `, [userId, /* 적절한 변수 입력*/ ]);

    res.json({
      err: null,
      emotion_response
    });

  } catch (error) {
    console.error('에러 발생:', error);
    res.status(500).json({ err: '서버 내부 오류 발생' });
  }
});
// 감정 분석 후 emotion 반환
function emo_analy(){}

// 감정에 따른 적절한 문장을 반환
function emo_string(){}

//----------------------------------------------------------------------------------//
// chart.js 를 위한 통신 처리
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
        emotion : row.emotion_type,
        total : Number(row.total_spent)
    }));

    res.json(formatted);
    // 반환 되는 값
    // [
    //   {
    //     "emotion": "happy",
    //     "total": 12500
    //   },
    //   {
    //     "emotion": "sad",
    //     "total": 4300
    //   }
    // ]
});

app.get('/api/graph/category', authenticateToken, async (req, res) => {
  const userId = req.user.Userid;
  const [start, end] = getThisMonthRange();

  const [rows] = await db.execute(`

    카테고리에 맞는 쿼리문

  `, [userId, start, end]);

    const formatted = rows.map(row => ({
        // 각 프로퍼티 별 데이터 할당은 쿼리문에서 추출한 값에 맞게 변경
        category : row.category,
        total : Number(row.total_spent)
    }));

    res.json(formatted);
});

app.get('/api/graph/daily', authenticateToken, async (req, res) => {
  const userId = req.user.Userid;
  const [start, end] = getThisMonthRange();

  const [rows] = await db.execute(`

    일별 감정 및 지출 에 맞는 쿼리문

  `, [userId, start, end]);

    const formatted = rows.map(row => ({
        // 각 프로퍼티 별 데이터 할당은 쿼리문에서 추출한 값에 맞게 변경
        date : row.date,
        emotion : row.emotion_type,
        total : Number(row.total_spent)
    }));

    res.json(formatted);
});


app.listen(PORT, () => {
  console.log(`? 서버 실행 중: http://localhost:${PORT}`);
}); 