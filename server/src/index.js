require('dotenv').config();
const app = require('./app');
const { initJobs } = require('./jobs');

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  initJobs();
});
