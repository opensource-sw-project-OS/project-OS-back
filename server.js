const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { specs, swaggerUi } = require('./swagger');

// 라우터 불러오기
const usersRouter = require('./routes/users');
const receiptsRouter = require('./routes/receipts');

// 환경변수 설정
dotenv.config();

const app = express();
// 명시적으로 포트 8000 사용
const PORT = 8000;

// 미들웨어 설정
app.use(cors());
app.use(express.json());

// Swagger 설정
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, { explorer: true }));

// 라우터 설정
app.use('/api/users', usersRouter);
app.use('/api/receipts', receiptsRouter);

// 기본 라우터
app.get('/', (req, res) => {
  res.send('OS 프로젝트 API 서버');
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`);
  console.log(`Swagger 문서는 http://localhost:${PORT}/api-docs 에서 확인할 수 있습니다.`);
}); 