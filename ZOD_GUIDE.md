# Zod 사용 가이드

이 프로젝트에서는 백엔드와 프론트엔드 모두 Zod를 사용하여 타입 안전성과 런타임 검증을 보장합니다.

## 📦 설치

Zod는 workspace root에 설치되어 있으므로 모든 패키지에서 사용 가능합니다.

```bash
# 이미 설치되어 있음
pnpm add -w zod
```

## 🎯 사용 목적

### 1. 타입 안전성
- TypeScript 타입 자동 추론
- 컴파일 타임 타입 체크

### 2. 런타임 검증
- API 요청/응답 데이터 검증
- 폼 입력 검증
- 환경 변수 검증

### 3. 코드 공유
- Backend와 Mobile 간 스키마 공유
- API 계약(Contract) 명확화

## 📁 권장 프로젝트 구조

```
moim/
├── packages/
│   └── shared-types/           # 공유 Zod 스키마 => 보통 Controller 응답
│       ├── src/
│       │   ├── schemas/
│       │   │   ├── user.schema.shared-types
│       │   │   ├── auth.schema.ts
│       │   │   └── index.ts
│       │   └── index.ts
│       └── package.json
├── apps/
│   ├── backend/
│   │   └── src/
│   │       ├── modules/
│   │       │   └── users/
│   │       │       ├── dto/
│   │       │       │   └── create-user.dto.ts  # Zod 스키마 사용
│   │       │       └── users.controller.ts
│   │       └── common/
│   │           └── pipes/
│   │               └── zod-validation.pipe.ts
│   └── mobile/
│       └── src/
│           ├── api/
│           │   └── user.api.ts          # Zod로 응답 검증
│           └── utils/
│               └── validation.ts
```

## 🔧 Backend (NestJS) 사용법

### 1. Zod Validation Pipe 생성

```typescript
// apps/backend/src/common/pipes/zod-validation.pipe.ts
import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { ZodSchema } from 'zod';

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: ZodSchema) {}

  transform(value: unknown) {
    try {
      const parsedValue = this.schema.parse(value);
      return parsedValue;
    } catch (error) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: error.errors,
      });
    }
  }
}
```

### 2. DTO에서 Zod 스키마 정의

```typescript
// apps/backend/src/modules/users/dto/create-user.dto.ts
import { z } from 'zod';

export const createUserSchema = z.object({
  email: z.string().email('올바른 이메일 형식이 아닙니다.'),
  name: z
    .string()
    .min(2, '이름은 최소 2자 이상이어야 합니다.')
    .max(50, '이름은 최대 50자까지 가능합니다.'),
  password: z
    .string()
    .min(8, '비밀번호는 최소 8자 이상이어야 합니다.')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      '비밀번호는 대소문자와 숫자를 포함해야 합니다.',
    ),
  age: z.number().int().min(0).max(150).optional(),
});

export type CreateUserDto = z.infer<typeof createUserSchema>;
```

### 3. Controller에서 사용

```typescript
// apps/backend/src/modules/users/users.controller.ts
import { Controller, Post, Body, UsePipes } from '@nestjs/common';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { createUserSchema, CreateUserDto } from './dto/create-user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @UsePipes(new ZodValidationPipe(createUserSchema))
  async create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  // 또는 메서드 파라미터에 직접 적용
  @Post('alternative')
  async createAlternative(
    @Body(new ZodValidationPipe(createUserSchema))
    createUserDto: CreateUserDto,
  ) {
    return this.usersService.create(createUserDto);
  }
}
```

### 4. 환경 변수 검증

```typescript
// apps/backend/src/config/env.validation.ts
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']),
  PORT: z.string().transform(Number).pipe(z.number().min(1).max(65535)),
  DATABASE_HOST: z.string().min(1),
  DATABASE_PORT: z.string().transform(Number),
  DATABASE_NAME: z.string().min(1),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET은 최소 32자 이상이어야 합니다.'),
  JWT_EXPIRES_IN: z.string().default('1h'),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(): Env {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    console.error('❌ Invalid environment variables:', error.errors);
    throw new Error('Environment validation failed');
  }
}

// main.ts에서 사용
validateEnv();
```

