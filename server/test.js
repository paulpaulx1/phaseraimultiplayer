const dotenv = require('dotenv');
dotenv.config();

const config = {
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
};

module.exports = config;