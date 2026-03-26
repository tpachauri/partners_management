const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');

// Load environment variables FIRST before any other imports that use them
dotenv.config();

const authRoutes = require('./src/routes/authRoutes');
const universityRoutes = require('./src/routes/universityRoutes');
const partnerRoutes = require('./src/routes/partnerRoutes');

const app = express();

// Middleware
const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
    : ['http://localhost:5173', 'http://localhost:3000', 'https://adminbackend-one.vercel.app'];

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (mobile apps, curl, etc.)
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(null, true); // Allow all for now
        }
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
}));
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(express.json()); // Parse JSON request bodies

// Routes
app.get('/', (req, res) => {
    res.json({ message: 'Distribution Tech API is running!' });
});

app.use('/api/auth', authRoutes);
app.use('/api/universities', universityRoutes);
app.use('/api/partners', partnerRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
});

// 10-minute timeout for long-running microservice requests
server.timeout = 600000;
server.keepAliveTimeout = 600000;
server.headersTimeout = 610000;

module.exports = app;