## 📱 Mobile (React Native) 사용법

### 1. API 응답 검증

```typescript
// apps/mobile/src/api/schemas/user.schema.ts
import { z } from 'zod';

export const userSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  createdAt: z.string().datetime(),
});

export const getUserResponseSchema = z.object({
  success: z.boolean(),
  data: userSchema,
});

export type User = z.infer<typeof userSchema>;
export type GetUserResponse = z.infer<typeof getUserResponseSchema>;
```

```typescript
// apps/mobile/src/api/user.api.ts
import axios from 'axios';
import { getUserResponseSchema, GetUserResponse } from './schemas/user.schema';
import { API_URL } from '@env';

export const userApi = {
  async getUser(id: string): Promise<GetUserResponse> {
    const response = await axios.get(`${API_URL}/users/${id}`);

    // 런타임 검증
    const validatedData = getUserResponseSchema.parse(response.data);

    return validatedData;
  },

  // safeParse를 사용한 안전한 검증
  async getUserSafe(id: string) {
    try {
      const response = await axios.get(`${API_URL}/users/${id}`);
      const result = getUserResponseSchema.safeParse(response.data);

      if (!result.success) {
        console.error('API 응답 검증 실패:', result.error);
        throw new Error('잘못된 API 응답 형식');
      }

      return result.data;
    } catch (error) {
      console.error('API 호출 실패:', error);
      throw error;
    }
  },
};
```

### 2. 폼 검증 (React Hook Form + Zod)

```bash
# React Hook Form 설치 (필요시)
cd apps/mobile
pnpm add react-hook-form @hookform/resolvers
```

```typescript
// apps/mobile/src/screens/auth/SignupScreen.tsx
import React from 'react';
import { View, Text, TextInput, Button } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const signupSchema = z.object({
  email: z.string().email('올바른 이메일을 입력하세요.'),
  password: z.string().min(8, '비밀번호는 최소 8자 이상이어야 합니다.'),
  passwordConfirm: z.string(),
}).refine((data) => data.password === data.passwordConfirm, {
  message: '비밀번호가 일치하지 않습니다.',
  path: ['passwordConfirm'],
});

type SignupFormData = z.infer<typeof signupSchema>;

export const SignupScreen = () => {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = (data: SignupFormData) => {
    console.log('Valid data:', data);
  };

  return (
    <View>
      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, value } }) => (
          <View>
            <TextInput
              placeholder="이메일"
              value={value}
              onChangeText={onChange}
            />
            {errors.email && <Text>{errors.email.message}</Text>}
          </View>
        )}
      />

      <Controller
        control={control}
        name="password"
        render={({ field: { onChange, value } }) => (
          <View>
            <TextInput
              placeholder="비밀번호"
              value={value}
              onChangeText={onChange}
              secureTextEntry
            />
            {errors.password && <Text>{errors.password.message}</Text>}
          </View>
        )}
      />

      <Button title="회원가입" onPress={handleSubmit(onSubmit)} />
    </View>
  );
};
```

## 공유 스키마

### 1. 공유 스키마 정의

```typescript
// packages/shared-types/src/schemas/user.schema.ts
import { z } from 'zod';

export const userSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(2).max(50),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const createUserSchema = userSchema.pick({
  email: true,
  name: true,
}).extend({
  password: z.string().min(8),
});

export const updateUserSchema = userSchema.pick({
  name: true,
}).partial();

export type User = z.infer<typeof userSchema>;
export type CreateUserDto = z.infer<typeof createUserSchema>;
export type UpdateUserDto = z.infer<typeof updateUserSchema>;
```

