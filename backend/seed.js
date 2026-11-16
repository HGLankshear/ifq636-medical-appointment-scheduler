// Seed runners and using upsert to make the system a bit more flexible

require('dotenv').config({ path: __dirname + '/.env'});
const connectDB = require('./config/db');
const User = require('./models/User');
const GP = require('./models/GP');

async function runSeed() {
    await connectDB();

        console.log('Seed complete');
        process.exit(0);
}

runSeed().catch((err) => {
    console.error(err);
    process.exit(1);

});
