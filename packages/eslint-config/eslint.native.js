import reactHooks from 'eslint-plugin-react-hooks';
import reactNativeConfig from '@react-native/eslint-config';
import eslintConfigPrettier from "eslint-config-prettier";
import react from "eslint-plugin-react";
import { defineConfig } from 'eslint/config';

export default defineConfig([
  reactNativeConfig,
  reactHooks.configs.flat.recommended,
  eslintConfigPrettier,
  react.configs.flat.recommended
]);