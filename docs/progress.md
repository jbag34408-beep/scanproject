# 작업 현황 (2026-10-18 저녁 기준)

다음 세션에서 이 파일부터 읽고 이어서 작업한다. 최신 커밋: `33cdff8` (main, GitHub `jbag34408-beep/scanproject`)
작업 브랜치 `feat/case-status-statement` (main에 아직 병합 안 함): 상태 기록·은행 안내·PC 레이아웃·이의제기 신청서

## 1. 서비스 한 줄 요약
**핵심 기능은 두 가지**: ① 이의제기(법정 서식 신청서) ② **채무부존재확인 소송**을 누구나 이해하게 설명하고, 개인이 직접 소장을 쓰고 점검하게 돕기 (사용자 지시, 2026-10-18)
핑돈(통장묶기) 피해자가 지급정지 일부해제 이의제기를 스스로 준비하도록 돕는 웹 서비스.
정보 제공 + 본인이 입력해 만드는 서류 도구만 제공하고, **법률 판단·대리 제출은 하지 않는다.**

## 2. 구성
| 영역 | 위치 | 스택 |
|---|---|---|
| 백엔드 | 저장소 루트 (`src/`) | Java 21, Spring Boot 3.5.16, Gradle 8.14.3(Kotlin DSL), PostgreSQL 16, Flyway, 세션 인증 |
| 프론트 | `web/` | Vite 8 + React 19 + TS + Tailwind v4 + shadcn(base-nova), Noto Sans KR |
| 디자인 | Figma https://www.figma.com/design/rH780KfFYjto7IZfxox1Dr | Screens 페이지 8개 화면(07 Checklist, 08 My Cases 추가), Components 페이지 11개 컴포넌트(`CheckItem` 추가), `tokens` 변수 |
| CI | `.github/workflows/ci.yml` | `test`(gradlew test, Testcontainers) + `web`(npm ci·lint·build) |

### 백엔드 패키지
- `global/` 공통: `SecurityConfig`(쿠키 CSRF, 세션), `AesEncryptor`(AES-256-GCM), `GlobalExceptionHandler`, `ApiResponse{data,error}`, `MaskingPatternLayout`(로그 마스킹)
- `user/` 회원가입·로그인·로그아웃·me, `LoginAttemptTracker`(5회 실패 15분 잠금, 메모리)
- `bank/` 은행 목록(시드 5개, V4에서 대표번호·홈페이지·접수 창구 채움)
- `cases/` 사건 CRUD(소유자만, 남의 사건은 404), 계좌번호 암호화 + `accountLast4`
- `diagnosis/` 진단 규칙 `DiagnosisRules`(버전 `2026-10-v2`), 진단 이력 jsonb 저장
- `checklist/` 최신 진단의 할 일·서류로 체크리스트 구성, 체크 상태만 저장
- `draft/` 이의제기 신청서·소장 작성 중 내용 임시저장. 내용(JSON)을 통째로 AES 암호화, 마지막 수정 후 **90일 지나면 매일 04시 배치로 삭제**(`@Scheduled`), 사용자가 직접 지울 수도 있음
- `lawsuit/` 채무부존재확인 소송 진행 기록(사건당 1개, PUT = 통째로 교체). 소 제기일을 넣으면 사건 상태 `LAWSUIT`

### Flyway
V1 users/banks/cases · V2 diagnoses · V3 checklist_checks · V4 은행 안내 데이터 · V5 document_drafts · V6 lawsuits

### 사건 상태 흐름
`DRAFT` → (진단) `DIAGNOSED` → (첫 체크) `PREPARING` → (내 사건 목록 버튼) `SUBMITTED` → (소송 기록에 소 제기일) `LAWSUIT` → `PARTIAL_RELEASED` → `CLOSED`
- 제출·결과 기록은 기존 `PATCH /cases/{id}` `{status}`를 그대로 쓴다. 서버는 전이 순서를 검사하지 않는다.

### API (`/api/v1`)
- auth: `GET csrf`, `POST signup|login|logout`, `GET me`
- `GET banks` (비로그인 허용)
- cases: `POST/GET /cases`, `GET/PATCH /cases/{id}`
- `POST /cases/{id}/diagnoses`, `GET /cases/{id}/diagnoses/latest`
- `GET/PUT /cases/{id}/checklist` (PUT body `{key, checked}`)
- `GET/PUT/DELETE /cases/{id}/drafts/{OBJECTION|COMPLAINT}` (PUT body `{content}` 최대 2만 자, 없으면 data null)
- `GET/PUT /cases/{id}/lawsuit`

