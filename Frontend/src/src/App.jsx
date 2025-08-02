// src/App.js
import React, { useState } from 'react';
import { Container, Typography, TextField, Button, Grid, Card, CardContent, Box, Alert } from '@mui/material';
import axios from 'axios';

const API_BASE = 'http://localhost:8000';

export default function App() {
  const [urls, setUrls] = useState([{ url: '', validity: '', shortcode: '' }]);
  const [shortenedLinks, setShortenedLinks] = useState([]);
  const [error, setError] = useState(null);

  const handleInputChange = (index, field, value) => {
    const newUrls = [...urls];
    newUrls[index][field] = value;
    setUrls(newUrls);
  };

  const handleAddUrlField = () => {
    if (urls.length < 5) setUrls([...urls, { url: '', validity: '', shortcode: '' }]);
  };

  const handleShorten = async () => {
    setError(null);
    const results = [];

    for (const input of urls) {
      const { url, validity, shortcode } = input;
      if (!url || !/^https?:\/\/.+/.test(url)) {
        setError('Invalid URL detected');
        return;
      }

      try {
        const res = await axios.post(`${API_BASE}/shorturls`, {
          url,
          ...(validity && { validity: parseInt(validity) }),
          ...(shortcode && { shortcode })
        });
        results.push({ url, ...res.data });
      } catch (err) {
        setError(err.response?.data?.error || 'Unexpected error');
        return;
      }
    }

    setShortenedLinks(results);
  };

  return (
    <Container maxWidth="md" sx={{ py: 5 }}>
      <Typography variant="h4" gutterBottom>URL Shortener</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {urls.map((input, index) => (
        <Grid container spacing={2} key={index} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Original URL"
              value={input.url}
              onChange={(e) => handleInputChange(index, 'url', e.target.value)}
              fullWidth
              required
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField
              label="Validity (mins)"
              type="number"
              value={input.validity}
              onChange={(e) => handleInputChange(index, 'validity', e.target.value)}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField
              label="Custom Shortcode"
              value={input.shortcode}
              onChange={(e) => handleInputChange(index, 'shortcode', e.target.value)}
              fullWidth
            />
          </Grid>
        </Grid>
      ))}

      <Box mb={2}>
        <Button onClick={handleAddUrlField} disabled={urls.length >= 5} sx={{ mr: 2 }}>
          Add More
        </Button>
        <Button variant="contained" onClick={handleShorten}>
          Shorten URLs
        </Button>
      </Box>

      {shortenedLinks.length > 0 && (
        <Box>
          <Typography variant="h6" gutterBottom>Shortened URLs</Typography>
          {shortenedLinks.map((item, idx) => (
            <Card key={idx} sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="body2">Original: {item.url}</Typography>
                <Typography variant="body1" color="primary">Shortened: <a href={item.shortLink} target="_blank" rel="noreferrer">{item.shortLink}</a></Typography>
                <Typography variant="body2">Expires at: {new Date(item.expiry).toLocaleString()}</Typography>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}
    </Container>
  );
}  
