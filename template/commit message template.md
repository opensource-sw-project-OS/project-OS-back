# ✏️ Git 커밋 메시지 작성 템플릿 & 가이드라인

> ⛔ 현재 프로젝트는 GitHub Issue를 다루지 않음  
> (자동 issue 닫기 등은 추후 도입 가능)

---

## 커밋 메시지 템플릿

```txt
# ====================================
# 💬 커밋 메시지 작성 템플릿 (지침은 주석으로 표시됨)
# ====================================

# 제목 (50자 이내, 한 줄 요약)
# 예시: feat: 사용자 로그인 기능 추가
<type>: <작업 요약>

# 본문 (선택사항, 72자 줄바꿈 권장)
# - 무엇을, 왜 했는가?
# - 어떻게 해결했는가?
# - 참고한 배경 정보는?
# 예시:
# - JWT 토큰 방식으로 로그인 구현
# - 로그인 실패 시 서버 에러 해결 포함
#
# 본문은 필요 시 빈 줄 두고 작성

# 꼬리말 (선택사항, 협업 시 사용)
# 예시:
# Co-authored-by: 홍길동 32######
```

---

## 🧱 커밋 메시지 유형 (Conventional Commits 기반)

| 타입(type)   | 설명                 | 예시                             |
| ---------- | ------------------ | ------------------------------ |
| `feat`     | 새로운 기능 추가          | `feat: 영수증 이미지 업로드 기능 구현`      |
| `fix`      | 버그 수정              | `fix: 서버에서 잘못된 요청 시 500 오류 해결` |
| `refactor` | 리팩토링 (기능 변화 없음)    | `refactor: 로그인 로직 정리`          |
| `docs`     | 문서 관련 변경           | `docs: README에 설치 방법 추가`       |
| `test`     | 테스트 코드 추가/수정       | `test: 결제 API 단위 테스트 작성`       |
| `style`    | 코드 포맷팅, 공백, 세미콜론 등 | `style: prettier 적용`           |
| `chore`    | 빌드 설정, 패키지 관리 등 잡무 | `chore: npm 패키지 업데이트`          |

---

## ✅ 커밋 예시

### ✔️ 기능 추가

```bash
feat: 이미지 업로드 기능 구현

- multer를 이용한 파일 업로드 처리
- 저장 경로 설정 및 예외 처리 포함
```

### 🐞 버그 수정

```bash
fix: 회원가입 중복 이메일 오류 해결

- DB where 조건 누락 수정
- 관련 에러 메시지도 수정
```

### 🤝 협업 커밋

```bash
feat: 관리자 대시보드 초기 레이아웃 구현

- 관리자 목록, 차트 통계 화면 작성
- Co-authored-by: 홍길동 32######
```

## ? 참고

* 제목은 반드시 한 줄 요약으로 작성
* 본문은 선택 사항이며, 기능이나 변경 이유를 명확히 쓰는 것이 좋음
* 협업 시 `Co-authored-by`를 작성하면 GitHub에서 공동기여자로 인식됨

```
