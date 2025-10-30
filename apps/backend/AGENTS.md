# AI Agent Guidelines - Backend (NestJS)

백엔드 개발 시 AI 에이전트가 따라야 할 가이드라인입니다.

## 📋 목차

- [기술 스택](#기술-스택)
- [프로젝트 구조](#프로젝트-구조)
- [개발 워크플로우](#개발-워크플로우)
- [NestJS 아키텍처 가이드](#nestjs-아키텍처-가이드)
- [데이터베이스 가이드라인](#데이터베이스-가이드라인)
- [API 설계 가이드](#api-설계-가이드)
- [테스트 전략](#테스트-전략)
- [보안 가이드라인](#보안-가이드라인)

## 기술 스택

- **Framework**: NestJS 10.x
- **Language**: TypeScript 5.x
- **Database**: (프로젝트에 따라 명시)
- **ORM**: (TypeORM / Prisma 등)
- **Testing**: Jest
- **Validation**: class-validator, class-transformer
- **Documentation**: Swagger/OpenAPI

## 프로젝트 구조

```
src/
├── common/                 # 공통 모듈
│   ├── decorators/        # 커스텀 데코레이터
│   ├── filters/           # Exception 필터
│   ├── guards/            # 인증/인가 가드
│   ├── interceptors/      # 인터셉터
│   ├── pipes/             # 파이프
│   └── utils/             # 유틸리티 함수
├── config/                # 설정 파일
│   ├── database.config.ts
│   ├── jwt.config.ts
│   └── swagger.config.ts
├── modules/               # 기능별 모듈
│   ├── auth/
│   │   ├── dto/          # Data Transfer Objects
│   │   ├── entities/     # 엔티티
│   │   ├── guards/       # 모듈별 가드
│   │   ├── strategies/   # Passport 전략
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── auth.module.ts
│   │   └── auth.service.spec.ts
│   ├── users/
│   └── ...
├── shared/                # 공유 리소스
│   ├── interfaces/
│   ├── types/
│   └── constants/
├── app.module.ts
└── main.ts
```

## 개발 워크플로우

### 1. 새로운 기능 추가 프로세스

#### Step 1: 모듈 생성
```bash
nest g module modules/feature-name
nest g controller modules/feature-name
nest g service modules/feature-name
```

#### Step 2: 엔티티 정의
```typescript
// modules/users/entities/user.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  name: string;

  @Column({ select: false }) // 기본 쿼리에서 제외
  password: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

#### Step 3: DTO 정의
```typescript
// modules/users/dto/create-user.dto.ts
import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({
    description: '사용자 이메일',
    example: 'user@example.com',
  })
  @IsEmail({}, { message: '올바른 이메일 형식이 아닙니다.' })
  email: string;

  @ApiProperty({
    description: '사용자 이름',
    example: '홍길동',
    minLength: 2,
    maxLength: 50,
  })
  @IsString()
  @MinLength(2, { message: '이름은 최소 2자 이상이어야 합니다.' })
  @MaxLength(50, { message: '이름은 최대 50자까지 가능합니다.' })
  name: string;

  @ApiProperty({
    description: '비밀번호',
    example: 'password123!',
    minLength: 8,
  })
  @IsString()
  @MinLength(8, { message: '비밀번호는 최소 8자 이상이어야 합니다.' })
  password: string;
}
```

#### Step 4: Service 구현
```typescript
// modules/users/users.service.ts
import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    // 1. 중복 체크
    const existingUser = await this.userRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('이미 존재하는 이메일입니다.');
    }

    // 2. 비밀번호 해시
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    // 3. 사용자 생성
    const user = this.userRepository.create({
      ...createUserDto,
      password: hashedPassword,
    });

    // 4. 저장
    return this.userRepository.save(user);
  }

  async findById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }
}
```

#### Step 5: Controller 구현
```typescript
// modules/users/users.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '새 사용자 생성' })
  @ApiResponse({ status: 201, description: '사용자 생성 성공' })
  @ApiResponse({ status: 409, description: '이미 존재하는 이메일' })
  async create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '사용자 정보 조회' })
  @ApiResponse({ status: 200, description: '조회 성공' })
  @ApiResponse({ status: 404, description: '사용자를 찾을 수 없음' })
  async findOne(@Param('id') id: string) {
    return this.usersService.findById(id);
  }
}
```

#### Step 6: 테스트 작성
```typescript
// modules/users/users.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';

