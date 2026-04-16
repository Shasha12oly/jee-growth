const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from dist directory (build output)
app.use(express.static(path.join(__dirname, 'dist')));

// Handle SPA routing - always return index.html for non-API routes
app.get('*', (req, res) => {
    // Don't redirect API routes
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: 'API endpoint not found' });
    }
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// API Routes for future use
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'JEE Tracker API is running' });
});

// Start server
app.listen(PORT, () => {
    console.log(`JEE Growth Tracker is running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Firebase integration enabled`);
    console.log(`Mobile responsive design`);
    console.log(`TypeScript + Tailwind CSS powered`);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\nShutting down JEE Tracker server...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\nShutting down JEE Tracker server...');
    process.exit(0);
});
