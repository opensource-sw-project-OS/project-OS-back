## 🔹 1. `/api/signup` – 회원가입

### ✅ 서버 동작 흐름

* 요청 본문에서 `Userid`와 `Userpassword`를 추출.
* DB에 중복 사용자 확인 → 없으면 신규 사용자 생성.
* 암호는 해싱하여 저장.
* 중복 시 `err: "중복 사용자"` 반환.

### ✅ 클라이언트 코드 예시

```javascript
const signup = await RestAPI.signup({
  Userid: "testuser",
  Userpassword: "1234"
});
```

### ✅ 응답 예시

```json
//signup.err로 확인
{
  err: null
}
```

---

## 🔹 2. `/api/login` – 로그인 (JWT 발급)

### ✅ 서버 동작 흐름

* 요청 본문에서 사용자 ID와 비밀번호 추출.
* DB에서 사용자 존재 여부 및 비밀번호 검증.
* 성공 시 JWT 토큰 생성 (`jwt.sign(payload, JWT_SECRET, options)`)
* 토큰은 사용자 ID를 포함한 payload를 담고, 서명됨.
* 클라이언트에 JSON 형식으로 응답.

### ✅ 클라이언트 처리 흐름

* 응답받은 토큰을 `user_token` 변수에 저장.
* 이후 API 요청 시 HTTP 헤더에 다음과 같이 첨부:

  ```http
  Authorization: Bearer <토큰값>
  ```

### ✅ 클라이언트 코드 예시

```javascript
const result = await RestAPI.login({
  Userid: "testuser",
  Userpassword: "1234"
});

user_token = result.token;
```

### ✅ 응답 예시

```json
{
  err: null,
  token: "<JWT Token>"
  Userid : user.user_id
}
```

---

## 🔹 3. `/api/data` – 감정 기반 소비 기록 저장

### ✅ 서버 동작 흐름

1. `authenticateToken` 미들웨어를 통해 JWT 토큰 인증 수행.

   * `Authorization` 헤더에서 토큰 추출.
   * 유효한 토큰이면 payload를 복호화하여 `req.user`에 저장.
2. 클라이언트는 `{ date, category, total, emotion_string }` POST 요청 본문 전송.
3. 감정 분석 함수(`emo_analy()`)와 위로 문장 생성(`emo_string()`) 실행.
4. 해당 정보를 DB에 저장.
5. 응답 JSON으로 위로 문장을 포함해 전송.

### ✅ 클라이언트 코드 예시

```javascript
await RestAPI.Post('/data', {
  date: "2025-05-31",
  category: "식비",
  total: 12000,
  emotion_string: "기분이 우울했어요"
});
```

### ✅ 응답 예시

```json
{
  "err": null,
  "emotion_response": "많이 힘드셨겠어요. 그래도 잘 이겨내고 계신 거예요."
}
```

---

# 📥 GET 요청 라우트 정리

---

## 🔹 1. `/api/graph/emotion` – 감정별 총 지출

### ✅ 서버 동작 흐름

1. `authenticateToken`으로 인증 후 `req.user.Userid` 확보.
2. `getThisMonthRange()`로 이번 달 시작/끝 날짜 계산.
3. DB에서 감정별 지출 합계 조회.
4. 결과를 `.map()`으로 `{ emotion, total }` 구조로 변환.

### ✅ 클라이언트 코드 예시

```javascript
const result = await RestAPI.Get('/graph/emotion');
const labels = result.map(d => d.emotion);
const values = result.map(d => d.total);
// drawChart(labels, values);
```

### ✅ 응답 예시

```json
[
  { "emotion": "happy", "total": 12500 },
  { "emotion": "sad", "total": 4300 }
]
```

---

## 🔹 2. `/api/graph/category` – 카테고리별 총 지출

### ✅ 서버 동작 흐름

1. JWT 인증 → 사용자 ID 확보.
2. 월간 날짜 범위 설정.
3. DB에서 `category`별 총액 집계.
4. `{ category, total }` 형태로 응답.

### ✅ 클라이언트 코드 예시

