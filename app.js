const express = require('express');
const app = express();
const cookieParser = require('cookie-parser');
const cors = require('cors')
require('dotenv').config({ path: './config/.env' });
const compression = require('compression')

const errorMiddleware = require('./middlewares/errors');
const students = require('./routes/student');
const formones = require('./routes/formone');
const users = require('./routes/user');
const classRecords = require('./routes/ecr');
const form137 = require('./routes/form137');
const document = require('./routes/document');

app.use(compression())
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Routes
app.use('/api/v1', students);
app.use('/api/v1', formones);
app.use('/api/v1', users);
app.use('/api/v1', classRecords);
app.use('/api/v1', form137);
app.use('/api/v1', document);

// Error Middleware
app.use(errorMiddleware);

module.exports = app;