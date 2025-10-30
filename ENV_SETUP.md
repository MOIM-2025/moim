# 환경 변수 설정 가이드

이 프로젝트는 Turborepo를 사용하며, 각 앱(backend, mobile)에서 개발/프로덕션 환경별로 다른 환경 변수를 사용합니다.

## 📁 파일 구조

```
moim/
├── apps/
│   ├── backend/
│   │   ├── .env.dev       # 백엔드 개발 환경 변수
│   │   └── .env.prod      # 백엔드 프로덕션 환경 변수
│   └── mobile/
│       ├── .env.dev       # 모바일 개발 환경 변수
│       └── .env.prod      # 모바일 프로덕션 환경 변수
└── .gitignore             # .env.dev, .env.prod는 Git에 포함됨
```

## 🔧 환경 변수 사용 방법

### Backend (NestJS)

#### 개발 환경에서 실행
```bash
# 개별 실행
cd apps/backend
pnpm dev

# Turbo로 실행
pnpm dev:backend
```
→ `.env.dev` 파일이 자동으로 로드됩니다.

#### 프로덕션 빌드 및 실행
```bash
# 빌드
cd apps/backend
pnpm build

# 실행
pnpm start:prod
```
→ `.env.prod` 파일이 자동으로 로드됩니다.

#### 코드에서 사용
```typescript
// NestJS에서 ConfigModule 설정
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      // dotenv-cli가 자동으로 .env.dev 또는 .env.prod를 로드
      isGlobal: true,
    }),
  ],
})
export class AppModule {}

// 환경 변수 사용
@Injectable()
export class MyService {
  constructor(private configService: ConfigService) {}

  getDatabaseHost() {
    return this.configService.get('DATABASE_HOST');
  }
}
```

### Mobile (React Native)

#### 개발 환경에서 실행
```bash
# Metro 번들러 시작
cd apps/mobile
pnpm dev

# Android 실행
pnpm android

# iOS 실행
pnpm ios
```
→ `ENV_FILE=.env.dev`로 설정되어 `.env.dev` 파일이 로드됩니다.

#### 프로덕션 빌드
```bash
# Android 릴리즈 빌드
cd apps/mobile
pnpm build:android

# iOS 릴리즈 빌드
pnpm build:ios
```
→ `ENV_FILE=.env.prod`로 설정되어 `.env.prod` 파일이 로드됩니다.

#### 코드에서 사용
```typescript
// 환경 변수 import
import { API_URL, API_TIMEOUT, NODE_ENV } from '@env';

// 사용
const apiClient = axios.create({
  baseURL: API_URL,
  timeout: Number(API_TIMEOUT),
});

console.log('Current environment:', NODE_ENV);
```

## 📝 환경 변수 파일 설정

### Backend (.env.dev / .env.prod)

```bash
# Server
PORT=3000
NODE_ENV=development  # 또는 production

# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=moim_dev
DATABASE_USER=postgres
DATABASE_PASSWORD=your-password

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=1h

# CORS
CORS_ORIGIN=http://localhost:3000

# Logging
LOG_LEVEL=debug  # 또는 info
```

### Mobile (.env.dev / .env.prod)

```bash
# API
API_URL=http://localhost:3000  # 또는 https://api.production.com
API_TIMEOUT=10000

# Environment
NODE_ENV=development  # 또는 production

# Feature Flags
ENABLE_LOGGING=true  # 또는 false
ENABLE_DEBUG_MODE=true  # 또는 false
```

## 🎯 Turborepo 실행 방법

### 개발 환경

```bash
# 전체 앱 개발 모드 실행
pnpm dev

# 개별 앱만 실행
pnpm dev --filter=backend
pnpm dev --filter=mobile
```

### 빌드

```bash
# 전체 앱 빌드 (프로덕션 환경 변수 사용)
pnpm build

# 개별 앱만 빌드
pnpm build --filter=backend
```

### 테스트

```bash
# 전체 테스트 (개발 환경 변수 사용)
pnpm test

# 개별 앱 테스트
pnpm test --filter=backend
```

## ⚙️ 작동 원리

### Backend
- `dotenv-cli`를 사용하여 스크립트 실행 전에 환경 변수 파일 로드
- 예: `dotenv -e .env.dev -- nest start --watch`

### Mobile
- `cross-env`로 `ENV_FILE` 환경 변수 설정
- `babel.config.js`에서 `react-native-dotenv`가 `process.env.ENV_FILE` 경로 읽음
- 예: `cross-env ENV_FILE=.env.dev react-native start`

### Turbo
- `turbo.json`의 `globalEnv`와 `env` 설정으로 환경 변수 추적
- 환경 변수 변경 시 캐시 무효화

## 🔒 보안 주의사항

1. **민감한 정보 관리**
   - `.env.dev`와 `.env.prod`는 Git에 포함되지 않음

2. **로컬 오버라이드**
   - 로컬에서만 사용할 환경 변수는 `.env.local` 생성

3. **프로덕션 배포**
   - CI/CD 파이프라인에서 환경 변수 주입

## 🆘 문제 해결

### 환경 변수가 로드되지 않을 때

1. **Backend**
   ```bash
   # dotenv-cli 설치 확인
   pnpm list dotenv-cli

   # 재설치
   pnpm install
   ```

2. **Mobile**
   ```bash
   # Metro 캐시 삭제
   cd apps/mobile
   pnpm start -- --reset-cache

   # iOS (필요시)
   cd ios && pod install && cd ..

   # Android (필요시)
   cd android && ./gradlew clean && cd ..
   ```

### TypeScript 타입 에러 (Mobile)

```bash
# 타입 정의 파일 확인
# apps/mobile/src/types/env.d.ts 파일이 있는지 확인

# tsconfig.json에 포함되어 있는지 확인
# "include": ["src/**/*"]
```

## 📚 추가 리소스

- [dotenv-cli 문서](https://github.com/entropitor/dotenv-cli)
- [react-native-dotenv 문서](https://github.com/goatandsheep/react-native-dotenv)
- [Turborepo 환경 변수 가이드](https://turbo.build/repo/docs/core-concepts/caching#environment-variables)
