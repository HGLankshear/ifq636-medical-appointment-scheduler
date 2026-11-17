# IFQ636 Medical Appointment Scheduler (IMAS)

This is A role-based MERN web application which enables the patient to request exact time GP appointments and allows the clinical receptionists to review, approve, reject or manage the daily clinic schedules.

## Architecture
Its front end is React 18, React Router version 6, Tailwind CSS and Axios in frontend/
Its backend is Node.js, Express, Mongoose, JWT, plus Roll, RBAC in backend/
Its database is MongoDB Atlas 'ifq636-medical-appointment-scheduler'

## Local Setup
1. Run `npm run install-all` from the repository root.
2. Create `backend/.env` with `MONGO_URI`, `JWT_SECRET`, and `PORT=5001`.
3. Seed the GPs and test accounts: `node backend/seed.js`
4. Run the unit tests: `npm test --prefix backend`
5. Go to the frontend directory and run `npm run build`.
6. Go to the backend directory and launch the server with `npm start`.
 
## Demo Logins (Pre-Seeded Test Accounts)
- **Patient 1:** `patient1@clinic.test` / `Password123!`
- **Patient 2:** `patient2@clinic.test` / `Password123!`
- **Receptionist:** `receptionist@clinic.test` / `Password123!`
 
## Production / EC2 Deployment
- Live EC2 URL: `got to put the url here in a sec after doing the other stuff, temp`
- Single-port Express static build: `npm run build --prefix frontend` then `pm2 start server.js --name imas-scheduler`
 
## Known Limitations
- There are pre-seeded clinic accounts only, public self-registration (`/register`) is disabled
