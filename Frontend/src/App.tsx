import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useParams, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Container } from '@mui/material';
import Navigation from './components/Navigation';
import UrlForm from './components/UrlForm';
import Statistics from './components/Statistics';
import { ShortenedUrl } from './types';
import { storageUtils } from './utils/storage';
import { urlShortenerUtils } from './utils/urlShortener';
import { logger } from './utils/logger';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#42a5f5',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
  },
});

const RedirectHandler: React.FC = () => {
  const { shortCode } = useParams<{ shortCode: string }>();
  const [redirecting, setRedirecting] = useState(true);

  useEffect(() => {
    if (!shortCode) {
      setRedirecting(false);
      return;
    }

    const urls = storageUtils.loadUrls();
    const foundUrl = urls.find(url => url.shortCode.toLowerCase() === shortCode.toLowerCase());

    if (foundUrl) {
      if (urlShortenerUtils.isExpired(foundUrl)) {
        logger.warn('Attempted access to expired URL', { shortCode });
        setRedirecting(false);
        return;
      }

      // Record the click
      urlShortenerUtils.recordClick(foundUrl);
      storageUtils.saveUrls(urls);
      
      logger.info('Redirecting user', { shortCode, originalUrl: foundUrl.originalUrl });
      
      // Redirect to original URL
      window.location.href = foundUrl.originalUrl;
    } else {
      logger.warn('Short code not found', { shortCode });
      setRedirecting(false);
    }
  }, [shortCode]);

  if (redirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center max-w-md mx-auto p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Link Not Found</h2>
        <p className="text-gray-600 mb-6">
          The shortened URL you're looking for doesn't exist or has expired.
        </p>
        <a
          href="/"
          className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Create New Short URL
        </a>
      </div>
    </div>
  );
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            {/* Redirect handler for short codes */}
            <Route path="/:shortCode" element={<RedirectHandler />} />
            
            {/* Main application routes */}
            <Route path="/*" element={
              <>
                <Navigation />
                <Container maxWidth="lg" sx={{ py: 4 }}>
                  <Routes>
                    <Route path="/" element={<UrlForm />} />
                    <Route path="/statistics" element={<Statistics />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </Container>
              </>
            } />
          </Routes>
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;