### 프론트 화면 (해시 라우팅 `web/src/lib/router.ts`)
`/` 랜딩(arrow-cta 화살표) · `/login` · `/signup` · `/cases` 내 사건(로그아웃, 제출·결과 기록 버튼) · `/cases/new` · `/cases/:id/diagnosis` 질문 14개 · `/cases/:id/result` · `/cases/:id/checklist`(은행 안내 카드) · `/cases/:id/objection` 이의제기 신청서 · `/lawsuit` 소송 안내(비로그인) · `/cases/:id/complaint` 채무부존재확인 소장 · `/cases/:id/lawsuit` 소송 진행 관리
- 소송 안내(`lawsuit-guide.tsx`): 법 조문 3개(통신사기피해환급법 제4조의2②, 제5조①5호, 제8조②1의2, 2026.10.2 시행본), 주의(피해금이면 부당이득 반환의무 가능·입증책임·각하), 6단계, 비용 계산기, 용어 풀이
- 소장(`complaint.tsx`): 원고·피고·법원·금액·전부/일부 부존재·경위·채무 없는 사정·소 제기 이유(기본 문구)·증거(갑 제n호증) → A4 소장. 제출 전 점검표(필수/경고). 서버 저장 안 함
- 비용(`lib/lawsuit.ts`, 테스트 `web/test/lawsuit.test.ts`, `npm test`, CI 포함): 인지액 = 민사소송 등 인지법 구간 요율, 송달료 = 당사자 수 × 15회 × 5,500원. **채무부존재확인은 확인의 소라 소액사건이 아님**(소액은 지급청구만)
- 진단 규칙 `2026-10-v3`: 질문 `objectionStatus`(NOT_FILED/PENDING/REJECTED) 추가. REJECTED, 또는 PENDING이면서 묶인 금액 > 입금액이면 `LAWSUIT_REVIEW` 경로 + "채무부존재확인 소송 검토" 단계 → 결과 화면에서 소송 안내·소장 작성으로 연결
- 서류 자동저장(`lib/draft.ts` `useDraft`, `components/draft-bar.tsx`): 1.5초 뒤 저장, 처음에 저장본 복원
- 소송 진행(`lib/lawsuit.ts` `lawsuitSteps`): 소장 제출 → 소제기증명원 은행 제출(빠뜨리면 '빨리 해야 해요') → 변론기일 D-day → 항소 기한(판결정본 받은 날 + 14일, 민사소송법 제396조, 7일 이내면 강조) → 확정 후 은행 해제 요청
- 레이아웃: 모바일은 `max-w-md` 한 줄, `md:`(768px+)부터 앱 화면 `max-w-3xl`, 로그인·가입은 테두리 카드 `max-w-lg`, 내 사건 2열, 이의제기 신청서는 입력·미리보기 좌우 배치(`max-w-5xl`)
- 이의제기 신청서(진술서를 대체): 통신사기피해환급법 시행령 **[별지 제4호서식]**을 그대로 채운다. 은행 창구 양식도 이 법정 서식이고(하나은행 PDF로 확인) 은행마다 "○○○ 금융회사 귀하"만 다르다 → 사건 은행명으로 채움. 사유란 = 사건 입금·지급정지 정보 + 시간순 경위 + 요청 사항. `@page A4`, `window.print()`로 PDF. **서버에 저장하지 않는다**(전체 계좌번호·주소 등 민감 정보). 은행 로고는 넣지 않음

## 3. 실행 방법
```bash
cp .env.example .env            # UNFREEZE_CRYPTO_KEY= 에 `openssl rand -base64 32` 결과 넣기
docker compose up -d
export GRADLE_USER_HOME=D:/dev-cache/gradle   # 이 PC는 Gradle 캐시가 D:에 있음(아래 6번)
./gradlew test
./gradlew bootRun --args='--spring.profiles.active=local'    # :8080
cd web && npm install && npm run dev                         # :5173 (/api → 8080 프록시)
```
- 이 PC에선 5173을 다른 프로그램이 쓰고 있어 `npx vite --port 5174`로 띄웠다.
- Vite 실행 중에는 `npm ci`가 EPERM으로 실패한다(Windows 파일 잠금) → dev 서버를 끄고 실행.

## 4. 정해진 결정 (다시 묻지 않기)
- JWT 쓰지 않음, 세션 + `CookieCsrfTokenRepository`(XSRF-TOKEN 쿠키 → X-XSRF-TOKEN 헤더)
- 응답에 계좌번호 원문 금지, 로그·toString에 민감정보 금지
- 진단은 판정이 아니라 "해당될 수 있는 절차·준비물·주의사항". AI 없이 규칙으로만, 같은 입력 = 같은 결과
- 계좌 양도·코인/환전 대금(EXCHANGE)은 셀프 진행 안내 없이 전문가 상담만
- 진단 규칙 근거: 사용자가 준 "핑돈 해결법 정리(2026-10-18)". 공식 근거 없는 커뮤니티 정보(90일 자동 해제 등)는 넣지 않음
- 응답·설명은 한국어(`CLAUDE.md`)
- shadcn v4는 `cn`을 공식 패키지 `cn`에서 가져온다(`src/lib/utils.ts`가 재수출). 잘못된 게 아님

