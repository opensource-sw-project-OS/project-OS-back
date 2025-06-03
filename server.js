const express = require('express');
const jwt = require('jsonwebtoken');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bcrypt = require('bcrypt');
const receiptsRouter = require('./routes/receipts'); // ← 여기에 주의

const app = express();
app.use(cors());
app.use(express.json({limit: '50mb'})) // express로 받아온 json 데이터를 parsing
app.use(express.urlencoded({extended:true, limit: '50mb'})) // url 정보를 parsing 

const PORT = 3000;
const JWT_SECRET = 'test-secret-key';

// MySQL 연결
const db = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'qwer1234', // ← 본인 비번
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
    WHERE user_id = ?
      AND receipt_date >= ?
      AND receipt_date <= DATE_ADD(?, INTERVAL 1 DAY)
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
    WHERE user_id = ?
      AND receipt_date >= ?
      AND receipt_date <= DATE_ADD(?, INTERVAL 1 DAY)
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
    SELECT DATE(receipt_date) AS date, emotion_type, SUM(total_amount) AS total_spent
    FROM receipt
    WHERE user_id = ?
      AND receipt_date >= ?
      AND receipt_date <= DATE_ADD(?, INTERVAL 1 DAY)
    GROUP BY DATE(receipt_date), emotion_type
    ORDER BY DATE(receipt_date) ASC

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
      SELECT DATE(receipt_date) AS date, emotion_type AS emotion, emotion_description AS sentence
      FROM receipt
      WHERE user_id = ?
        AND receipt_date >= ? 
        AND receipt_date <= DATE_ADD(?, INTERVAL 1 DAY)
      ORDER BY receipt_date DESC
    `, [userId, start, end]);

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ err: "서버 오류 발생" });
  }
});



// OCR을 위한 공통 모듈 준비
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const fs = require('fs');
const { createCanvas, Image, ImageData } = require('canvas');
const { JSDOM } = require('jsdom');
const path = require('path');

// 가짜 DOM 설정
const dom = new JSDOM();
global.window = dom.window;
global.document = dom.window.document;
global.HTMLCanvasElement = createCanvas().constructor;
global.HTMLImageElement = Image;

// OpenCV.js 로드
let cvReadyResolve;
const cvReady = new Promise(resolve => {
  cvReadyResolve = resolve;
});
global.Module = {
  onRuntimeInitialized() {
    console.log('✅ OpenCV.js loaded');
    global.cv = global.Module;
    cvReadyResolve(); // Promise resolve 호출
  }
};

const opencvJs = fs.readFileSync('./opencv.js', 'utf8');
eval(opencvJs); // 전역에 cv 등록됨

// OCR 인식 부분분
const Tesseract = require('tesseract.js');

// OCR 데이터 post로 받고 반환
// express 만으로는 이미지를 받지 못하기에 base64로 변환환
app.post('/api/ocr', async (req, res) => {
    try{
      await cvReady;
      let res_Json = {err : null};
      console.log('✅ /api/ocr 진입');
      console.log('받은 데이터 길이:', req.body?.data?.length)

      const base64Data = req.body.data.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
  
      const image = new Image();
      image.src = buffer;

      const canvas = createCanvas(image.width, image.height);
      const ctx = canvas.getContext('2d');
      ctx.drawImage(image, 0, 0);
      const imageData = ctx.getImageData(0, 0, image.width, image.height);

      const src = cv.matFromImageData(imageData);
      let dst = new cv.Mat();
      let gray = new cv.Mat();
      cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);

      // 예시: src = 원본 이미지(Mat), dst = 리사이징 결과(Mat)
      const desiredWidth = 800;
      const aspectRatio = src.rows / src.cols; // height / width
      const newHeight = Math.round(desiredWidth * aspectRatio);

      // 새로운 크기 지정
      const dsize = new cv.Size(desiredWidth, newHeight);
      cv.resize(gray, gray, dsize, 0, 0, cv.INTER_AREA);
      cv.imshow(canvas, gray);
      fs.writeFileSync('./gray.png', canvas.toBuffer('image/png'));

      // 1차 이진화화
      let blockSize = 11;  // 항상 홀수, 11~21 범위 추천
      let C = 5;           // 글씨가 얇으면 C를 낮게, 배경이 복잡하면 C를 높게
      let adap = new cv.Mat();
      cv.adaptiveThreshold(gray, adap, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY, blockSize, C);
      dst = adap;

      cv.imshow(canvas, dst);
      
      // 노이즈 흐리게게
      cv.GaussianBlur(dst, dst, new cv.Size(5,5), 0);
      cv.imshow(canvas, dst);

      // 2차 이진화 -> 흐려진 노이즈 일부 제거
      cv.threshold(dst, dst, 0, 255, cv.THRESH_BINARY+ cv.THRESH_OTSU);
      cv.imshow(canvas, dst);
      
      cv.imshow(canvas, dst);
      dst.delete();
      
      const ocrCanvasBuffer = canvas.toBuffer('image/png');
      const {data : {text}} = await Tesseract.recognize(
        ocrCanvasBuffer,
        'kor', // 한글 언어
        {
          langPath: 'https://tessdata.projectnaptha.com/4.0.0/',//path.join(__dirname, 'tessdata'), // kor.traineddata 파일 위치 폴더
          //logger: m => console.log('[OCR 진행 로그]', m)
        }
      );
      console.log(text);
      let re = analyzeReceipt(text);
      
      res.json(Object.assign({}, re, res_Json));
      console.log(Object.assign({}, re, res_Json));
    }
    catch (err) {
        console.error('❌ 오류 발생:', err);
        res_Json.err = err.message
        res.status(500).json(res_Json);
    }
})

// 후처리
function fixMisreadDate(originalLine) {
  const raw = originalLine.replace(/\s+/g, '');
  //console.log(raw)
  let candidate = raw.replace(/(\d)7(\d)/g, '$1/$2');  // 7 → / 보정만 복사본에서 수행
  //console.log(candidate)
  // ✅ 1순위: '25/05/08' 형태 (정확히 25로 시작하는 날짜)
  const match25 = candidate.match(/25[./]\d{2}[./]\d{2}/);
  if (match25) return match25[0];

  // ✅ 2순위: 앞에 숫자가 붙은 '0025/05/08' 같은 형태 → '25/05/08' 추출
  const embedded25 = candidate.match(/\d*25[./]\d{2}[./]\d{2}/);
  if (embedded25) {
    const refined = embedded25[0].match(/25[./]\d{2}[./]\d{2}/);
    if (refined) return refined[0];
  }

  // ✅ 3순위: 일반 날짜 포맷은 가장 마지막에 시도
  const normal = candidate.match(/\d{2,4}[./]\d{2}[./]\d{2}/);
  if (normal) return normal[0];

  return null;
}
function fixSpacing(text) {
  return normalizeFullWidthToHalfWidth(text).replace(/\s+/g, '');
}

function normalizeNumber(text) {
  return parseInt(text.replace(/[^\d]/g, ''), 10);
}

function analyzeReceipt(text) {
  const lines = text.split(/\r?\n/);
  const result = {
    date: null,
    total: null
    //,물품: []
  };

  // 1. 날짜 우선 후보 탐색 (거래일시 등 키워드가 포함된 줄 우선)
  for (const line of lines) {
    const noSpaceLine = fixSpacing(line);
    const hasDateKeyword = /(거래\s*일시|일시|날짜)/i.test(noSpaceLine);
    //console.log(hasDateKeyword, noSpaceLine);
    const fixed = fixMisreadDate(noSpaceLine);
    if (hasDateKeyword && fixed) {
      result.date = fixed;
      break;
    }
  }

  // 2. 날짜가 아직 없다면 기존 방식으로 다시 탐색
  if (!result.date) {
    for (const line of lines) {
      const noSpaceLine = fixSpacing(line);
      const fixed = fixMisreadDate(noSpaceLine);  // ✅ 여기도 fixMisreadDate 사용!
      if (fixed) {
        result.date= fixed;
        break;
      }
    }
  }

  // 3. 총액, 물품 추출
  for (const line of lines) {
    const noSpaceLine = fixSpacing(line);

    // 총액 추출 (단어 일부 포함만 돼도 인정)
    const hasTotalKeyword = /(큼랙|금랙|총금랙|금액|금맥|합계|항계|함계|합꼐|함꼐|많게|많계|총액|총금액|총금|계)/.test(noSpaceLine);
    //console.log(hasTotalKeyword, noSpaceLine);
    if (!result.total && hasTotalKeyword) {
      const numberMatch = noSpaceLine.match(/\d[\d,.\s]*\d/);
      if (numberMatch) {
        result.total = normalizeNumber(numberMatch[0]);
        continue;
      }
    }
  }

  return result;
}

//전각 문자 인식 오류 해결결
function normalizeFullWidthToHalfWidth(text) {
  return text.replace(/[\uFF01-\uFF5E]/g, ch => {
    return String.fromCharCode(ch.charCodeAt(0) - 0xFEE0);
  }).replace(/\u3000/g, ' '); // 전각 스페이스도 일반 스페이스로
}








const { spawn } = require('child_process');
const python = spawn('python', ['emotion.py'], {
    env: { ...process.env, PYTHONIOENCODING: 'utf-8' }  // 아예 이렇게 고정적으로 명시해야 한국어 안깨짐
}
);


// 감정 분석 저장 (OCR+감정 분석 후 저장)
app.post('/api/data', authenticateToken, async (req, res) => {
  try {
    
    const userId = req.user.Userid;
    const { date, category, total, emotion_string } = req.body;
    if (!date || !category || !total || !emotion_string) {
      return res.status(400).json({ err: '필수 데이터 누락' });
    }
    let temp = {
      data : emotion_string,
      avr : 50000,
      spend : parseInt(total)
    }
    console.log(temp)
    const result = await emo_analy(temp);
    const emotion = result.emotion;
    const emotion_response = result.data;
    //const emotion_response = emo_string(emotion_string, emotion);

    await db.execute(`
      INSERT INTO receipt (user_id, receipt_date, total_amount, emotion_description, category)
      VALUES (?, ?, ?, ?, ?)
    `, [userId, date, total, emotion_string, category]);
    console.log({ emotion, emotion_response })
    res.json({ err: null, emotion_response });
  } catch (error) {
    console.error('에러 발생:', error);
    res.status(500).json({ err: '서버 내부 오류 발생' });
  }
});

async function emo_analy(emotion_string) {
  try{
        const result = await analyzeText(emotion_string);
        console.log("📌 분석 결과:", result);
        let jn = {
            err : null,
            data : result.data,
            emotion : result.emotion
        }

        return jn

    } catch(err){
        console.error("❗오류:", err)
        return err
    }

  return 'neutral';
}
function emo_string(text, emotion) {
  return '오늘도 수고했어요!';
}

function analyzeText(text) {
  return new Promise((resolve, reject) => {
    python.stdin.write(JSON.stringify(text) + '\n');

    python.stdout.once('data', (data) => {
      try {
        const result = JSON.parse(data.toString('utf-8'));
        resolve(result);
      } catch (err) {
        reject(err);
      }
    });

    python.stderr.once('data', (err) => {
      reject(err.toString('utf-8'));
    });
  });
}

