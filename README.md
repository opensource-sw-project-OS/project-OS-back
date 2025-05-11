# 영수증 OCR 백엔드 서비스

영수증을 OCR 기술로 인식하여 소비패턴을 파악하는 서비스의 백엔드 API 서버

## 기술 스택

- Node.js
- Express
- MySQL

## 시작하기

### 필수 조건

- Node.js (v14 이상)
- MySQL 서버

### 설치

1. 저장소를 클론합니다.
   ```
   git clone <저장소 URL>
   cd project-OS-back
   ```

2. 의존성 패키지를 설치합니다.
   ```
   npm install
   ```

3. 환경 변수를 설정합니다.
   ```
   PORT=3000
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=PASSWORD
   DB_NAME=receipts_app
   ```

4. 서버를 실행합니다.
   ```
   npm start
   ```

## 데이터베이스 구조

### receipts 테이블
- id: 영수증 고유 ID
- user_id: 사용자 ID
- date: 영수증 날짜
- total_amount: 총 금액
- created_at: 생성 시간
- updated_at: 수정 시간

### items 테이블
- id: 품목 고유 ID
- receipt_id: 영수증 ID (외래키)
- name: 품목명
- price: 가격
- quantity: 수량
- created_at: 생성 시간
- updated_at: 수정 시간
- category: 카테고리

## API 엔드포인트

### 영수증 API

- `GET /api/receipts`: 모든 영수증 조회
- `GET /api/receipts/:id`: 특정 영수증 조회
- `GET /api/receipts/date/:date`: 특정 날짜 이후의 영수증 조회
- `GET /api/receipts/amount/:amount`: 특정 금액 이상의 영수증 조회
- `POST /api/receipts`: 새 영수증 추가
- `PUT /api/receipts/:id`: 영수증 수정
- `DELETE /api/receipts/:id`: 영수증 삭제

### 품목 API

- `GET /api/items`: 모든 품목 조회
- `GET /api/items/:id`: 특정 품목 조회
- `GET /api/items/receipt/:receiptId`: 특정 영수증의 모든 품목 조회
- `GET /api/items/price/:price`: 특정 가격 이상의 품목 조회
- `GET /api/items/category/:category`: 특정 카테고리의 품목 조회
- `GET /api/items/name/:name`: 특정 이름을 가진 품목 조회 (부분 일치)
- `GET /api/items/created-after/:date`: 특정 날짜 이후 생성된 품목 조회
- `POST /api/items`: 새 품목 추가
- `POST /api/items/batch`: 여러 품목 한번에 추가
- `PUT /api/items/:id`: 품목 수정
- `DELETE /api/items/:id`: 품목 삭제
- `DELETE /api/items/receipt/:receiptId`: 특정 영수증의 모든 품목 삭제

### 통계 API

- `GET /api/stats/category`: 카테고리별 지출 통계
  - 쿼리 파라미터: startDate, endDate, userId
- `GET /api/stats/time`: 시간별 지출 통계
  - 쿼리 파라미터: groupBy (day, month, year), startDate, endDate, userId
- `GET /api/stats/top-items`: 가장 많이 구매한 품목 통계
  - 쿼리 파라미터: limit, startDate, endDate, userId
- `GET /api/stats/average`: 평균 지출 통계
  - 쿼리 파라미터: groupBy (day, month, category), startDate, endDate, userId

# project-OS-back
---
## 박지성 
### 📃 담당한 part
- 제가 담당한 부분은 백엔드로 들어오는 입력을 분석하여 DB에 저장 가능한 형태로 만드는 것입니다.
- 들어오는 입력은 "영수증" 혹은 "휴대폰 화면의 캡쳐사진"으로 가정한 상태입니다.
- 분석 결과는 { 'date' : '날짜' , 'items' : '산 품목들' , 'consume' : '총 지출' }
로 출력하기로 임의로 설정했습니다.

### 🚀 마지막 진행 현황
- 템플릿 및 md 파일 수정

### 📊 단계별 체크리스트
- [ ] 1단계: 표본 영수증 사진 및 캡쳐 사진 확보 및 OCR 분석 테스트
- [ ] 2단계: OCR 분석 결과 전처리 1 - 여러 품목 인식
- [ ] 3단계: OCR 분석 결과 전처리 2 - 각 품목 별 가격 및 총 지출 분석
- [ ] 4단계: OCR 분석 결과 전처리 3 - [ 날짜, 결재 품목, 총 지출 ] 3가지 추출 테스트
- [ ] 5단계: OCR 분석 결과를 정해진 형식으로 출력
- [ ] 6단계: DB와 연동 및 전송 테스트
- [ ] 7단계: 프론트 엔드와 연동 및 이미지 전송 테스트

- [ ] 8단계: 여러 입력 형태에 따른 DB 저장 구현 - 이미지, 일반 텍스트 등
- [ ] 9단계: 사용자 감정 감정 분석 테스트
- [ ] _여유가 있을 시 추가 발전 사항 추가_

### ✅ 현재 진행률

<div>
  <progress value="0" max="7"></progress> <b>0%</b>
</div>

---
