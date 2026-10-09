require('dotenv').config();
const app = require('./app');
const connectDatabase = require('./config/db');
const port = process.env.PORT || 3000;
if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is required');
connectDatabase().then(() => app.listen(port, () => console.log(`CrewBoard listening on ${port}`))).catch(error => { console.error(error); process.exit(1); });
