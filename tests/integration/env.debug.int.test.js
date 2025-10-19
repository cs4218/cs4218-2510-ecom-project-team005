// tests/integration/env.debug.int.test.js
test('MONGO_URL terisi', () => {
  // seharusnya ada nilai seperti "mongodb://127.0.0.1:XXXXX/jestdb"
  expect(process.env.MONGO_URL).toBeTruthy();
});
