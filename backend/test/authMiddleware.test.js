const { expect } = require('chai');
const { authorizeRoles } = require('../middleware/authMiddleware');
 
describe('authorizeRoles middleware', () => {
  it('returns 403 when patient accesses receptionist route', () => {
    const req = { user: { role: 'patient' } };
    let statusCode = null;
    const res = {
      status(code) { statusCode = code; return this; },
      json(body) { this.body = body; return this; },
    };
    let calledNext = false;
    authorizeRoles('receptionist')(req, res, () => { calledNext = true; });
    expect(statusCode).to.equal(403);
    expect(calledNext).to.equal(false);
  });
 
  it('calls next when receptionist accesses receptionist route', () => {
    const req = { user: { role: 'receptionist' } };
    let statusCode = null;
    const res = {
      status(code) { statusCode = code; return this; },
      json(body) { this.body = body; return this; },
    };
    let calledNext = false;
    authorizeRoles('receptionist')(req, res, () => { calledNext = true; });
    expect(statusCode).to.equal(null);
    expect(calledNext).to.equal(true);
  });
});