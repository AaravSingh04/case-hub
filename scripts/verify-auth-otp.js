/**
 * Verification test for Real Resend Email OTP Delivery, Security & Admin Diagnostics
 */

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

async function testAuthFlow() {
  console.log(`\n======================================================`);
  console.log(`TESTING REAL RESEND OTP REGISTRATION & SECURITY SYSTEM`);
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

  // -------------------------------------------------------------
  // TEST 1: No Simulation Mode & Proper Error when Key Missing
  // -------------------------------------------------------------
  console.log('\n--- SUITE 1: Credential Validation & Zero-Leakage Checks ---');
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

  const sendData = await sendRes.json();
  const hasResendKey = Boolean(process.env.RESEND_API_KEY);

  if (!hasResendKey) {
    // When RESEND_API_KEY is not configured, it MUST NOT simulate or pretend success
    assert(
      sendRes.status === 502,
      'POST /api/auth/register/send-otp returns 502 when RESEND_API_KEY is missing (Requirement 10: No simulation)'
    );
    assert(
      sendData.error && sendData.error.includes('RESEND_API_KEY'),
      'Returns clear actionable error mentioning RESEND_API_KEY'
    );
    assert(!sendData.devCode, 'CRITICAL: No devCode or OTP is exposed in response (Requirement 5)');
    assert(!sendData.otp, 'CRITICAL: No OTP field in response (Requirement 5)');
  } else {
    assert(sendRes.status === 200, 'POST /api/auth/register/send-otp returns 200 with active Resend API key');
    assert(sendData.success === true, 'Returns success: true');
    assert(!sendData.devCode, 'CRITICAL: No devCode exposed in response');
    assert(!sendData.otp, 'CRITICAL: No OTP exposed in response');
  }

  // -------------------------------------------------------------
  // TEST 2: Server-Side OTP Verification & Attempt Limits
  // -------------------------------------------------------------
  console.log('\n--- SUITE 2: Server-Side OTP Security, Attempt Limits & Tokens ---');
  const dbPath = path.join(__dirname, '..', 'data', 'case_hub.db.json');
  const dbData = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

  // Seed a secure verification record with a known 6-digit OTP
  const seededOtp = '849201';
  const salt = crypto.randomBytes(16).toString('hex');
  const otpHmac = crypto.createHmac('sha256', salt).update(seededOtp).digest('hex');
  const verifyEmail = `verified_${Date.now()}@casehub.internal`;

  const seededRecord = {
    email: verifyEmail,
    otp_hash: otpHmac,
    salt,
    expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    attempts: 0,
    max_attempts: 5,
    full_name: 'Aanya Singhania',
    program_of_study: 'MBA Product Management',
    year_of_study: 'Class of 2026',
    phone_number: '+91 99999 88888',
    created_at: new Date().toISOString(),
  };

  dbData.email_verifications = dbData.email_verifications || [];
  dbData.email_verifications = dbData.email_verifications.filter((v) => v.email !== verifyEmail);
  dbData.email_verifications.push(seededRecord);
  fs.writeFileSync(dbPath, JSON.stringify(dbData, null, 2), 'utf8');

  // Verify bad OTP is rejected with 400
  const badOtpRes = await fetch(`${BASE_URL}/api/auth/register/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: verifyEmail,
      otp: '000000',
    }),
  });
  assert(badOtpRes.status === 400, 'Invalid OTP rejected with 400 Bad Request');
  const badOtpData = await badOtpRes.json();
  assert(badOtpData.error && badOtpData.error.includes('attempts remaining'), 'Bad OTP response reports remaining attempts');

  // Verify valid OTP succeeds and returns verificationToken
  const validOtpRes = await fetch(`${BASE_URL}/api/auth/register/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: verifyEmail,
      otp: seededOtp,
    }),
  });
  assert(validOtpRes.status === 200, 'Valid 6-digit OTP accepted with 200 OK');
  const validOtpData = await validOtpRes.json();
  assert(Boolean(validOtpData.verificationToken), 'Returns secure verification token');

  // -------------------------------------------------------------
  // TEST 3: Account Completion & Profile Persistence
  // -------------------------------------------------------------
  console.log('\n--- SUITE 3: Account Completion & Role Integrity ---');
  // Password mismatch rejected
  const mismatchRes = await fetch(`${BASE_URL}/api/auth/register/complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: verifyEmail,
      verificationToken: validOtpData.verificationToken,
      password: 'SecurePassword123!',
      confirmPassword: 'MismatchPassword123!',
    }),
  });
  assert(mismatchRes.status === 400, 'Password mismatch rejected with 400 Bad Request');

  // Successful completion
  const completeRes = await fetch(`${BASE_URL}/api/auth/register/complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: verifyEmail,
      verificationToken: validOtpData.verificationToken,
      password: 'ValidPassword123!',
      confirmPassword: 'ValidPassword123!',
    }),
  });
  assert(completeRes.status === 200 || completeRes.status === 201, 'POST /api/auth/register/complete succeeds with 200/201');
  const completeData = await completeRes.json();
  assert(completeData.user && completeData.user.email === verifyEmail, 'Created user matches verified email');
  assert(completeData.user.display_name === 'Aanya Singhania', 'Student full name correctly saved from Step 1');
  assert(completeData.user.program_of_study === 'MBA Product Management', 'Program of study saved');
  assert(completeData.user.role === 'student', 'User role is strictly student (no privilege escalation)');
  assert(completeData.user.email_verified === true, 'User email_verified is set to true only after valid OTP');

  // -------------------------------------------------------------
  // TEST 4: Login with Password Authentication
  // -------------------------------------------------------------
  console.log('\n--- SUITE 4: Password Login & Wrong Password Rejection ---');
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: verifyEmail,
      password: 'ValidPassword123!',
    }),
  });
  assert(loginRes.status === 200, 'Login with correct email and password returns 200');
  const loginData = await loginRes.json();
  assert(loginData.user && loginData.user.email === verifyEmail, 'Login session returns authenticated user');

  const badLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: verifyEmail,
      password: 'WrongPassword!',
    }),
  });
  assert(badLoginRes.status === 401, 'Login with wrong password returns 401 Unauthorized');

  // -------------------------------------------------------------
  // TEST 5: Admin Test Email Diagnostic Endpoint
  // -------------------------------------------------------------
  console.log('\n--- SUITE 5: Admin Email Diagnostics Endpoint Access Control ---');
  // Unauthenticated access
  const unauthGetRes = await fetch(`${BASE_URL}/api/admin/test-email`);
  assert(unauthGetRes.status === 401, 'Unauthenticated GET /api/admin/test-email returns 401');

  const unauthPostRes = await fetch(`${BASE_URL}/api/admin/test-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ recipientEmail: 'admin@casehub.internal' }),
  });
  assert(unauthPostRes.status === 401, 'Unauthenticated POST /api/admin/test-email returns 401');

  // Authenticate as Admin (usr_admin_001)
  const adminLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: 'usr_admin_001' }),
  });
  const adminCookie = adminLoginRes.headers.get('set-cookie') || '';
  assert(adminLoginRes.status === 200, 'Admin session authenticated');

  // Authenticated GET /api/admin/test-email
  const authGetRes = await fetch(`${BASE_URL}/api/admin/test-email`, {
    headers: { cookie: adminCookie },
  });
  assert(authGetRes.status === 200, 'Admin GET /api/admin/test-email returns 200');
  const emailConfig = await authGetRes.json();
  assert('configured' in emailConfig, 'Returns configured boolean');
  assert('from' in emailConfig, 'Returns sender identity');
  assert(Array.isArray(emailConfig.notificationRecipients), 'Returns notification recipients array');

  // Authenticated POST /api/admin/test-email
  const authPostRes = await fetch(`${BASE_URL}/api/admin/test-email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      cookie: adminCookie,
    },
    body: JSON.stringify({ recipientEmail: 'admin@casehub.internal' }),
  });
  const postData = await authPostRes.json();
  if (emailConfig.configured) {
    assert(postData.success === true, 'Test email dispatch succeeded via configured Resend');
  } else {
    assert(postData.success === false, 'Test email returns clear configuration error when RESEND_API_KEY is missing');
    assert(Boolean(postData.error), `Error explained cleanly: ${postData.error}`);
  }

  // -------------------------------------------------------------
  // TEST 6: Route Redirection
  // -------------------------------------------------------------
  console.log('\n--- SUITE 6: Navigation & Route Integrity ---');
  const resRedirect = await fetch(`${BASE_URL}/resources`, { redirect: 'manual' });
  assert(
    resRedirect.status === 307 ||
      resRedirect.status === 308 ||
      (resRedirect.headers.get('location') && resRedirect.headers.get('location').includes('/competitions')),
    'GET /resources cleanly redirects to /competitions'
  );

  console.log(`\n======================================================`);
  console.log(`VERIFICATION RESULT: ${passed} PASSED, ${failed} FAILED`);
  console.log(`======================================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

testAuthFlow().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
