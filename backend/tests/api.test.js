const request = require('supertest');

// Set test environment before loading app
process.env.NODE_ENV = 'test';
process.env.DATABASE_PATH = ':memory:';
process.env.JWT_SECRET = 'test-secret-key';

const app = require('../src/index');
const { getDb, closeDatabase } = require('../src/utils/database');

let authToken;
let userId;
let familyId;
let babyId;
let secondUserToken;
let secondUserId;

afterAll(() => {
  closeDatabase();
});

describe('Auth API', () => {
  test('POST /api/auth/register - should register a new user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'parent@test.com',
        password: 'password123',
        name: 'María García'
      });

    expect(res.status).toBe(201);
    expect(res.body.user).toBeDefined();
    expect(res.body.token).toBeDefined();
    expect(res.body.family).toBeDefined();
    expect(res.body.user.email).toBe('parent@test.com');

    authToken = res.body.token;
    userId = res.body.user.id;
    familyId = res.body.family.id;
  });

  test('POST /api/auth/register - should reject duplicate email', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'parent@test.com',
        password: 'password123',
        name: 'Duplicate'
      });

    expect(res.status).toBe(409);
  });

  test('POST /api/auth/register - register second user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'nanny@test.com',
        password: 'password123',
        name: 'Ana López'
      });

    expect(res.status).toBe(201);
    secondUserToken = res.body.token;
    secondUserId = res.body.user.id;
  });

  test('POST /api/auth/login - should login', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'parent@test.com', password: 'password123' });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.families).toHaveLength(1);
  });

  test('POST /api/auth/login - should reject wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'parent@test.com', password: 'wrongpassword' });

    expect(res.status).toBe(401);
  });

  test('GET /api/auth/me - should get profile', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.user.name).toBe('María García');
  });
});

describe('Baby API', () => {
  test('POST /api/babies - should create a baby', async () => {
    const res = await request(app)
      .post('/api/babies')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        family_id: familyId,
        name: 'Sofia',
        birth_date: '2025-06-15',
        gender: 'female',
        weight_at_birth: 3.2,
        height_at_birth: 50
      });

    expect(res.status).toBe(201);
    expect(res.body.baby.name).toBe('Sofia');
    babyId = res.body.baby.id;
  });

  test('GET /api/babies/family/:familyId - should list babies', async () => {
    const res = await request(app)
      .get(`/api/babies/family/${familyId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.babies).toHaveLength(1);
  });

  test('GET /api/babies/:babyId - should get baby details', async () => {
    const res = await request(app)
      .get(`/api/babies/${babyId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.baby.name).toBe('Sofia');
    expect(res.body.goals).toBeDefined();
    expect(res.body.today).toBeDefined();
  });

  test('POST /api/babies/:babyId/goals - should set goals', async () => {
    const res = await request(app)
      .post(`/api/babies/${babyId}/goals`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ goal_type: 'feeding_oz', target_value: 28 });

    expect(res.status).toBe(200);
  });
});

describe('Sharing API', () => {
  let shareCode;

  test('POST /api/sharing/code - should create sharing code', async () => {
    const res = await request(app)
      .post('/api/sharing/code')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        family_id: familyId,
        role: 'nanny',
        permissions: ['read', 'write'],
        expires_in_hours: 24,
        access_duration_hours: 8
      });

    expect(res.status).toBe(201);
    expect(res.body.code).toBeDefined();
    expect(res.body.code.length).toBe(8);
    shareCode = res.body.code;
  });

  test('POST /api/sharing/redeem - should redeem code', async () => {
    const res = await request(app)
      .post('/api/sharing/redeem')
      .set('Authorization', `Bearer ${secondUserToken}`)
      .send({ code: shareCode });

    expect(res.status).toBe(200);
    expect(res.body.family_id).toBe(familyId);
    expect(res.body.role).toBe('nanny');
    expect(res.body.expires_at).toBeDefined();
  });

  test('GET /api/sharing/family/:familyId/members - should list members', async () => {
    const res = await request(app)
      .get(`/api/sharing/family/${familyId}/members`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.members.length).toBeGreaterThanOrEqual(2);
  });
});

