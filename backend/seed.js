// Seed runners and using upsert to make the system a bit more flexible

require('dotenv').config({ path: __dirname + '/.env' });
const connectDB = require('./config/db');
const User = require('./models/User');
const GP = require('./models/GP');

const gpList = [
  {
    name: 'Dr Priya Patel',
    specialty: 'General Practice',
    workingHours: [
      { dayOfWeek: 1, start: '09:00', end: '17:00' },
      { dayOfWeek: 2, start: '09:00', end: '17:00' },
      { dayOfWeek: 3, start: '09:00', end: '17:00' },
      { dayOfWeek: 4, start: '09:00', end: '17:00' },
      { dayOfWeek: 5, start: '09:00', end: '17:00' },
    ],
    leaveDates: ['2026-11-20'],
  },

   {
    name: 'Dr Terra Master',
    specialty: 'General Practice',
    workingHours: [
      { dayOfWeek: 2, start: '09:00', end: '17:00' },
      { dayOfWeek: 3, start: '09:00', end: '17:00' },
      { dayOfWeek: 4, start: '09:00', end: '17:00' },
      { dayOfWeek: 5, start: '09:00', end: '17:00' },
      { dayOfWeek: 6, start: '09:00', end: '17:00' },
    ],
    leaveDates: ['2026-12-20'],
  },

     {
    name: 'Dr Marcus Aurelius',
    specialty: 'General Practice',
    workingHours: [
      { dayOfWeek: 1, start: '09:00', end: '17:00' },
      { dayOfWeek: 2, start: '09:00', end: '17:00' },
      { dayOfWeek: 3, start: '09:00', end: '17:00' },
      { dayOfWeek: 4, start: '09:00', end: '17:00' },
      { dayOfWeek: 6, start: '09:00', end: '17:00' },
    ],
    leaveDates: ['2026-12-22'],
  },

];
const userList = [
  {
    name: 'Alice Patient',
    email: 'patient1@clinic.test',
    password: 'Password123!',
    role: 'patient',
  },

    {
    name: 'Fujifilm Patient',
    email: 'patient2@clinic.test',
    password: 'Password123!',
    role: 'patient',
  },

    {
    name: 'John Receptionist',
    email: 'receptionist@clinic.test',
    password: 'Password123!',
    role: 'receptionist',
  },

];

async function runSeed() {
  await connectDB();

  for (const gp of gpList) {
    await GP.findOneAndUpdate(
      { name: gp.name },
      gp,
      { upsert: true, new: true }
    );
  }

  for (const u of userList) {
    const existing = await User.findOne({ email: u.email });
    if (!existing) {
      await User.create(u);
    }
  }

  console.log('Seed complete');
  process.exit(0);
}

runSeed().catch((err) => {
  console.error(err);
  process.exit(1);
});
