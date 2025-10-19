// tests/config.js
export default {
  Memory: true,         // true = pakai MongoMemoryServer
  IP: '127.0.0.1',      // dipakai kalau Memory=false
  Port: 27017,          // dipakai kalau Memory=false
  Database: 'jestdb',   // nama DB in-memory
};