## 5. 남은 일
### 다음 후보
- 항소 기한·변론기일 알림(이메일/문자) — 지금은 화면에서만 D-day 표시
- 공휴일 반영한 기한 계산(지금은 "공휴일이면 다음 날" 문구로만 안내)
- 제출일·접수번호 기록(지금은 상태만 바뀌고 날짜는 `updatedAt`뿐)
- 은행 5곳 외 추가, 은행별 실제 이의제기 절차 안내
- Figma에 이의제기 신청서 화면 추가, 서류 항목의 배지를 CheckItem 안으로(코드와 배치 다름)

### 출시 전 반드시
- **소송 안내·소장 기본 문구 법률 검토**(청구취지 표현, 전부/일부 부존재 선택, 소제기증명원·판결 후 해제 절차 설명). 송달료 1회분 금액(5,500원 vs 2026.7 인상설 5,640원) 확인
- **변호사법 검토**: 서류 작성 도구가 '법률사무 취급·문서 작성 대행'(변호사법 제109조)으로 보이지 않는지. 지금은 사용자가 직접 입력한 내용만 서식에 옮김
- 이용약관·개인정보처리방침·수집 동의, 보관기간·파기, 회원 탈퇴
- HTTPS·HSTS·보안 헤더(CSP), 세션 쿠키 Secure·SameSite, 세션 저장소 Redis(다중 서버)
- 비밀번호 재설정·이메일 인증, 가입·로그인 API rate limit
- 의존성 취약점 스캔(Dependabot), DB 백업, 에러 모니터링·알림
- 진단 문구·규칙 법률 전문가 검토 (`DiagnosisRules` TODO)
- V4 은행 대표번호·홈페이지는 공식 출처로 확인 못 함(검색 실패, 알려진 번호로 넣음) → 출시 전 각 은행 공식 안내로 확인
- `diagnoses.answers` jsonb에 계좌 양도 여부 등 민감 답변이 평문 저장됨 → 암호화 또는 미저장 결정
- 로그인 잠금 메모리 저장 → 다중 서버 전 Redis로
- 암호화 키 버전 없음(키 교체 어려움), 회원 탈퇴·보관기간 정책 없음, 회원가입 rate limit 없음

### 알려진 한계
- PATCH에서 null은 "변경 없음"이라 값을 비울 수 없음
- 로그 마스킹은 하이픈 없는 10~16자리 숫자·`01x-xxxx-xxxx`만
- 체크리스트 할 일 항목 키가 제목 기반 → 규칙 문구가 바뀌면 이전 체크가 이어지지 않음
- 새 알림 색 토큰(urgent/warning/info/success)은 다크 모드 값 없음
- 랜딩 점선 화살표(`arrow-cta.tsx`)는 내용 뒤(`-z-10`)에 그리고 마우스가 창을 벗어나면 지운다. 제목·설명에 `bg-background`를 줘서 화살표가 글자를 가리지 않음
- 캡처를 Playwright 자동화 창("자동화 플래그" 경고가 뜨는 창)으로 보면 뷰포트가 고정돼 화면이 잘려 보인다 → 일반 Chrome에서 확인
- 받은 `demo.tsx`는 넣지 않음(데모 컴포넌트는 `arrow-cta.tsx`에 그대로 있음)

## 6. 이 PC 환경 메모
- **C: 드라이브가 거의 꽉 찼었다**(0GB → 정리 후 약 10GB). npm 캐시 → `D:\dev-cache\npm-cache`, Gradle 홈 → `D:\dev-cache\gradle`(사용자 환경변수 `GRADLE_USER_HOME`)
- Docker Desktop 실행 파일: `C:\Users\kkk\AppData\Local\Programs\DockerDesktop\Docker Desktop.exe` (꺼져 있으면 테스트 15개가 Docker 없음으로 실패)
- 저장소 루트의 `bin/`은 IDE(Java 확장) 빌드 산출물로 보임 — 커밋하지 말 것
- 디스크가 찬 뒤 Docker 데몬이 응답 없음 → Docker Desktop 재시작 + `wsl --shutdown`으로 해결
- 바탕화면을 D:로 옮겼다가 탐색기 문제로 **원래대로 되돌림**. 탐색기(작업 표시줄)가 안 보이면 재부팅 또는 Ctrl+Shift+Esc → 새 작업 실행 → `explorer.exe`
- 사용자 답변 대기 중인 C: 정리: 안전 삭제 4건(Temp, AzureFunctionsTools, puccinialin, Postman 0.5.1 — 약 2.2GB), 최대 절전 끄기(6.4GB), WSL Ubuntu D: 이동(4.6GB), Roblox·VS Code(종료 후 이동 가능). **시스템 폴더 변경·탐색기 재시작은 항목별로 따로 확인받을 것**
