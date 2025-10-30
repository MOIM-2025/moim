# AI Agent Guidelines - Mobile (React Native)

모바일 앱 개발 시 AI 에이전트가 따라야 할 가이드라인입니다.

## 📋 목차

- [기술 스택](#기술-스택)
- [프로젝트 구조](#프로젝트-구조)
- [개발 워크플로우](#개발-워크플로우)
- [컴포넌트 설계 가이드](#컴포넌트-설계-가이드)
- [상태 관리 가이드](#상태-관리-가이드)
- [스타일링 가이드](#스타일링-가이드)
- [성능 최적화](#성능-최적화)
- [테스트 전략](#테스트-전략)
- [네비게이션 가이드](#네비게이션-가이드)
- [네이티브 모듈 연동](#네이티브-모듈-연동)

## 기술 스택

- **Framework**: React Native 0.82.x
- **Language**: TypeScript 5.x
- **State Management**: (Redux Toolkit / Zustand / Recoil 등)
- **Navigation**: React Navigation
- **UI Library**: @moim-package/ui (공유 컴포넌트)
- **Testing**: Jest, React Native Testing Library
- **API Client**: Axios / React Query

## 프로젝트 구조

```
src/
├── assets/                 # 이미지, 폰트, 아이콘
│   ├── images/
│   ├── fonts/
│   └── icons/
├── components/             # 재사용 가능한 컴포넌트
│   ├── common/            # 공통 컴포넌트
│   │   ├── Button/
│   │   │   ├── Button.tsx
│   │   │   ├── Button.styles.ts
│   │   │   ├── Button.test.tsx
│   │   │   └── index.ts
│   │   ├── Input/
│   │   └── ...
│   └── domain/            # 도메인 특화 컴포넌트
│       ├── UserProfile/
│       └── PostCard/
├── screens/               # 화면 컴포넌트
│   ├── auth/
│   │   ├── LoginScreen.tsx
│   │   ├── SignupScreen.tsx
│   │   └── index.ts
│   ├── home/
│   └── ...
├── navigation/            # 네비게이션 설정
│   ├── AppNavigator.tsx
│   ├── AuthNavigator.tsx
│   ├── types.ts
│   └── index.ts
├── hooks/                 # 커스텀 훅
│   ├── useAuth.ts
│   ├── useApi.ts
│   └── ...
├── services/              # API 통신
│   ├── api/
│   │   ├── auth.api.ts
│   │   ├── user.api.ts
│   │   └── index.ts
│   └── storage/          # AsyncStorage 래퍼
│       └── storage.service.ts
├── store/                 # 상태 관리
│   ├── slices/
│   │   ├── auth.slice.ts
│   │   └── user.slice.ts
│   └── store.ts
├── utils/                 # 유틸리티 함수
│   ├── validation.ts
│   ├── format.ts
│   └── ...
├── constants/             # 상수
│   ├── colors.ts
│   ├── spacing.ts
│   └── config.ts
├── types/                 # 타입 정의
│   ├── api.types.ts
│   ├── navigation.types.ts
│   └── models.types.ts
└── App.tsx
```

## 개발 워크플로우

### 1. 새로운 화면 추가 프로세스

#### Step 1: 타입 정의

```typescript
// types/navigation.types.ts
export type RootStackParamList = {
  Home: undefined;
  Profile: { userId: string };
  Settings: undefined;
};

export type HomeScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'Home'
>;

export type ProfileScreenRouteProp = RouteProp<RootStackParamList, 'Profile'>;
```

#### Step 2: 화면 컴포넌트 생성

```typescript
// screens/profile/ProfileScreen.tsx
import React, { useEffect } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { ProfileScreenRouteProp } from '../../types/navigation.types';
import { useGetUserQuery } from '../../services/api/user.api';
import { colors, spacing } from '../../constants';

export const ProfileScreen: React.FC = () => {
  const route = useRoute<ProfileScreenRouteProp>();
  const { userId } = route.params;

  const { data: user, isLoading, error } = useGetUserQuery(userId);

  useEffect(() => {
    // 화면 진입 시 로직
    console.log('ProfileScreen mounted');

    return () => {
      // 화면 이탈 시 정리 작업
      console.log('ProfileScreen unmounted');
    };
  }, []);

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>오류가 발생했습니다.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.email}>{user?.email}</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: spacing.lg,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  email: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  errorText: {
    fontSize: 16,
    color: colors.error,
  },
});
```

#### Step 3: 재사용 가능한 컴포넌트 작성

```typescript
// components/common/Button/Button.tsx
import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacityProps,
} from 'react-native';
import { colors, spacing } from '../../../constants';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  variant = 'primary',
  size = 'medium',
  loading = false,
  fullWidth = false,
  disabled,
  style,
  ...props
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        styles[variant],
        styles[size],
        fullWidth && styles.fullWidth,
        disabled && styles.disabled,
        style,
      ]}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'outline' ? colors.primary : colors.white}
        />
      ) : (
        <Text style={[styles.text, styles[`${variant}Text`]]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Variants
  primary: {
    backgroundColor: colors.primary,
  },
  secondary: {
    backgroundColor: colors.secondary,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  // Sizes
  small: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  medium: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  large: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  // States
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
  // Text
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
  primaryText: {
    color: colors.white,
  },
  secondaryText: {
    color: colors.white,
  },
  outlineText: {
    color: colors.primary,
  },
});
```

#### Step 4: 커스텀 훅 작성

```typescript
// hooks/useAuth.ts
import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { login as loginAction, logout as logoutAction } from '../store/slices/auth.slice';
import { RootState } from '../store/store';
import { authApi } from '../services/api/auth.api';
import { storage } from '../services/storage/storage.service';

export const useAuth = () => {
  const dispatch = useDispatch();
  const { user, token, isLoading } = useSelector(
    (state: RootState) => state.auth,
  );

  const login = useCallback(
    async (email: string, password: string) => {
      try {
        const response = await authApi.login({ email, password });
        await storage.setToken(response.token);
        dispatch(loginAction(response));
        return { success: true };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : '로그인 실패',
        };
      }
    },
    [dispatch],
  );

  const logout = useCallback(async () => {
    await storage.clearToken();
    dispatch(logoutAction());
  }, [dispatch]);

  const isAuthenticated = !!token;

  return {
    user,
    token,
    isLoading,
    isAuthenticated,
    login,
    logout,
  };
};
```

#### Step 5: 테스트 작성

```typescript
// components/common/Button/Button.test.tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Button } from './Button';

describe('Button', () => {
  it('should render correctly', () => {
    const { getByText } = render(<Button title="Click me" />);
    expect(getByText('Click me')).toBeTruthy();
  });

  it('should call onPress when pressed', () => {
    const onPressMock = jest.fn();
    const { getByText } = render(
      <Button title="Click me" onPress={onPressMock} />,
    );

    fireEvent.press(getByText('Click me'));
    expect(onPressMock).toHaveBeenCalledTimes(1);
  });

  it('should show loading indicator when loading', () => {
    const { queryByText, getByTestId } = render(
      <Button title="Click me" loading />,
    );

    expect(queryByText('Click me')).toBeNull();
    // ActivityIndicator를 testID로 확인하거나 다른 방법 사용
  });

  it('should be disabled when disabled prop is true', () => {
    const onPressMock = jest.fn();
    const { getByText } = render(
      <Button title="Click me" onPress={onPressMock} disabled />,
    );

    fireEvent.press(getByText('Click me'));
    expect(onPressMock).not.toHaveBeenCalled();
  });

  it('should apply correct styles for different variants', () => {
    const { getByText, rerender } = render(
      <Button title="Primary" variant="primary" />,
    );
    const button = getByText('Primary').parent;

    // Primary variant 스타일 확인
    expect(button?.props.style).toContainEqual(
      expect.objectContaining({ backgroundColor: expect.any(String) }),
    );

    // Outline variant 테스트
    rerender(<Button title="Outline" variant="outline" />);
    const outlineButton = getByText('Outline').parent;
    expect(outlineButton?.props.style).toContainEqual(
      expect.objectContaining({ borderWidth: 1 }),
    );
  });
});
```

## 컴포넌트 설계 가이드

### 1. 컴포넌트 분리 원칙

```typescript
// ❌ Bad - 하나의 컴포넌트에 모든 로직
const UserProfileScreen = () => {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  // 많은 로직...

  return (
    <View>
      {/* 복잡한 UI */}
    </View>
  );
};

// ✅ Good - 관심사 분리
const UserProfileScreen = () => {
  const { user, isLoading } = useUser();

  return (
    <View>
      <UserHeader user={user} />
      <UserPosts userId={user?.id} />
    </View>
  );
};

const UserHeader: React.FC<{ user: User }> = ({ user }) => {
  // Header 관련 로직
};

const UserPosts: React.FC<{ userId: string }> = ({ userId }) => {
  // Posts 관련 로직
};
```

### 2. Props 타입 정의

```typescript
// ✅ Good - 명확한 Props 타입
interface UserCardProps {
  user: {
    id: string;
    name: string;
    avatar?: string;
  };
  onPress?: () => void;
  showBadge?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const UserCard: React.FC<UserCardProps> = ({
  user,
  onPress,
  showBadge = false,
  style,
}) => {
  // 구현
};
```

### 3. 조건부 렌더링

```typescript
// ❌ Bad - 중첩된 조건문
{loading ? (
  <Loader />
) : error ? (
  <Error />
) : data ? (
  <Content data={data} />
) : (
  <Empty />
)}

// ✅ Good - Early return
const UserList = ({ loading, error, data }) => {
  if (loading) return <Loader />;
  if (error) return <Error error={error} />;
  if (!data?.length) return <EmptyState />;

  return <FlatList data={data} {...props} />;
};
```

## 상태 관리 가이드

### 1. Local State vs Global State

```typescript
// ✅ Local State - 컴포넌트 내부에서만 사용
const MyComponent = () => {
  const [isOpen, setIsOpen] = useState(false);
  // 이 상태는 다른 컴포넌트에서 필요하지 않음
};

// ✅ Global State - 여러 컴포넌트에서 공유
// store/slices/auth.slice.ts
const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    token: null,
  },
  reducers: {
    login: (state, action) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
    },
  },
});
```

### 2. Redux Toolkit 사용 예시

```typescript
// store/slices/user.slice.ts
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { userApi } from '../../services/api/user.api';

export const fetchUser = createAsyncThunk(
  'user/fetchUser',
  async (userId: string) => {
    const response = await userApi.getUser(userId);
    return response.data;
  },
);

const userSlice = createSlice({
  name: 'user',
  initialState: {
    data: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearUser: (state) => {
      state.data = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUser.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

export const { clearUser } = userSlice.actions;
export default userSlice.reducer;
```

## 스타일링 가이드

### 1. 디자인 시스템 구축

```typescript
// constants/colors.ts
export const colors = {
  // Primary
  primary: '#007AFF',
  primaryDark: '#0051D5',
  primaryLight: '#5AC8FA',

  // Secondary
  secondary: '#5856D6',
  secondaryDark: '#3634A3',

  // Neutral
  background: '#FFFFFF',
  backgroundSecondary: '#F2F2F7',
  text: '#000000',
  textSecondary: '#8E8E93',
  border: '#C6C6C8',

  // Semantic
  success: '#34C759',
  warning: '#FF9500',
  error: '#FF3B30',
  info: '#5AC8FA',

  // Common
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
} as const;

// constants/spacing.ts
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
} as const;

// constants/typography.ts
export const typography = {
  h1: {
    fontSize: 32,
    fontWeight: '700' as const,
    lineHeight: 40,
  },
  h2: {
    fontSize: 24,
    fontWeight: '700' as const,
    lineHeight: 32,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
  },
} as const;
```

### 2. 스타일 조직화

```typescript
// ✅ Good - 스타일을 파일 하단에 정리
const MyComponent = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Title</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.md,
    backgroundColor: colors.background,
  },
  title: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.sm,
  },
});
```

### 3. 반응형 디자인

```typescript
// utils/responsive.ts
import { Dimensions, Platform } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// 기준 디자인 크기 (iPhone 12 Pro 기준)
const BASE_WIDTH = 390;
const BASE_HEIGHT = 844;

export const wp = (percentage: number) => {
  const value = (percentage * SCREEN_WIDTH) / 100;
  return Math.round(value);
};

export const hp = (percentage: number) => {
  const value = (percentage * SCREEN_HEIGHT) / 100;
  return Math.round(value);
};

export const moderateScale = (size: number, factor = 0.5) => {
  const scale = SCREEN_WIDTH / BASE_WIDTH;
  return size + (scale - 1) * factor * size;
};

// 사용 예시
const styles = StyleSheet.create({
  container: {
    width: wp(90), // 화면 너비의 90%
    height: hp(50), // 화면 높이의 50%
    padding: moderateScale(16),
  },
});
```

## 성능 최적화

### 1. FlatList 최적화

```typescript
// ✅ Good - 최적화된 FlatList
const UserList: React.FC = () => {
  const renderItem = useCallback(({ item }: { item: User }) => {
    return <UserCard user={item} />;
  }, []);

  const keyExtractor = useCallback((item: User) => item.id, []);

  const getItemLayout = useCallback(
    (data, index) => ({
      length: ITEM_HEIGHT,
      offset: ITEM_HEIGHT * index,
      index,
    }),
    [],
  );

  return (
    <FlatList
      data={users}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      getItemLayout={getItemLayout}
      removeClippedSubviews={true}
      maxToRenderPerBatch={10}
      windowSize={10}
      initialNumToRender={10}
    />
  );
};
```

### 2. React.memo 활용

```typescript
// ✅ Good - 불필요한 리렌더링 방지
interface UserCardProps {
  user: User;
  onPress: (id: string) => void;
}

export const UserCard = React.memo<UserCardProps>(
  ({ user, onPress }) => {
    const handlePress = useCallback(() => {
      onPress(user.id);
    }, [user.id, onPress]);

    return (
      <TouchableOpacity onPress={handlePress}>
        <Text>{user.name}</Text>
      </TouchableOpacity>
    );
  },
  (prevProps, nextProps) => {
    // 커스텀 비교 함수
    return prevProps.user.id === nextProps.user.id;
  },
);
```

### 3. useMemo와 useCallback

```typescript
const MyComponent = ({ data }: { data: Item[] }) => {
  // ✅ Good - 비용이 큰 계산은 메모이제이션
  const sortedData = useMemo(() => {
    return data.sort((a, b) => a.name.localeCompare(b.name));
  }, [data]);

  // ✅ Good - 콜백 함수 메모이제이션
  const handlePress = useCallback(
    (id: string) => {
      console.log('Pressed:', id);
    },
    [],
  );

  return <FlatList data={sortedData} />;
};
```

### 4. 이미지 최적화

```typescript
import FastImage from 'react-native-fast-image';

// ✅ Good - FastImage 사용
<FastImage
  style={styles.image}
  source={{
    uri: imageUrl,
    priority: FastImage.priority.normal,
  }}
  resizeMode={FastImage.resizeMode.cover}
/>

// 이미지 캐싱 설정
FastImage.preload([
  { uri: 'https://example.com/image1.jpg' },
  { uri: 'https://example.com/image2.jpg' },
]);
```

## 테스트 전략

### 1. 컴포넌트 테스트

```typescript
// screens/auth/LoginScreen.test.tsx
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { LoginScreen } from './LoginScreen';
import { authApi } from '../../services/api/auth.api';

jest.mock('../../services/api/auth.api');

describe('LoginScreen', () => {
  it('should show validation errors for empty fields', async () => {
    const { getByText, getByPlaceholderText } = render(<LoginScreen />);

    const loginButton = getByText('로그인');
    fireEvent.press(loginButton);

    await waitFor(() => {
      expect(getByText('이메일을 입력해주세요.')).toBeTruthy();
      expect(getByText('비밀번호를 입력해주세요.')).toBeTruthy();
    });
  });

  it('should call login API with correct credentials', async () => {
    const mockLogin = jest.fn().mockResolvedValue({ token: 'fake-token' });
    (authApi.login as jest.Mock) = mockLogin;

    const { getByPlaceholderText, getByText } = render(<LoginScreen />);

    fireEvent.changeText(
      getByPlaceholderText('이메일'),
      'test@example.com',
    );
    fireEvent.changeText(getByPlaceholderText('비밀번호'), 'password123');
    fireEvent.press(getByText('로그인'));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });
  });
});
```

### 2. 훅 테스트

```typescript
// hooks/useAuth.test.ts
import { renderHook, act } from '@testing-library/react-hooks';
import { useAuth } from './useAuth';
import { Provider } from 'react-redux';
import { store } from '../store/store';

const wrapper = ({ children }) => <Provider store={store}>{children}</Provider>;

describe('useAuth', () => {
  it('should login successfully', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      const response = await result.current.login(
        'test@example.com',
        'password',
      );
      expect(response.success).toBe(true);
    });

    expect(result.current.isAuthenticated).toBe(true);
  });

  it('should logout successfully', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.logout();
    });

    expect(result.current.isAuthenticated).toBe(false);
  });
});
```

## 네비게이션 가이드

### 1. 네비게이션 구조

```typescript
// navigation/AppNavigator.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../hooks/useAuth';
import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';

const Stack = createStackNavigator();

export const AppNavigator = () => {
  const { isAuthenticated } = useAuth();

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <Stack.Screen name="Main" component={MainNavigator} />
        ) : (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
```

### 2. 타입 안전한 네비게이션

```typescript
// navigation/types.ts
import type {
  CompositeNavigationProp,
  RouteProp,
} from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';

export type RootStackParamList = {
  Home: undefined;
  Profile: { userId: string };
  Post: { postId: string; mode?: 'view' | 'edit' };
};

export type HomeScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'Home'
>;

// 화면에서 사용
const navigation = useNavigation<HomeScreenNavigationProp>();
navigation.navigate('Profile', { userId: '123' }); // 타입 안전
```

## 네이티브 모듈 연동

### 1. 네이티브 모듈 사용

```typescript
// 카메라 권한 요청 예시
import { Platform, PermissionsAndroid } from 'react-native';
import { Camera } from 'react-native-vision-camera';

const requestCameraPermission = async () => {
  if (Platform.OS === 'android') {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.CAMERA,
      {
        title: '카메라 권한 요청',
        message: '사진을 촬영하기 위해 카메라 권한이 필요합니다.',
        buttonPositive: '허용',
        buttonNegative: '거부',
      },
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  }

  // iOS
  const permission = await Camera.requestCameraPermission();
  return permission === 'granted';
};
```

### 2. 플랫폼별 코드 분리

```typescript
// utils/platform.ts
import { Platform } from 'react-native';

export const isIOS = Platform.OS === 'ios';
export const isAndroid = Platform.OS === 'android';

// 컴포넌트에서 사용
const styles = StyleSheet.create({
  container: {
    paddingTop: Platform.select({
      ios: 20,
      android: 0,
    }),
  },
});

// 또는 플랫폼별 파일
// MyComponent.ios.tsx
// MyComponent.android.tsx
```

## 체크리스트

### 새 화면 추가 시

- [ ] 타입 정의 (navigation types)
- [ ] 화면 컴포넌트 생성
- [ ] 필요한 커스텀 훅 작성
- [ ] API 통신 로직 구현
- [ ] 로딩/에러 상태 처리
- [ ] 스타일 정의 (디자인 시스템 활용)
- [ ] 테스트 작성
- [ ] 접근성(Accessibility) 고려
- [ ] 네비게이션 연결

### 성능 최적화 체크

- [ ] FlatList 최적화 적용
- [ ] 불필요한 리렌더링 제거 (React.memo, useMemo, useCallback)
- [ ] 이미지 최적화 (FastImage 사용)
- [ ] 번들 크기 최적화
- [ ] 메모리 누수 확인

### 배포 전

- [ ] iOS 빌드 성공
- [ ] Android 빌드 성공
- [ ] 모든 테스트 통과
- [ ] 린트 에러 없음
- [ ] 성능 프로파일링
- [ ] 실제 기기 테스트
- [ ] 다양한 화면 크기 테스트
- [ ] 오프라인 모드 동작 확인

---

**더 자세한 내용은 [공통 가이드](../../AGENTS.md)를 참고하세요.**