```javascript
const result = await RestAPI.Get('/graph/category');
const labels = result.map(d => d.category);
const values = result.map(d => d.total);
// drawCategoryChart(labels, values);
```

---

## 🔹 3. `/api/graph/daily` – 일별 감정/지출 조회

### ✅ 서버 동작 흐름

1. JWT 인증 → 사용자 ID 확인.
2. 월간 날짜 범위 설정.
3. 감정 및 날짜별로 총액을 집계.
4. `{ date, emotion, total }` 형태로 반환.

### ✅ 클라이언트 코드 예시

```javascript
const result = await RestAPI.Get('/graph/daily');
const labels = result.map(d => d.date);
const values = result.map(d => d.total);
// drawDailyChart(labels, values);
```

---

# 🔁 map() 함수의 역할 요약

* 배열 내 객체들을 특정 키와 형식으로 **가공/변환**할 때 사용.
* 반환 예시:

```
rows.map(row => ({
  emotion: row.emotion_type,
  total: Number(row.total_spent)
}));
```

* Chart.js 또는 기타 시각화 도구에서 사용하기 쉽게 데이터를 재구성.

---

# 🔐 JWT 토큰 인증 원리 요약

### ✅ 발급 단계 (서버 `/login`)

* 로그인 성공 시 `jsonwebtoken.sign()`으로 사용자 정보를 담아 토큰 생성.
* 토큰에는 사용자 ID 등 식별 가능한 정보가 payload로 포함됨.

### ✅ 클라이언트 사용 방식

* 이후 모든 요청에 `Authorization: Bearer <token>` 형식으로 토큰 전달.

### ✅ 서버 검증 방식

* `authenticateToken` 미들웨어 실행:

  1. 헤더에서 토큰 추출.
  2. `jsonwebtoken.verify()`로 서명 및 유효기간 검증.
  3. 검증 성공 시 사용자 정보를 `req.user`에 저장하여 다음 단계로 전달.

### ✅ 보안상 유의사항

* HTTPS 사용을 전제로 해야 토큰 탈취를 방지 가능.
* 클라이언트에서 토큰은 브라우저 저장소(localStorage 등)에 안전하게 저장해야 함.

---

# 🔐 JWT 인증 흐름 상세 설명

## 1️⃣ 토큰 생성 (로그인 단계)

* 사용자가 `/api/login` 경로로 ID와 비밀번호를 POST 전송하면, 서버는 다음과 같이 처리:

  1. DB에서 해당 사용자 조회
  2. 비밀번호 검증 (해싱 비교)
  3. 일치 시 JWT 생성:

     ```javascript
     const token = jwt.sign({ Userid }, JWT_SECRET, { expiresIn: '1h' });
     ```
  4. 생성된 토큰은 클라이언트에 다음과 같이 JSON으로 응답됨:

     ```json
     { "token": "..." }
     ```

## 2️⃣ 클라이언트 저장 및 사용

* 클라이언트는 응답에서 받은 토큰을 전역 변수 `user_token` 등에 저장함.
* 이후 모든 `GET`, `POST` 요청 시 HTTP 헤더에 다음과 같이 포함:

  ```http
  Authorization: Bearer <JWT Token>
  ```
* 예시 (fetch 기반):

  ```javascript
  fetch('/api/graph/emotion', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${user_token}`
    }
  });
  ```

## 3️⃣ 서버 측 토큰 검증

* `authenticateToken` 미들웨어에서 다음과 같이 토큰 처리:

  1. 요청 헤더의 Authorization 필드에서 Bearer 토큰 추출
  2. `jwt.verify()`를 통해 유효성, 서명 확인
  3. 통과 시, 토큰 payload를 `req.user`에 할당하여 다음 로직에서 사용 가능
* 예:

  ```javascript
  function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (err) return res.sendStatus(403);
      req.user = user;
      next();
    });
  }
  ```

## 4️⃣ 요청 라우트에서 사용 예시

* 인증된 사용자 ID를 기준으로 데이터 쿼리 등 진행:

  ```javascript
  app.get('/api/graph/emotion', authenticateToken, async (req, res) => {
    const userId = req.user.Userid;
    // 이후 DB 쿼리에 userId 사용
  });
  ```

