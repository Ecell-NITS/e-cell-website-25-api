import request from 'supertest';
import app from '../src/app'; 
import prisma from '../prisma/client';

const TEST_USER = {
  email: "autotest@example.com",
  password: "password123",
  name: "Auto Tester"
};

describe('Authentication System "Master Run"', () => {

  beforeAll(async () => {
    await prisma.user.deleteMany({ where: { email: TEST_USER.email } });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: TEST_USER.email } });
    await prisma.$disconnect();
  });

  let otpCode = "";
  let authToken = "";

  // ✅ FIX: Added 15000 (15 seconds) timeout here
  it('1. Should Register a new user and send OTP', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(TEST_USER);

    expect(res.statusCode).toEqual(200);
    expect(res.body.message).toContain('OTP sent');
  }, 15000); 

  it('2. Should BLOCK login before verification', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: TEST_USER.email, password: TEST_USER.password });

    expect(res.statusCode).toEqual(403); 
    expect(res.body.message).toMatch(/verified/i);
  });

  it('3. Should have saved an OTP in the database', async () => {
    const user = await prisma.user.findUnique({ where: { email: TEST_USER.email } });
    expect(user).toBeDefined();
    expect(user?.otp).toHaveLength(6);
    otpCode = user?.otp || ""; 
    console.log("      (Test found OTP in DB: " + otpCode + ")");
  });

  it('4. Should Verify the email using the OTP', async () => {
    const res = await request(app)
      .post('/api/auth/verify-email')
      .send({ email: TEST_USER.email, otp: otpCode });

    expect(res.statusCode).toEqual(200);
    authToken = res.body.data.accessToken; 
  });

  it('5. Should Allow Login after verification', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: TEST_USER.email, password: TEST_USER.password });

    expect(res.statusCode).toEqual(200);
  });

  it('6. Should Access Protected Route (/me) with Token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${authToken}`); 

    expect(res.statusCode).toEqual(200);
    // This will pass now after we fix the middleware below
    expect(res.body.data.user.email).toEqual(TEST_USER.email);
  });
});