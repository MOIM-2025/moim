# moim
모임

## 프로젝트 구조

이 프로젝트는 Turborepo를 사용하는 모노레포입니다.

```
moim/
├── apps/
│   ├── backend/        # NestJS 백엔드 서버
│   └── mobile/         # React Native 모바일 앱
└── packages/
    ├── ui/             # 공유 UI 컴포넌트
    ├── ts-config/      # 공유 TypeScript 설정
    ├── eslint-config/  # 공유 ESLint 설정
    └── prettier-config/# 공유 Prettier 설정
```

## Installation

이 프로젝트의 패키지들을 설치하기 위해서는 다음 단계를 따라주세요:

1. npm access list packages @moim-package 명령어로 다운로드 권한이 있는지 확인하세요.
2. pnpm i 로 패키지 의존성을 다운로드하세요.

## 개발 환경 실행

### 전체 프로젝트 실행

```bash
# 모든 앱의 개발 서버 동시 실행
pnpm dev

# 개별 앱 실행
pnpm dev:backend  # 백엔드만 실행
pnpm dev:mobile   # 모바일 Metro 번들러만 실행
```

### 백엔드 개발

```bash
# 백엔드 개발 서버 시작 (watch mode)
pnpm dev:backend

# 또는 apps/backend 폴더에서
cd apps/backend
pnpm dev
```

백엔드는 기본적으로 `http://localhost:3000`에서 실행됩니다.

### 모바일 앱 개발

```bash
# 1. Metro 번들러 시작 (터미널 1)
pnpm dev:mobile

# 2. Android 실행 (터미널 2)
pnpm android

# 또는 iOS 실행 (Mac만 가능)
pnpm ios
```

**추가 모바일 명령어:**
```bash
pnpm ios:device           # 실제 iOS 기기에서 실행
pnpm android:release      # Android 릴리즈 빌드로 실행
pnpm ios:release          # iOS 릴리즈 빌드로 실행
```

## 빌드

### 전체 빌드

```bash
# 모든 앱과 패키지 빌드
pnpm build
```

### 백엔드 빌드

```bash
# 백엔드만 빌드
pnpm build:backend

# 빌드 후 프로덕션 모드로 실행
pnpm start:backend:prod

# 또는 apps/backend 폴더에서
cd apps/backend
pnpm build
pnpm start:prod
```

### 모바일 앱 빌드

```bash
# Android APK 빌드
cd apps/mobile
pnpm build:android

# iOS 아카이브 빌드 (Mac만 가능)
cd apps/mobile
pnpm build:ios
```

빌드된 파일 위치:
- Android: `apps/mobile/android/app/build/outputs/apk/release/`
- iOS: Xcode의 Organizer에서 확인

## 테스트

```bash
# 모든 테스트 실행
pnpm test

# 백엔드 테스트
cd apps/backend
pnpm test

# 모바일 테스트
cd apps/mobile
pnpm test

# Watch 모드로 테스트
pnpm test:watch
```

## 린트 & 포맷팅

```bash
# 전체 린트 검사
pnpm lint

# 개별 앱 린트
cd apps/backend
pnpm lint

cd apps/mobile
pnpm lint

# 백엔드 코드 포맷팅
cd apps/backend
pnpm format
```

## 클린 빌드

모바일 앱에서 빌드 문제가 발생하면 클린 후 다시 시도하세요:

```bash
cd apps/mobile

# 전체 클린
pnpm clean

# 개별 플랫폼 클린
pnpm clean:android
pnpm clean:ios
```

## 패키지 배포 방법

패키지 배포시 체크해야할 것
1. 배포할 패키지의 package.json의 name이 @moim-package/* 인지 확인.
2. 배포할 패키지의 version이 이전보다 높아졌는지 확인.
3. npm login 여부 확인.
4. npm의 moim-package Organization에 배포 권한이 있는 멤버로 로그인 되어있는지 확인

배포 방법
1. 배포할 라이브러리 폴더에서 npm publish 명령어 실행

## 기술 스택

- **모노레포 관리**: Turborepo, pnpm workspace
- **백엔드**: NestJS, TypeScript
- **모바일**: React Native, TypeScript
- **공유 도구**: ESLint, Prettier, TypeScript
- **테스팅**: Jest