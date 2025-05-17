const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// Swagger 정의
const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: '감정-지출 기록 API',
      version: '1.0.0',
      description: '사용자의 감정과 지출 정보를 기록하는 서비스의 백엔드 API',
    },
    servers: [
      {
        url: 'http://localhost:8000',
        description: '개발 서버',
      },
    ],
  },
  apis: ['./routes/*.js'], // routes 폴더 내의 모든 js 파일에서 JSDoc 주석을 찾습니다.
};

const specs = swaggerJsdoc(options);

module.exports = { specs, swaggerUi }; 