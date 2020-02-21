module.exports = {
  rules: {
    "@typescript-eslint/no-unused-expressions": "off",
    "comma-dangle": ["error", "always-multiline"],
    "max-len": ["warn", { code: 100, ignoreTemplateLiterals: true }],
    "no-async-promise-executor": "off",
    "no-undef": ["error"],
    "no-var": ["error"],
    "object-curly-spacing": ["error", "always"],
    "quotes": ["error", "double", { allowTemplateLiterals: true }],
    "semi": ["error", "always"],
    "spaced-comment": "off",
    "no-prototype-builtins": "off",
    "sort-keys": ["error"],
  },
  settings: {
    react: {
      version: "detect",
    },
  },
  env: {
    browser: true,
    es6: true,
  },
  extends: [
    "plugin:@typescript-eslint/eslint-recommended",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 2018,
    sourceType: "module",
  },
  plugins: ["@typescript-eslint"],
};
