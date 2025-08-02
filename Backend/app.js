const express = require('express');
const app = express();
const crypto = require('crypto');
const fetch = require('node-fetch');


const urlDB = {};


async function logToAffordmed(stack, level, packageName, message) {
    const logData = {
        stack: stack.toLowerCase(),
        level: level.toLowerCase(),
        package: packageName.toLowerCase(),
        message
    };

    try {
        const response = await fetch('http://20.244.56.144/evaluation-service/logs', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiYXVkIjoiaHR0cDovLzIwLjI0NC41Ni4xNDQvZXZhbHVhdGlvbi1zZXJ2aWNlIiwiZW1haWwiOiJwaXJhbW1hc2FrdGhpNDJAZ21haWwuY29tIiwiZXhwIjoxNzU0MTE2MzYzLCJpYXQiOjE3NTQxMTU0NjMsImlzcyI6IkFmZm9yZCBNZWRpY2FsIFRlY2hub2xvZ2llcyBQcml2YXRlIExpbWl0ZWQiLCJqdGkiOiI2NjQxMjRiMi1kMjY3LTQ1YTQtYmE4ZC01YjY2YTk4MDBjNjIiLCJsb2NhbGUiOiJlbi1JTiIsIm5hbWUiOiJwaXJhbW1hIHNha3RoaSIsInN1YiI6IjMwYWI1NGZlLWY5Y2EtNDMwYi1hNzM4LWVlYjhjYzhlN2VjZSJ9LCJlbWFpbCI6InBpcmFtbWFzYWt0aGk0MkBnbWFpbC5jb20iLCJuYW1lIjoicGlyYW1tYSBzYWt0aGkiLCJyb2xsTm8iOiI5MjEzMjIyMTA0MCIsImFjY2Vzc0NvZGUiOiJyQlBmU1MiLCJjbGllbnRJRCI6IjMwYWI1NGZlLWY5Y2EtNDMwYi1hNzM4LWVlYjhjYzhlN2VjZSIsImNsaWVudFNlY3JldCI6IkZNcnJTaHFtcGd4dkZkRGIifQ.mBI8z0FAOHudeGprN08a3l7yl2kF-HFEKd5VYKcoB2s'
            }
            ,
            body: JSON.stringify(logData)
        });

        if (!response.ok) {
            console.error('Failed to send log:', response.statusText);
        } else {
            const data = await response.json();
            console.log('Log sent:', data);
        }
    } catch (error) {
        console.error('Logging error:', error.message);
    }
}


app.use(async (req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.originalUrl}`);
    await logToAffordmed("backend", "info", "middleware", `Incoming ${req.method} request to ${req.originalUrl}`);
    next();
});


app.use(express.json());


function generateShortcode(length = 6) {
    return crypto.randomBytes(length).toString('base64url').slice(0, length);
}


app.post('/shorturls', async (req, res) => {
    const { url, validity = 30, shortcode } = req.body;


    if (!url || !/^https?:\/\/.+/.test(url)) {
        await logToAffordmed("backend", "error", "validator", "Invalid URL format");
        return res.status(400).json({ error: "Invalid URL format" });
    }


    const minutes = parseInt(validity);
    if (isNaN(minutes) || minutes <= 0) {
        await logToAffordmed("backend", "error", "validator", "Invalid validity value");
        return res.status(400).json({ error: "Validity must be a positive integer" });
    }


    let finalCode = shortcode || generateShortcode();
    if (urlDB[finalCode]) {
        await logToAffordmed("backend", "error", "handler", "Shortcode already exists");
        return res.status(409).json({ error: "Shortcode already exists" });
    }

    const createdAt = new Date();
    const expiry = new Date(createdAt.getTime() + minutes * 60000);

    urlDB[finalCode] = {
        originalUrl: url,
        createdAt,
        expiry,
        clicks: []
    };

    const shortLink = `http://localhost:8000/${finalCode}`;

    await logToAffordmed("backend", "info", "handler", `Short URL created for code: ${finalCode}`);

    res.status(201).json({
        shortLink,
        expiry: expiry.toISOString()
    });
});


app.get('/:shortcode', async (req, res) => {
    const code = req.params.shortcode;
    const data = urlDB[code];

    if (!data) {
        await logToAffordmed("backend", "warn", "handler", `Shortcode ${code} not found`);
        return res.status(404).json({ error: "Shortcode not found" });
    }

    if (new Date() > data.expiry) {
        await logToAffordmed("backend", "warn", "handler", `Shortcode ${code} expired`);
        return res.status(410).json({ error: "Short link expired" });
    }

    data.clicks.push({
        timestamp: new Date(),
        referrer: req.get('Referer') || 'unknown',
        location: 'Simulated India'
    });

    await logToAffordmed("backend", "info", "handler", `Redirecting from shortcode: ${code}`);
    res.redirect(data.originalUrl);
});


app.get('/shorturls/:shortcode', async (req, res) => {
    const code = req.params.shortcode;
    const data = urlDB[code];

    if (!data) {
        await logToAffordmed("backend", "warn", "handler", `Stats requested for nonexistent code: ${code}`);
        return res.status(404).json({ error: "Shortcode not found" });
    }

    const stats = {
        originalUrl: data.originalUrl,
        createdAt: data.createdAt.toISOString(),
        expiry: data.expiry.toISOString(),
        totalClicks: data.clicks.length,
        clickData: data.clicks.map(click => ({
            timestamp: click.timestamp.toISOString(),
            referrer: click.referrer,
            geo: click.location
        }))
    };

    await logToAffordmed("backend", "info", "handler", `Stats retrieved for shortcode: ${code}`);
    res.status(200).json(stats);
});


app.listen(8000, () => {
    console.log('URL Shortener Microservice running at http://localhost:8000');
});
