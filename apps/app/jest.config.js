/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  // pnpm keeps packages under node_modules/.pnpm, so the transform allow-list
  // has to match through that folder too.
  transformIgnorePatterns: [
    'node_modules/(?!(?:.pnpm/[^/]+/node_modules/)?((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@agriflow/.*))',
  ],
}
