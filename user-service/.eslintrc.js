module.exports = {
  env: {
    browser: true,
    commonjs: true,
    es2021: true,
    node: true,
    jest: true,
  },
  extends: [
    'airbnb-base',
  ],
  parserOptions: {
    ecmaVersion: 12,
  },
  rules: {
    'no-console': 'warn',
    'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'no-underscore-dangle': 'off',
    'max-len': ['error', { code: 120 }],
    'indent': ['error', 2],
    'quotes': ['error', 'single'],
    'semi': ['error', 'always'],
    'comma-dangle': ['error', 'always-multiline'],
    'object-curly-spacing': ['error', 'always'],
    'array-bracket-spacing': ['error', 'never'],
    'no-param-reassign': ['error', { props: false }],
    'prefer-destructuring': 'off',
    'consistent-return': 'off',
    'no-restricted-syntax': 'off',
    'guard-for-in': 'off',
    'no-continue': 'off',
    'import/no-dynamic-require': 'off',
    'global-require': 'off',
  },
  globals: {
    prisma: 'readonly',
  },
};
