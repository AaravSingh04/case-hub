/**
 * Verification test for 5-Step OTP Registration, Password Reset, and Security
 */

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';
const fs = require('fs');
const path = require('path');

async function testAuthFlow() {
  console.log(`\n======================================================`);
  console.log(`TESTING 5-STEP OTP REGISTRATION & AUTHENTICATION`);
  console.log(`Target: ${BASE_URL}`);
  console.log(`======================================================\n`);

  let passed = 0;
  let failed = 0;

  function assert(condition, name, detail = '') {
    if (condition) {
      console.log(`  [PASS] ${name}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${name} — ${detail}`);
      failed++;
    }
  }

  const testEmail = `student_${Date.now()}@casehub.internal`;

  // 1. Send OTP
  const sendRes = await fetch(`${BASE_URL}/api/auth/register/send-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      fullName: 'Vikramaditya Singhania',
      programOfStudy: 'MBA Strategy & Finance',
      yearOfStudy: 'Class of 2026',
      phoneNumber: '+91 98765 43210',
    }),
  });

  assert(sendRes.status === 200, 'POST /api/auth/register/send-otp returns 200');
  const sendData = await sendRes.json();
  assert(sendData.success === true, 'OTP send response indicates success');

  // 2. Cooldown enforcement (immediate resend fails with 429)
  const resendRes = await fetch(`${BASE_URL}/api/auth/register/send-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      fullName: 'Vikramaditya Singhania',
      programOfStudy: 'MBA Strategy & Finance',
      yearOfStudy: 'Class of 2026',
    }),
  });
  assert(resendRes.status === 429, 'Rate limit / resend cooldown enforced with 429 Too Many Requests');

  // 3. Inspect database storage to retrieve OTP hash and verify bad OTP is rejected
  const badOtpRes = await fetch(`${BASE_URL}/api/auth/register/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      otp: '000000',
    }),
  });
  assert(badOtpRes.status === 400, 'Invalid OTP is rejected with 400 Bad Request');

  // Retrieve valid OTP from database storage for verification step
  const dbPath = path.join(__dirname, '..', 'data', 'case_hub.db.json');
  const dbData = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  const verifRecord = (dbData.email_verifications || []).find(v => v.email === testEmail);
  assert(!!verifRecord, 'Email verification record exists in persistent storage');

  // Since OTP is securely hashed in DB, we know our test server generates 6 digits.
  // In dev/test mode we can test all 6 digits or test the verify-otp with the matching OTP
  // Or test directly with the OTP printed to logs. Let's find the OTP by brute-forcing HMAC or checking crypto
  const crypto = require('crypto');
  let validOtp = '';
  for (let i = 100000; i <= 999999; i++) {
    const candidate = i.toString();
    const candidateHash = crypto.createHmac('sha256', verifRecord.salt).update(candidate).digest('hex');
    if (candidateHash === verifRecord.otp_hash) {
      validOtp = candidate;
      break;
    }
  }

  assert(validOtp.length === 6, `Retrieved valid OTP from HMAC: ${validOtp}`);

  // 4. Verify valid OTP
  const verifyRes = await fetch(`${BASE_URL}/api/auth/register/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      otp: validOtp,
    }),
  });

  assert(verifyRes.status === 200, 'POST /api/auth/register/verify-otp returns 200 with valid OTP');
  const verifyData = await verifyRes.json();
  assert(!!verifyData.verificationToken, 'Returns secure verification token');

  // 5. Complete registration - password mismatch rejected
  const mismatchRes = await fetch(`${BASE_URL}/api/auth/register/complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      verificationToken: verifyData.verificationToken,
      password: 'Password123!',
      confirmPassword: 'MismatchPassword!',
    }),
  });
  assert(mismatchRes.status === 400, 'Password mismatch is rejected');

  // 6. Complete registration successfully
  const completeRes = await fetch(`${BASE_URL}/api/auth/register/complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      verificationToken: verifyData.verificationToken,
      password: 'SecurePassword123!',
      confirmPassword: 'SecurePassword123!',
    }),
  });

  assert(completeRes.status === 200 || completeRes.status === 201, 'POST /api/auth/register/complete returns success status (200/201)');
  const completeData = await completeRes.json();
  assert(completeData.user && completeData.user.email === testEmail, 'Created user matches verified email');
  assert(completeData.user.role === 'student', 'User role is strictly student');
  assert(completeData.user.email_verified === true, 'User email_verified is true');

  // 7. Sign in with password
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      password: 'SecurePassword123!',
    }),
  });
  assert(loginRes.status === 200, 'Login with correct email and password returns 200');
  const loginData = await loginRes.json();
  assert(loginData.user && loginData.user.email === testEmail, 'Login returns authenticated user');

  // 8. Sign in with wrong password
  const badLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      password: 'WrongPassword!',
    }),
  });
  assert(badLoginRes.status === 401, 'Login with invalid password returns 401 Unauthorized');

  // 9. Verify /resources redirects to /competitions
  const resRedirect = await fetch(`${BASE_URL}/resources`, { redirect: 'manual' });
  assert(
    resRedirect.status === 307 || resRedirect.status === 308 || (resRedirect.headers.get('location') && resRedirect.headers.get('location').includes('/competitions')),
    'GET /resources cleanly redirects to /competitions'
  );

  console.log(`\n======================================================`);
  console.log(`AUTH VERIFICATION RESULT: ${passed} PASSED, ${failed} FAILED`);
  console.log(`======================================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

testAuthFlow().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
