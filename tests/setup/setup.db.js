import { connectDB, clearDB, disconnectDB } from '../helpers/db.js';

beforeAll(async () => { await connectDB(); });
afterEach(async () => { await clearDB(); });
afterAll(async () => { await disconnectDB(); });