```typescript
// packages/shared-types/src/schemas/auth.schema.ts
import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const loginResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  user: z.object({
    id: z.string(),
    email: z.string(),
    name: z.string(),
  }),
});

export type LoginDto = z.infer<typeof loginSchema>;
export type LoginResponse = z.infer<typeof loginResponseSchema>;
```

```typescript
// packages/shared-types/src/index.ts
export * from './schemas/user.schema';
export * from './schemas/auth.schema';
```

### 2. Backend와 Mobile에서 사용

```typescript
// Backend
import { createUserSchema, CreateUserDto } from '@moim-package/shared-types';

@Post()
@UsePipes(new ZodValidationPipe(createUserSchema))
async create(@Body() createUserDto: CreateUserDto) {
  return this.usersService.create(createUserDto);
}

// Mobile
import { loginSchema, loginResponseSchema } from '@moim-package/shared-types';

export const authApi = {
  async login(email: string, password: string) {
    const validatedInput = loginSchema.parse({ email, password });
    const response = await axios.post('/auth/login', validatedInput);
    return loginResponseSchema.parse(response.data);
  },
};
```

## 🎨 고급 기능

### 1. 커스텀 검증

```typescript
const passwordSchema = z
  .string()
  .min(8)
  .refine((val) => /[A-Z]/.test(val), {
    message: '대문자를 최소 1개 포함해야 합니다.',
  })
  .refine((val) => /[a-z]/.test(val), {
    message: '소문자를 최소 1개 포함해야 합니다.',
  })
  .refine((val) => /[0-9]/.test(val), {
    message: '숫자를 최소 1개 포함해야 합니다.',
  });
```

### 2. Transform

```typescript
const userInputSchema = z.object({
  email: z.string().email().transform((val) => val.toLowerCase().trim()),
  age: z.string().transform((val) => parseInt(val, 10)),
  tags: z.string().transform((val) => val.split(',').map((s) => s.trim())),
});
```

### 3. Union & Discriminated Union

```typescript
const responseSchema = z.discriminatedUnion('status', [
  z.object({
    status: z.literal('success'),
    data: z.object({ id: z.string(), name: z.string() }),
  }),
  z.object({
    status: z.literal('error'),
    error: z.object({ message: z.string(), code: z.number() }),
  }),
]);
```

### 4. 재사용 가능한 스키마

```typescript
const timestampSchema = z.object({
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

const userSchema = z.object({
  id: z.string(),
  name: z.string(),
}).merge(timestampSchema);
```

## ✅ 베스트 프랙티스

1. **스키마를 단일 소스로 유지**
   - Backend와 Mobile이 동일한 스키마 사용 주로 Controller input output 해당
   - 타입 불일치 방지

2. **의미 있는 에러 메시지**
   ```typescript
   z.string().min(8, '비밀번호는 최소 8자 이상이어야 합니다.')
   ```

3. **safeParse 활용**
   - 외부 데이터는 항상 `safeParse` 사용
   - 에러 핸들링을 명시적으로 처리

4. **스키마 조합**
   - `pick`, `omit`, `partial`, `extend` 활용
   - 중복 코드 최소화

5. **테스트**
   ```typescript
   describe('유저', () => {
     it('유효한 유저 데이터 검증', () => {
       const result = userSchema.safeParse({
         id: '123',
         email: 'test@example.com',
         name: 'Test User',
       });
       expect(result.success).toBe(true);
     });

     it('무효한 이메일 유저 검증', () => {
       const result = userSchema.safeParse({
         id: '123',
         email: 'invalid-email',
         name: 'Test',
       });
       expect(result.success).toBe(false);
     });
   });
   ```

## 📚 추가 리소스

- [Zod 공식 문서](https://zod.dev)
- [React Hook Form + Zod](https://react-hook-form.com/get-started#SchemaValidation)
- [NestJS Custom Pipes](https://docs.nestjs.com/pipes#custom-pipes)
