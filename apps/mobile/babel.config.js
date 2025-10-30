module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'module:react-native-dotenv',
      {
        envName: 'APP_ENV',
        moduleName: '@env',
        path: process.env.ENV_FILE || '.env.dev',
        safe: false,
        allowUndefined: true,
        verbose: false,
      },
    ],
  ],
};
