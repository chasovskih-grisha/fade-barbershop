module.exports = {
  root: true,
  extends: ['../../.eslintrc.js', 'plugin:react/recommended', 'plugin:react-hooks/recommended'],
  plugins: ['react', 'react-hooks'],
  settings: {
    react: {
      version: 'detect',
    },
  },
  rules: {
    // React Native / Expo JSX runtime — no React import required
    'react/react-in-jsx-scope': 'off',
  },
};
