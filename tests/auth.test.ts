import request from 'supertest';
import app from '../src/app'; 
import prisma from '../prisma/client';

const TEST_USER = {
  email: "lifecycle_test@example.com",
  password: "password123",
  name: "Lifecycle User",
  bio: "Initial Bio",
  linkedin: "https://linkedin.com/in/initial"
};

const UPDATED_PROFILE = {
  name: "Updated Name",
  bio: "Updated Bio",
  linkedin: "https://linkedin.com/in/updated",
  facebook: "https://facebook.com/new"
};

describe('Full Auth & Profile Lifecycle', () => {

  // --- CLEANUP BEFORE & AFTER ---
  beforeAll(async () => {
    await prisma.user.deleteMany({ where: { email: TEST_USER.email } });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: TEST_USER.email } });
    await prisma.$disconnect();
  });

  let otpCode = "";
  let authToken = "";
  let userId = "";

  // ---------------------------------------------------------
  // 1. REGISTRATION & LOGIN
  // ---------------------------------------------------------

  it('1. Register User', async () => {
    const res = await request(app).post('/api/auth/register').send(TEST_USER);
    expect(res.statusCode).toEqual(200);
  });

  it('2. Fetch OTP from DB (Simulate Email)', async () => {
    const user = await prisma.user.findUnique({ where: { email: TEST_USER.email } });
    
    expect(user).toBeDefined();
    // Use .not.toBeNull() safely
    expect(user?.otp).toBeTruthy();
    expect(user?.otp?.length).toBe(6);
    
    otpCode = user?.otp || "";
    userId = user?.id || "";
  });

  it('3. Verify Email & Login', async () => {
    const res = await request(app)
      .post('/api/auth/verify-email')
      .send({ email: TEST_USER.email, otp: otpCode });

    expect(res.statusCode).toEqual(200);
    expect(res.body.data.accessToken).toBeDefined();
    
    authToken = res.body.data.accessToken; 
  });

  // ---------------------------------------------------------
  // 2. PROFILE MANAGEMENT
  // ---------------------------------------------------------

  it('4. Edit Profile (Bio & Socials)', async () => {
    const res = await request(app)
      .patch('/api/auth/edit-profile')
      .set('Authorization', `Bearer ${authToken}`)
      .send(UPDATED_PROFILE);

    expect(res.statusCode).toEqual(200);
    expect(res.body.data.user.bio).toEqual(UPDATED_PROFILE.bio);
    expect(res.body.data.user.name).toEqual(UPDATED_PROFILE.name);
  });

  it('5. Check Public Profile (Verify Update)', async () => {
    const res = await request(app).get(`/api/auth/public-profile/${userId}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.data.bio).toEqual(UPDATED_PROFILE.bio); 
    expect(res.body.data.facebook).toEqual(UPDATED_PROFILE.facebook);
  });

  // ---------------------------------------------------------
  // 3. SECURITY & PASSWORD
  // ---------------------------------------------------------

  it('6. Update Password', async () => {
    const res = await request(app)
      .patch('/api/auth/update-password')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        currentPassword: TEST_USER.password,
        newPassword: "newpassword456"
      });

    expect(res.statusCode).toEqual(200);
  });

  it('7. Login with OLD Password (Should Fail)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: TEST_USER.email, password: TEST_USER.password });

    expect(res.statusCode).toEqual(401); 
  });

  it('8. Login with NEW Password (Should Succeed)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: TEST_USER.email, password: "newpassword456" });

    expect(res.statusCode).toEqual(200);
    authToken = res.body.data.accessToken; 
  });

  // ---------------------------------------------------------
  // 4. ADMIN & DELETION
  // ---------------------------------------------------------

  it('9. Admin Route Access (Should be Blocked)', async () => {
    const res = await request(app)
      .get('/api/auth/all-accounts')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.statusCode).toEqual(403); 
  });

  it('10. Promote to Admin (Backend Hack)', async () => {
    // Manually update DB to make this user an ADMIN
    await prisma.user.update({
      where: { email: TEST_USER.email },
      data: { role: 'ADMIN' }
    });
  });

  it('11. Admin Route Access (Should be Allowed)', async () => {
    const res = await request(app)
      .get('/api/auth/all-accounts')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.results).toBeGreaterThan(0);
  });

  it('12. Delete Account (Soft Delete)', async () => {
    const res = await request(app)
      .delete('/api/auth/delete-account')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ reason: "Testing finished" });

    expect(res.statusCode).toEqual(200);
  });

  it('13. Verify Account is Deleted (Login fails)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: TEST_USER.email, password: "newpassword456" });

    // Expect either 403 (Unverified) or 401 (Incorrect credentials)
    expect([401, 403]).toContain(res.statusCode);

    const deletedUser = await prisma.user.findFirst({ where: { id: userId } });
    
    // Check deactivation logic
    const isDeactivated = !deletedUser?.isVerified || deletedUser?.email !== TEST_USER.email;
    expect(isDeactivated).toBe(true);
  });

});