describe('UsersService', () => {
  let service: UsersService;
  let repository: Repository<User>;

  const mockRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createUserDto: CreateUserDto = {
      email: 'test@example.com',
      name: 'Test User',
      password: 'password123',
    };

    it('should create a new user successfully', async () => {
      // Arrange
      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue(createUserDto);
      mockRepository.save.mockResolvedValue({ id: '1', ...createUserDto });

      // Act
      const result = await service.create(createUserDto);

      // Assert
      expect(result).toBeDefined();
      expect(result.email).toBe(createUserDto.email);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { email: createUserDto.email },
      });
    });

    it('should throw ConflictException when email already exists', async () => {
      // Arrange
      mockRepository.findOne.mockResolvedValue({ id: '1', ...createUserDto });

      // Act & Assert
      await expect(service.create(createUserDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('findById', () => {
    it('should return a user when found', async () => {
      // Arrange
      const user = { id: '1', email: 'test@example.com', name: 'Test User' };
      mockRepository.findOne.mockResolvedValue(user);

      // Act
      const result = await service.findById('1');

      // Assert
      expect(result).toEqual(user);
    });

    it('should throw NotFoundException when user not found', async () => {
      // Arrange
      mockRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findById('999')).rejects.toThrow(NotFoundException);
    });
  });
});
```

## NestJS 아키텍처 가이드

### 1. 레이어 분리

```
Controller → Service → Repository/Entity
    ↓          ↓
   DTO      Business Logic
```

**각 레이어의 책임:**

- **Controller**: HTTP 요청/응답 처리, 라우팅
  - DTO 검증 (ValidationPipe 사용)
  - HTTP 상태 코드 관리
  - API 문서화 (Swagger)

- **Service**: 비즈니스 로직
  - 데이터 처리 및 변환
  - 트랜잭션 관리
  - 에러 핸들링

- **Repository/Entity**: 데이터 접근
  - DB 쿼리 실행
  - 엔티티 관계 관리

### 2. Dependency Injection 활용

```typescript
// ✅ Good - 인터페이스를 통한 느슨한 결합
@Injectable()
export class OrderService {
  constructor(
    private readonly userService: UsersService,
    private readonly paymentService: PaymentService,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
  ) {}
}

// ❌ Bad - 직접 인스턴스 생성
@Injectable()
export class OrderService {
  private userService = new UsersService();
}
```

### 3. Custom Decorators 활용

```typescript
// common/decorators/current-user.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);

// 사용
@Get('me')
@UseGuards(JwtAuthGuard)
async getProfile(@CurrentUser() user: User) {
  return user;
}
```

### 4. Exception Filters

```typescript
// common/filters/http-exception.filter.ts
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message:
        typeof exceptionResponse === 'string'
          ? exceptionResponse
          : (exceptionResponse as any).message,
    };

    response.status(status).json(errorResponse);
  }
}
```

### 5. Interceptors 활용

```typescript
// common/interceptors/transform.interceptor.ts
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  success: boolean;
  data: T;
  timestamp: string;
}

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, Response<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> {
    return next.handle().pipe(
      map((data) => ({
        success: true,
        data,
        timestamp: new Date().toISOString(),
      })),
    );
  }
}
```

## 데이터베이스 가이드라인

### 1. 엔티티 설계 원칙

```typescript
// ✅ Good - 적절한 인덱스, 제약조건
@Entity('users')
@Index(['email'], { unique: true })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 255 })
  email: string;

  @Column({ length: 100 })
  name: string;

  @OneToMany(() => Post, (post) => post.author)
  posts: Post[];

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn() // Soft delete
  deletedAt?: Date;
}
```

### 2. 트랜잭션 관리

```typescript
// ✅ Good - 트랜잭션 사용
async transferPoints(fromUserId: string, toUserId: string, amount: number) {
  return this.dataSource.transaction(async (manager) => {
    const fromUser = await manager.findOne(User, { where: { id: fromUserId } });
    const toUser = await manager.findOne(User, { where: { id: toUserId } });

    if (fromUser.points < amount) {
      throw new BadRequestException('포인트가 부족합니다.');
    }

    fromUser.points -= amount;
    toUser.points += amount;

    await manager.save([fromUser, toUser]);

    return { success: true };
  });
}
```

### 3. N+1 문제 방지

```typescript
// ❌ Bad - N+1 쿼리 발생
async getUsersWithPosts() {
  const users = await this.userRepository.find();
  // 각 user마다 추가 쿼리 발생
  return users.map(async user => ({
    ...user,
    posts: await this.postRepository.find({ where: { authorId: user.id } })
  }));
}

// ✅ Good - JOIN 또는 eager loading 사용
async getUsersWithPosts() {
  return this.userRepository.find({
    relations: ['posts'],
  });
}

