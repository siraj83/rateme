const express = require('express');
const cors = require('cors');
const app = express();

// 1. Middleware
app.use(cors());
app.use(express.static(__dirname)); // Serves index.html
app.use(express.json()); // Parses JSON bodies

// 2. Manual Proxy Route
// This receives requests from your frontend and forwards them to GHL
app.all('/proxy', async (req, res) => {
    try {
        // Get details from frontend query string
        const endpoint = req.query.endpoint;
        const method = req.query.method || 'GET';
        const token = req.query.token;
        const body = req.body;

        if (!endpoint) {
            return res.status(400).json({ error: 'Missing endpoint' });
        }

        console.log(`Proxying ${method} ${endpoint}...`);

        // 3. Forward Request to GHL
        const ghlResponse = await fetch(`https://services.leadconnectorhq.com${endpoint}`, {
            method: method,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Version': '2021-07-28'
            },
            // Only attach body if it's a POST/PUT/DELETE
            body: ['POST', 'PUT', 'DELETE'].includes(method) ? JSON.stringify(body) : undefined
        });

        const data = await ghlResponse.json();

        // 4. Return GHL response to Frontend
        res.status(ghlResponse.status).json(data);

    } catch (error) {
        console.error('Proxy Error:', error);
        res.status(500).json({ error: 'Proxy Server Error', details: error.message });
    }
});

// 5. Start Server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`✅ Rate Me Server running at http://localhost:${PORT}`);
    console.log(`🔗 Proxy ready. Testing mode active.`);
});