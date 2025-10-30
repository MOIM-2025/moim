# AI Agent Guidelines - MOIM Project

이 문서는 AI 에이전트가 MOIM 프로젝트에서 코드를 작성하고 수정할 때 따라야 할 가이드라인입니다.

## 📋 목차

- [전체 원칙](#전체-원칙)
- [작업 프로세스](#작업-프로세스)
- [코드 품질 기준](#코드-품질-기준)
- [테스트 가이드라인](#테스트-가이드라인)
- [커밋 및 PR 가이드라인](#커밋-및-pr-가이드라인)
- [프로젝트 특화 가이드](#프로젝트-특화-가이드)

## 전체 원칙

### 1. 클린 코드 작성

- **SOLID 원칙 준수**: 단일 책임, 개방-폐쇄, 리스코프 치환, 인터페이스 분리, 의존성 역전
- **DRY (Don't Repeat Yourself)**: 중복 코드 최소화, 재사용 가능한 유틸리티/컴포넌트 작성
- **KISS (Keep It Simple, Stupid)**: 불필요한 복잡성 제거, 간결하고 명확한 코드
- **YAGNI (You Aren't Gonna Need It)**: 현재 필요한 기능만 구현

### 2. 코드 가독성

- **명확한 네이밍**: 변수, 함수, 클래스명은 의도를 명확히 드러내야 함
  ```typescript
  // ❌ Bad
  const d = new Date();
  const fetch = () => {};

  // ✅ Good
  const currentDate = new Date();
  const fetchUserData = () => {};
  ```

- **함수는 단일 책임**: 하나의 함수는 하나의 일만 수행
  ```typescript
  // ❌ Bad
  function processUserAndSendEmail(user) {
    validateUser(user);
    saveUser(user);
    sendWelcomeEmail(user);
  }

  // ✅ Good
  function processUser(user) {
    validateUser(user);
    saveUser(user);
  }

  function sendWelcomeEmail(user) {
    // email logic
  }
  ```

- **적절한 주석**: 코드가 설명이 안 되는 복잡한 로직에만 주석 추가
  ```typescript
  // ❌ Bad - 불필요한 주석
  // 사용자 이름을 가져옴
  const name = user.name;

  // ✅ Good - 필요한 주석
  // ISO 8601 형식을 KST 시간대로 변환 (서버는 UTC 저장)
  const localTime = convertToKST(isoString);
  ```

### 3. 타입 안정성

- **TypeScript 엄격 모드 사용**: `strict: true` 설정 준수
- **any 타입 금지**: 불가피한 경우 `unknown` 사용 후 타입 가드 적용
- **타입 정의 우선**: API 응답, Props 등 모든 데이터 구조에 타입 정의

```typescript
// ❌ Bad
function processData(data: any) {
  return data.map((item: any) => item.value);
}

// ✅ Good
interface DataItem {
  id: number;
  value: string;
}

function processData(data: DataItem[]): string[] {
  return data.map(item => item.value);
}
```

## 작업 프로세스

### 단계 1: 요구사항 분석 및 계획

1. **요구사항 명확화**
   - 구현해야 할 기능의 목적과 범위 파악
   - 불명확한 부분은 질문하여 명확히 함
   - 예상되는 엣지 케이스 식별

2. **영향 범위 분석**
   - 수정이 필요한 파일 목록 작성
   - 기존 코드와의 의존성 확인
   - Breaking change 여부 확인

3. **작업 계획 수립**
   ```markdown
   ## 작업 계획
   1. [ ] 타입 정의 추가/수정
   2. [ ] 핵심 로직 구현
   3. [ ] 유틸리티/헬퍼 함수 작성
   4. [ ] 에러 핸들링 추가
   5. [ ] 테스트 코드 작성
   6. [ ] 문서 업데이트
   ```

### 단계 2: 코드 구현

1. **타입부터 정의**
   - 인터페이스, 타입, DTO 먼저 작성
   - API 계약(Contract) 명확히 정의

2. **작은 단위로 구현**
   - 한 번에 하나의 기능만 구현
   - 각 커밋은 독립적으로 동작 가능해야 함

3. **에러 핸들링**
   - 예상 가능한 모든 에러 케이스 처리
   - 사용자 친화적인 에러 메시지 제공
   ```typescript
   // ✅ Good
   try {
     const result = await fetchData();
     return result;
   } catch (error) {
     if (error instanceof NetworkError) {
       throw new Error('네트워크 연결을 확인해주세요.');
     }
     if (error instanceof ValidationError) {
       throw new Error('입력값이 올바르지 않습니다.');
     }
     throw new Error('알 수 없는 오류가 발생했습니다.');
   }
   ```

### 단계 3: 테스트 작성

**반드시 다음 순서로 테스트 작성:**

1. **단위 테스트 (Unit Test)**
   - 개별 함수/메서드의 동작 검증
   - 모든 분기(branch) 커버
   - 엣지 케이스 테스트

2. **통합 테스트 (Integration Test)**
   - 여러 모듈 간의 상호작용 검증
   - API 엔드포인트 테스트 (백엔드)
   - 컴포넌트 통합 테스트 (프론트엔드)

3. **E2E 테스트 (필요시)**
   - 사용자 시나리오 기반 테스트
   - 중요한 사용자 플로우만 선택적으로 작성

### 단계 4: 코드 리뷰 전 체크리스트

- [ ] 모든 테스트 통과 (`pnpm test`)
- [ ] 린트 에러 없음 (`pnpm lint`)
- [ ] 타입 체크 통과 (`pnpm check-types`)
- [ ] 빌드 성공 (`pnpm build`)
- [ ] 불필요한 console.log, 주석 제거
- [ ] 코드 포맷팅 적용 (Prettier)
- [ ] TODO 주석 처리 완료 또는 이슈 등록

### 단계 5: 문서화

1. **코드 내 문서화**
   - JSDoc 주석으로 공개 API 문서화
   - 복잡한 알고리즘은 설명 추가

2. **README 업데이트**
   - 새로운 기능 추가 시 사용법 문서화
   - 환경 변수 변경 시 문서 업데이트

## 코드 품질 기준

### 1. 함수/메서드 작성 규칙

- **함수 길이**: 최대 50줄 이내 (이상적으로는 20줄 이내)
- **파라미터 개수**: 최대 3개 (초과 시 객체로 묶기)
- **중첩 깊이**: 최대 3단계 (early return 활용)

```typescript
// ❌ Bad - 깊은 중첩
function processUser(user) {
  if (user) {
    if (user.isActive) {
      if (user.email) {
        sendEmail(user.email);
      }
    }
  }
}

// ✅ Good - Early return
function processUser(user) {
  if (!user) return;
  if (!user.isActive) return;
  if (!user.email) return;

  sendEmail(user.email);
}
```

### 2. 파일 구조

- **파일 크기**: 최대 300줄 이내
- **단일 책임**: 하나의 파일은 하나의 관심사만 다룸
- **명확한 폴더 구조**: 기능별/도메인별 구조화

### 3. 의존성 관리

- **순환 의존성 금지**: 모듈 간 순환 참조 제거
- **최소 의존성**: 꼭 필요한 라이브러리만 사용
- **버전 고정**: package.json에서 정확한 버전 명시

## 테스트 가이드라인

### 1. 테스트 작성 원칙

- **AAA 패턴 준수**: Arrange(준비), Act(실행), Assert(검증)
- **독립성**: 각 테스트는 독립적으로 실행 가능해야 함
- **반복성**: 동일한 입력에 동일한 결과
- **명확한 테스트명**: 무엇을 테스트하는지 이름으로 알 수 있어야 함

```typescript
// ✅ Good
describe('UserService', () => {
  describe('createUser', () => {
    it('should create a new user with valid data', async () => {
      // Arrange
      const userData = { name: 'John', email: 'john@example.com' };

      // Act
      const result = await userService.createUser(userData);

      // Assert
      expect(result).toBeDefined();
      expect(result.name).toBe('John');
      expect(result.email).toBe('john@example.com');
    });

    it('should throw an error when email is invalid', async () => {
      // Arrange
      const userData = { name: 'John', email: 'invalid-email' };

      // Act & Assert
      await expect(userService.createUser(userData))
        .rejects.toThrow('Invalid email format');
    });
  });
});
```

### 2. 테스트 커버리지 목표

- **전체 라인 커버리지**: 최소 80%
- **분기 커버리지**: 최소 75%
- **중요 비즈니스 로직**: 100% 커버

### 3. 테스트 우선순위

1. **High Priority**
   - 비즈니스 로직
   - 인증/인가 관련 코드
   - 데이터 검증 로직
   - API 엔드포인트

2. **Medium Priority**
   - 유틸리티 함수
   - 데이터 변환 로직
   - UI 컴포넌트 로직

3. **Low Priority**
   - 단순 getter/setter
   - 상수 정의
   - 타입 정의

### 4. Mock 사용 가이드

- **외부 의존성만 Mock**: DB, API, 파일 시스템 등
- **과도한 Mock 지양**: 너무 많은 Mock은 테스트 신뢰도 저하
- **실제와 유사한 Mock 데이터**: 현실적인 테스트 데이터 사용

## 커밋 및 PR 가이드라인

### 1. 커밋 메시지 규칙

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Type:**
- `feat`: 새로운 기능
- `fix`: 버그 수정
- `refactor`: 코드 리팩토링
- `test`: 테스트 추가/수정
- `docs`: 문서 수정
- `style`: 코드 포맷팅 (기능 변경 없음)
- `chore`: 빌드, 설정 파일 수정

**예시:**
```
feat(auth): add JWT token refresh logic

- Implement token refresh endpoint
- Add refresh token to user entity
- Update authentication guard to handle token refresh

Resolves: #123
```

### 2. Pull Request 작성

**PR 제목:**
```
[Type] Brief description of changes
```

**PR 설명 템플릿:**
```markdown
## 📝 변경 사항
- 구현한 기능/수정 내용 요약

## 🎯 목적
- 왜 이 변경이 필요한가?

## 🔍 테스트 방법
1. 테스트 시나리오 1
2. 테스트 시나리오 2

## 📸 스크린샷 (UI 변경 시)
- Before/After 스크린샷

## ✅ 체크리스트
- [ ] 테스트 추가/업데이트
- [ ] 문서 업데이트
- [ ] Breaking change 여부 확인
- [ ] 린트 통과
- [ ] 빌드 성공
```

## 프로젝트 특화 가이드

### 1. Monorepo 구조

```
moim/
├── apps/
│   ├── backend/        # NestJS 백엔드
│   └── mobile/         # React Native 모바일
└── packages/
    ├── ui/             # 공유 UI 컴포넌트
    ├── ts-config/      # TypeScript 설정
    ├── eslint-config/  # ESLint 설정
    └── prettier-config/# Prettier 설정
```

### 2. 공유 패키지 수정 시 주의사항

- **Breaking Change 최소화**: 기존 사용처에 영향 없도록 주의
- **버전 관리**: Semantic Versioning 엄격히 준수
- **변경 사항 문서화**: CHANGELOG.md 업데이트
- **마이그레이션 가이드**: Breaking change 시 마이그레이션 문서 작성

### 3. 코드 리뷰 체크포인트

**기능 관점:**
- [ ] 요구사항을 정확히 구현했는가?
- [ ] 엣지 케이스를 처리했는가?
- [ ] 에러 핸들링이 적절한가?

**코드 품질:**
- [ ] 네이밍이 명확한가?
- [ ] 중복 코드가 없는가?
- [ ] 함수/클래스가 단일 책임을 가지는가?
- [ ] 타입이 정확히 정의되었는가?

**테스트:**
- [ ] 테스트 커버리지가 충분한가?
- [ ] 중요한 시나리오가 테스트되었는가?
- [ ] 테스트가 독립적으로 실행되는가?

**성능:**
- [ ] 불필요한 리렌더링이 없는가? (프론트엔드)
- [ ] N+1 쿼리 문제가 없는가? (백엔드)
- [ ] 메모리 누수 가능성이 없는가?

**보안:**
- [ ] 입력값 검증이 적절한가?
- [ ] 민감 정보가 노출되지 않는가?
- [ ] SQL Injection, XSS 등의 취약점이 없는가?

## 🚨 절대 금지 사항

1. **console.log를 프로덕션 코드에 남기지 않기**
2. **하드코딩된 값 사용 금지** (환경변수 또는 상수 사용)
3. **any 타입 남용 금지**
4. **테스트 없이 배포 금지**
5. **주석 처리된 코드 커밋 금지**
6. **민감 정보 (API Key, Password 등) 커밋 금지**

## 📚 추가 리소스

- [백엔드 가이드](apps/backend/AGENTS.md)
- [모바일 가이드](apps/mobile/AGENTS.md)
- [공유 패키지 개발 가이드](packages/README.md)

---

**이 가이드라인은 지속적으로 업데이트됩니다. 개선 제안은 언제나 환영합니다!**
