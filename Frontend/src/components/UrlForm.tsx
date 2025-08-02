import React, { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Box,
  Alert,
  Chip,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  Snackbar,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import { 
  Add as AddIcon, 
  Remove as RemoveIcon, 
  ContentCopy as CopyIcon,
  Link as LinkIcon,
  AccessTime as TimeIcon,
  Code as CodeIcon,
  ExpandMore as ExpandMoreIcon
} from '@mui/icons-material';
import { ShortenedUrl, UrlFormData, ValidationResult } from '../types';
import { validationUtils } from '../utils/validation';
import { urlShortenerUtils } from '../utils/urlShortener';
import { storageUtils } from '../utils/storage';
import { logger } from '../utils/logger';

interface FormUrl extends UrlFormData {
  id: string;
  errors: Record<string, string[]>;
}

const UrlForm: React.FC = () => {
  const [urls, setUrls] = useState<FormUrl[]>([
    {
      id: '1',
      originalUrl: '',
      validityMinutes: 30,
      customShortcode: '',
      errors: {}
    }
  ]);
  const [shortenedUrls, setShortenedUrls] = useState<ShortenedUrl[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  useEffect(() => {
    // Load existing URLs on component mount
    const existingUrls = storageUtils.loadUrls();
    setShortenedUrls(existingUrls);
    logger.info('UrlForm component mounted', { existingUrlsCount: existingUrls.length });
  }, []);

  const addUrlField = () => {
    if (urls.length < 5) {
      const newUrl: FormUrl = {
        id: Date.now().toString(),
        originalUrl: '',
        validityMinutes: 30,
        customShortcode: '',
        errors: {}
      };
      setUrls([...urls, newUrl]);
      logger.info('Added new URL field', { totalFields: urls.length + 1 });
    }
  };

  const removeUrlField = (id: string) => {
    if (urls.length > 1) {
      setUrls(urls.filter(url => url.id !== id));
      logger.info('Removed URL field', { fieldId: id, remainingFields: urls.length - 1 });
    }
  };

  const updateUrl = (id: string, field: keyof UrlFormData, value: string | number) => {
    setUrls(urls.map(url => 
      url.id === id 
        ? { ...url, [field]: value, errors: { ...url.errors, [field]: [] } }
        : url
    ));
  };

  const validateForm = (): boolean => {
    const existingCodes = shortenedUrls.map(url => url.shortCode.toLowerCase());
    let isValid = true;
    
    const updatedUrls = urls.map(url => {
      const errors: Record<string, string[]> = {};
      
      // Validate URL
      const urlValidation = validationUtils.validateUrl(url.originalUrl);
      if (!urlValidation.isValid) {
        errors.originalUrl = urlValidation.errors;
        isValid = false;
      }
      
      // Validate validity period
      const validityValidation = validationUtils.validateValidityPeriod(url.validityMinutes);
      if (!validityValidation.isValid) {
        errors.validityMinutes = validityValidation.errors;
        isValid = false;
      }
      
      // Validate custom shortcode
      const shortcodeValidation = validationUtils.validateShortcode(url.customShortcode, existingCodes);
      if (!shortcodeValidation.isValid) {
        errors.customShortcode = shortcodeValidation.errors;
        isValid = false;
      }
      
      return { ...url, errors };
    });
    
    setUrls(updatedUrls);
    return isValid;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      setSnackbar({ open: true, message: 'Please fix the validation errors', severity: 'error' });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const existingCodes = shortenedUrls.map(url => url.shortCode.toLowerCase());
      const newShortenedUrls: ShortenedUrl[] = [];
      
      for (const url of urls) {
        if (url.originalUrl.trim()) {
          const shortenedUrl = urlShortenerUtils.createShortenedUrl(
            url.originalUrl,
            url.validityMinutes,
            url.customShortcode,
            [...existingCodes, ...newShortenedUrls.map(u => u.shortCode.toLowerCase())]
          );
          
          newShortenedUrls.push(shortenedUrl);
        }
      }
      
      const allUrls = [...shortenedUrls, ...newShortenedUrls];
      storageUtils.saveUrls(allUrls);
      setShortenedUrls(allUrls);
      
      // Reset form
      setUrls([{
        id: Date.now().toString(),
        originalUrl: '',
        validityMinutes: 30,
        customShortcode: '',
        errors: {}
      }]);
      
      setSnackbar({ 
        open: true, 
        message: `Successfully shortened ${newShortenedUrls.length} URL${newShortenedUrls.length > 1 ? 's' : ''}`, 
        severity: 'success' 
      });
      
      logger.info('URLs shortened successfully', { count: newShortenedUrls.length });
      
    } catch (error) {
      logger.error('Error shortening URLs', error);
      setSnackbar({ open: true, message: 'An error occurred while shortening URLs', severity: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setSnackbar({ open: true, message: 'Copied to clipboard!', severity: 'success' });
    }).catch(() => {
      setSnackbar({ open: true, message: 'Failed to copy to clipboard', severity: 'error' });
    });
  };

  const getRecentUrls = () => {
    return shortenedUrls
      .filter(url => !urlShortenerUtils.isExpired(url))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 5);
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom sx={{ color: '#1976d2', mb: 3 }}>
        URL Shortener
      </Typography>
      
      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Shorten Your URLs
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          You can shorten up to 5 URLs at once. Each URL can have custom settings for validity period and shortcode.
        </Typography>
        
        {urls.map((url, index) => (
          <Card key={url.id} variant="outlined" sx={{ mb: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle1" sx={{ flexGrow: 1 }}>
                  URL #{index + 1}
                </Typography>
                {urls.length > 1 && (
                  <IconButton 
                    onClick={() => removeUrlField(url.id)}
                    color="error"
                    size="small"
                  >
                    <RemoveIcon />
                  </IconButton>
                )}
              </Box>
              
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Original URL"
                    placeholder="https://example.com/very-long-url"
                    value={url.originalUrl}
                    onChange={(e) => updateUrl(url.id, 'originalUrl', e.target.value)}
                    error={!!url.errors.originalUrl?.length}
                    helperText={url.errors.originalUrl?.join(', ')}
                    InputProps={{
                      startAdornment: <LinkIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Validity Period (minutes)"
                    value={url.validityMinutes}
                    onChange={(e) => updateUrl(url.id, 'validityMinutes', parseInt(e.target.value) || 0)}
                    error={!!url.errors.validityMinutes?.length}
                    helperText={url.errors.validityMinutes?.join(', ') || 'Default: 30 minutes'}
                    InputProps={{
                      startAdornment: <TimeIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Custom Shortcode (optional)"
                    placeholder="my-custom-code"
                    value={url.customShortcode}
                    onChange={(e) => updateUrl(url.id, 'customShortcode', e.target.value)}
                    error={!!url.errors.customShortcode?.length}
                    helperText={url.errors.customShortcode?.join(', ') || 'Leave empty for auto-generation'}
                    InputProps={{
                      startAdornment: <CodeIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    }}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        ))}
        
        <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
          {urls.length < 5 && (
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={addUrlField}
            >
              Add Another URL
            </Button>
          )}
          
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={isSubmitting || urls.every(url => !url.originalUrl.trim())}
            sx={{ ml: 'auto' }}
          >
            {isSubmitting ? 'Shortening...' : 'Shorten URLs'}
          </Button>
        </Box>
      </Paper>

      {/* Recent URLs Section */}
      {getRecentUrls().length > 0 && (
        <Paper elevation={2} sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Recent Shortened URLs
          </Typography>
          
          {getRecentUrls().map((url) => (
            <Accordion key={url.id} sx={{ mb: 1 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Chip 
                      label={url.shortCode} 
                      size="small" 
                      color="primary" 
                      variant="outlined"
                    />
                    <Typography variant="body2" color="text.secondary">
                      {url.clicks.length} clicks
                    </Typography>
                  </Box>
                  <Typography variant="body2" noWrap sx={{ maxWidth: '60vw' }}>
                    {url.originalUrl}
                  </Typography>
                </Box>
              </AccordionSummary>
              
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <TextField
                        fullWidth
                        variant="outlined"
                        size="small"
                        value={urlShortenerUtils.getShortUrl(url.shortCode)}
                        InputProps={{
                          readOnly: true,
                          endAdornment: (
                            <Tooltip title="Copy to clipboard">
                              <IconButton
                                onClick={() => copyToClipboard(urlShortenerUtils.getShortUrl(url.shortCode))}
                                edge="end"
                              >
                                <CopyIcon />
                              </IconButton>
                            </Tooltip>
                          )
                        }}
                      />
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Created: {url.createdAt.toLocaleString()}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Expires: {url.expiresAt.toLocaleString()}
                    </Typography>
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>
          ))}
        </Paper>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default UrlForm;