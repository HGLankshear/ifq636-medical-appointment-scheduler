const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const connectDB = require('./config/db');
 
dotenv.config({ path: path.join(__dirname, '.env') });
 
 
const app = express();
 
app.use(cors());
app.use(express.json());
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/gps', require('./routes/gpRoutes'));
app.use('/api/appointments', require('./routes/appointmentRoutes'));
 
const buildPath = path.join(__dirname, '../frontend/build');
if (fs.existsSync(buildPath)) {
  app.use(express.static(buildPath));
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) {
      return res.status(404).json({ message: 'Not found' });
    }
    res.sendFile(path.join(buildPath, 'index.html'));
  });
}
 
// Export the app object for testing
if (require.main === module) {
    connectDB();
    // If the file is run directly, start the server
    const PORT = process.env.PORT || 5001;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  }
 
 
module.exports = app