// ✅ Better - QueryBuilder로 세밀한 제어
async getUsersWithPosts() {
  return this.userRepository
    .createQueryBuilder('user')
    .leftJoinAndSelect('user.posts', 'post')
    .where('user.isActive = :isActive', { isActive: true })
    .orderBy('user.createdAt', 'DESC')
    .getMany();
}
```

## API 설계 가이드

### 1. RESTful API 원칙

```
GET    /users          - 사용자 목록 조회
GET    /users/:id      - 특정 사용자 조회
POST   /users          - 사용자 생성
PUT    /users/:id      - 사용자 전체 업데이트
PATCH  /users/:id      - 사용자 부분 업데이트
DELETE /users/:id      - 사용자 삭제
```

### 2. 응답 형식 표준화

```typescript
// 성공 응답
{
  "success": true,
  "data": {
    "id": "123",
    "name": "John Doe"
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}

// 에러 응답
{
  "success": false,
  "statusCode": 400,
  "message": "잘못된 요청입니다.",
  "errors": [
    {
      "field": "email",
      "message": "올바른 이메일 형식이 아닙니다."
    }
  ],
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 3. Pagination

```typescript
export class PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;
}

async findAll(paginationDto: PaginationDto) {
  const { page, limit } = paginationDto;
  const skip = (page - 1) * limit;

  const [items, total] = await this.repository.findAndCount({
    skip,
    take: limit,
  });

  return {
    items,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}
```

## 테스트 전략

### 1. 테스트 구조

```
src/
└── modules/
    └── users/
        ├── users.service.ts
        ├── users.service.spec.ts        # 단위 테스트
        ├── users.controller.spec.ts     # 단위 테스트
        └── users.e2e-spec.ts            # E2E 테스트
```

### 2. E2E 테스트

```typescript
// users.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('UsersController (e2e)', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    // 인증 토큰 획득
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'test@example.com', password: 'password' });
    authToken = response.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/users (POST)', () => {
    it('should create a new user', () => {
      return request(app.getHttpServer())
        .post('/users')
        .send({
          email: 'new@example.com',
          name: 'New User',
          password: 'password123',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.email).toBe('new@example.com');
          expect(res.body.password).toBeUndefined(); // 비밀번호 노출 안됨
        });
    });

    it('should return 400 for invalid email', () => {
      return request(app.getHttpServer())
        .post('/users')
        .send({
          email: 'invalid-email',
          name: 'Test',
          password: 'password',
        })
        .expect(400);
    });
  });

  describe('/users/:id (GET)', () => {
    it('should get user by id', () => {
      return request(app.getHttpServer())
        .get('/users/1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });

    it('should return 401 without auth token', () => {
      return request(app.getHttpServer())
        .get('/users/1')
        .expect(401);
    });
  });
});
```

## 보안 가이드라인

### 1. 인증/인가

```typescript
// JWT 전략
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    return { userId: payload.sub, email: payload.email };
  }
}

// 역할 기반 가드
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.some((role) => user.roles?.includes(role));
  }
}
```

### 2. 입력 검증 및 Sanitization

```typescript
import { IsEmail, IsNotEmpty, MinLength, Matches } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateUserDto {
  @IsEmail()
  @Transform(({ value }) => value.toLowerCase().trim())
  email: string;

  @IsNotEmpty()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message: '비밀번호는 대소문자, 숫자, 특수문자를 포함해야 합니다.',
  })
  password: string;
}
```

### 3. Rate Limiting

```typescript
// main.ts
import { NestFactory } from '@nestjs/core';
import rateLimit from 'express-rate-limit';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000, // 15분
      max: 100, // 최대 100 요청
      message: '너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.',
    }),
  );

  await app.listen(3000);
}
```

### 4. 환경 변수 관리

```typescript
// config/configuration.ts
export default () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  database: {
    host: process.env.DATABASE_HOST,
    port: parseInt(process.env.DATABASE_PORT, 10) || 5432,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
  },
});

// ❌ Bad - 하드코딩
const secret = 'my-secret-key';

// ✅ Good - 환경 변수 사용
const secret = this.configService.get('JWT_SECRET');
```

## 체크리스트

### 새 기능 구현 시

- [ ] 엔티티 정의 및 마이그레이션 생성
- [ ] DTO 정의 및 validation 규칙 작성
- [ ] Service 로직 구현
- [ ] Controller 엔드포인트 구현
- [ ] Swagger 문서화
- [ ] 단위 테스트 작성 (Service)
- [ ] 통합 테스트 작성 (Controller)
- [ ] E2E 테스트 작성 (중요 플로우)
- [ ] 에러 핸들링 확인
- [ ] 인증/인가 적용 확인
- [ ] 성능 테스트 (필요시)

### 배포 전

- [ ] 모든 테스트 통과
- [ ] 린트 에러 없음
- [ ] 환경 변수 설정 확인
- [ ] 데이터베이스 마이그레이션 적용
- [ ] API 문서 최신화
- [ ] 로깅 설정 확인
- [ ] 보안 취약점 검사

---

**더 자세한 내용은 [공통 가이드](../../AGENTS.md)를 참고하세요.**