describe('Tracking API', () => {
  test('POST /api/tracking/feedings - should log feeding', async () => {
    const res = await request(app)
      .post('/api/tracking/feedings')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        baby_id: babyId,
        type: 'bottle',
        amount_oz: 4,
        duration_minutes: 15,
        started_at: new Date().toISOString(),
        ended_at: new Date(Date.now() + 15 * 60000).toISOString()
      });

    expect(res.status).toBe(201);
    expect(res.body.feeding.amount_oz).toBe(4);
  });

  test('GET /api/tracking/feedings/:babyId - should get feedings', async () => {
    const res = await request(app)
      .get(`/api/tracking/feedings/${babyId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.feedings).toHaveLength(1);
    expect(res.body.daily_total.total_oz).toBe(4);
  });

  test('POST /api/tracking/sleep - should log sleep', async () => {
    const startTime = new Date();
    const endTime = new Date(Date.now() + 2 * 60 * 60000);

    const res = await request(app)
      .post('/api/tracking/sleep')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        baby_id: babyId,
        started_at: startTime.toISOString(),
        ended_at: endTime.toISOString(),
        quality: 'good',
        location: 'crib'
      });

    expect(res.status).toBe(201);
    expect(res.body.sleep.quality).toBe('good');
  });

  test('GET /api/tracking/sleep/:babyId - should get sleep records', async () => {
    const res = await request(app)
      .get(`/api/tracking/sleep/${babyId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.sleep_records).toHaveLength(1);
  });

  test('POST /api/tracking/meals - should log meal', async () => {
    const res = await request(app)
      .post('/api/tracking/meals')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        baby_id: babyId,
        meal_type: 'lunch',
        foods: 'Puré de zanahoria y manzana',
        amount: 'most',
        reaction: 'liked',
        recorded_at: new Date().toISOString()
      });

    expect(res.status).toBe(201);
    expect(res.body.meal.foods).toContain('zanahoria');
  });

  test('POST /api/tracking/symptoms - should log symptom', async () => {
    const res = await request(app)
      .post('/api/tracking/symptoms')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        baby_id: babyId,
        symptom_type: 'fiebre',
        severity: 'mild',
        temperature: 37.8,
        description: 'Temperatura ligeramente elevada',
        recorded_at: new Date().toISOString()
      });

    expect(res.status).toBe(201);
    expect(res.body.symptom.temperature).toBe(37.8);
  });

  test('POST /api/tracking/illnesses - should log illness', async () => {
    const res = await request(app)
      .post('/api/tracking/illnesses')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        baby_id: babyId,
        name: 'Resfriado común',
        diagnosis: 'Infección viral leve',
        doctor_name: 'Dr. Rodríguez',
        started_at: new Date().toISOString()
      });

    expect(res.status).toBe(201);
    expect(res.body.illness.name).toBe('Resfriado común');
  });

  test('POST /api/tracking/medicines - should log medicine', async () => {
    const res = await request(app)
      .post('/api/tracking/medicines')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        baby_id: babyId,
        name: 'Paracetamol',
        dosage: '2.5',
        dosage_unit: 'ml',
        frequency: 'cada 8 horas',
        administered_at: new Date().toISOString()
      });

    expect(res.status).toBe(201);
    expect(res.body.medicine.name).toBe('Paracetamol');
  });

  test('POST /api/tracking/moods - should log mood', async () => {
    const res = await request(app)
      .post('/api/tracking/moods')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        baby_id: babyId,
        mood: 'happy',
        intensity: 4,
        context: 'Después de comer',
        recorded_at: new Date().toISOString()
      });

    expect(res.status).toBe(201);
    expect(res.body.mood.mood).toBe('happy');
  });

  test('GET /api/tracking/summary/:babyId - should get daily summary', async () => {
    const res = await request(app)
      .get(`/api/tracking/summary/${babyId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.summary).toBeDefined();
    expect(res.body.summary.feedings.total_oz).toBe(4);
    expect(res.body.summary.goal_progress).toBeDefined();
  });

  test('GET /api/tracking/timeline/:babyId - should get timeline', async () => {
    const res = await request(app)
      .get(`/api/tracking/timeline/${babyId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.timeline.length).toBeGreaterThan(0);
  });
});

describe('Notifications API', () => {
  test('GET /api/notifications - should get notifications', async () => {
    const res = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.notifications).toBeDefined();
  });

  test('POST /api/notifications/push-token - should register token', async () => {
    const res = await request(app)
      .post('/api/notifications/push-token')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ token: 'ExponentPushToken[test123]', platform: 'ios' });

    expect(res.status).toBe(200);
  });
});

describe('Health Check', () => {
  test('GET /api/health - should return ok', async () => {
    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.service).toBe('BebIO Steps API');
  });
});

describe('Nanny Access Control', () => {
  test('Nanny should be able to read baby data', async () => {
    const res = await request(app)
      .get(`/api/tracking/feedings/${babyId}`)
      .set('Authorization', `Bearer ${secondUserToken}`);

    expect(res.status).toBe(200);
  });

  test('Nanny should be able to write data (has write permission)', async () => {
    const res = await request(app)
      .post('/api/tracking/feedings')
      .set('Authorization', `Bearer ${secondUserToken}`)
      .send({
        baby_id: babyId,
        type: 'bottle',
        amount_oz: 3,
        started_at: new Date().toISOString()
      });

    expect(res.status).toBe(201);
  });
});
