import React, { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Box,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  Grid,
  Card,
  CardContent,
  Button,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Visibility as ViewIcon,
  ContentCopy as CopyIcon,
  Delete as DeleteIcon,
  TrendingUp as TrendingUpIcon,
  Link as LinkIcon,
  AccessTime as TimeIcon,
  LocationOn as LocationIcon,
  ExpandMore as ExpandMoreIcon
} from '@mui/icons-material';
import { ShortenedUrl, ClickAnalytic } from '../types';
import { storageUtils } from '../utils/storage';
import { urlShortenerUtils } from '../utils/urlShortener';
import { logger } from '../utils/logger';

const Statistics: React.FC = () => {
  const [urls, setUrls] = useState<ShortenedUrl[]>([]);
  const [selectedUrl, setSelectedUrl] = useState<ShortenedUrl | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    loadUrls();
    logger.info('Statistics component mounted');
  }, []);

  const loadUrls = () => {
    const loadedUrls = storageUtils.loadUrls();
    setUrls(loadedUrls.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
  };

  const handleViewDetails = (url: ShortenedUrl) => {
    setSelectedUrl(url);
    setDetailsOpen(true);
    logger.info('Viewing URL details', { shortCode: url.shortCode });
  };

  const handleCopyUrl = (shortCode: string) => {
    const shortUrl = urlShortenerUtils.getShortUrl(shortCode);
    navigator.clipboard.writeText(shortUrl).then(() => {
      logger.info('Copied short URL to clipboard', { shortCode });
    });
  };

  const handleDeleteUrl = (urlToDelete: ShortenedUrl) => {
    const updatedUrls = urls.filter(url => url.id !== urlToDelete.id);
    setUrls(updatedUrls);
    storageUtils.saveUrls(updatedUrls);
    logger.info('Deleted URL', { shortCode: urlToDelete.shortCode });
  };

  const clearAllData = () => {
    storageUtils.clearUrls();
    setUrls([]);
    logger.info('Cleared all URL data');
  };

  const getStatsSummary = () => {
    const totalUrls = urls.length;
    const activeUrls = urls.filter(url => !urlShortenerUtils.isExpired(url)).length;
    const totalClicks = urls.reduce((sum, url) => sum + url.clicks.length, 0);
    const expiredUrls = totalUrls - activeUrls;

    return { totalUrls, activeUrls, expiredUrls, totalClicks };
  };

  const getTopLocations = (clicks: ClickAnalytic[]) => {
    const locationCounts = clicks.reduce((acc, click) => {
      acc[click.location] = (acc[click.location] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(locationCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([location, count]) => ({ location, count }));
  };

  const stats = getStatsSummary();

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom sx={{ color: '#1976d2', mb: 3 }}>
        URL Statistics
      </Typography>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <LinkIcon sx={{ mr: 2, color: 'primary.main' }} />
                <Box>
                  <Typography variant="h4" component="div">
                    {stats.totalUrls}
                  </Typography>
                  <Typography color="text.secondary">
                    Total URLs
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <TimeIcon sx={{ mr: 2, color: 'success.main' }} />
                <Box>
                  <Typography variant="h4" component="div">
                    {stats.activeUrls}
                  </Typography>
                  <Typography color="text.secondary">
                    Active URLs
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <TrendingUpIcon sx={{ mr: 2, color: 'info.main' }} />
                <Box>
                  <Typography variant="h4" component="div">
                    {stats.totalClicks}
                  </Typography>
                  <Typography color="text.secondary">
                    Total Clicks
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <DeleteIcon sx={{ mr: 2, color: 'error.main' }} />
                <Box>
                  <Typography variant="h4" component="div">
                    {stats.expiredUrls}
                  </Typography>
                  <Typography color="text.secondary">
                    Expired URLs
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {urls.length === 0 ? (
        <Paper elevation={2} sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No URLs Found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Start by creating some shortened URLs to see statistics here.
          </Typography>
          <Button variant="contained" href="/">
            Create Short URL
          </Button>
        </Paper>
      ) : (
        <>
          <Paper elevation={2} sx={{ mb: 3 }}>
            <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">
                All Shortened URLs ({urls.length})
              </Typography>
              <Button 
                variant="outlined" 
                color="error" 
                onClick={clearAllData}
                disabled={urls.length === 0}
              >
                Clear All Data
              </Button>
            </Box>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Short Code</TableCell>
                    <TableCell>Original URL</TableCell>
                    <TableCell align="center">Clicks</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {urls.map((url) => {
                    const isExpired = urlShortenerUtils.isExpired(url);
                    return (
                      <TableRow key={url.id}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Chip 
                              label={url.shortCode} 
                              size="small" 
                              color="primary" 
                              variant="outlined"
                            />
                            <Tooltip title="Copy short URL">
                              <IconButton 
                                size="small" 
                                onClick={() => handleCopyUrl(url.shortCode)}
                              >
                                <CopyIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              maxWidth: 300, 
                              overflow: 'hidden', 
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {url.originalUrl}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body2" fontWeight="bold">
                            {url.clicks.length}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={isExpired ? 'Expired' : 'Active'} 
                            size="small"
                            color={isExpired ? 'error' : 'success'}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {url.createdAt.toLocaleDateString()}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {url.createdAt.toLocaleTimeString()}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Tooltip title="View Details">
                              <IconButton 
                                size="small" 
                                onClick={() => handleViewDetails(url)}
                              >
                                <ViewIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                              <IconButton 
                                size="small" 
                                color="error"
                                onClick={() => handleDeleteUrl(url)}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </>
      )}

      {/* Details Dialog */}
      <Dialog 
        open={detailsOpen} 
        onClose={() => setDetailsOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          URL Details: {selectedUrl?.shortCode}
        </DialogTitle>
        <DialogContent>
          {selectedUrl && (
            <Box sx={{ pt: 2 }}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Alert 
                    severity={urlShortenerUtils.isExpired(selectedUrl) ? 'error' : 'success'}
                    sx={{ mb: 3 }}
                  >
                    This URL is {urlShortenerUtils.isExpired(selectedUrl) ? 'expired' : 'active'} and 
                    {urlShortenerUtils.isExpired(selectedUrl) ? ' cannot be accessed' : ' ready to use'}
                  </Alert>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        URL Information
                      </Typography>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          Original URL:
                        </Typography>
                        <Typography variant="body1" sx={{ wordBreak: 'break-all' }}>
                          {selectedUrl.originalUrl}
                        </Typography>
                      </Box>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          Short URL:
                        </Typography>
                        <Typography variant="body1">
                          {urlShortenerUtils.getShortUrl(selectedUrl.shortCode)}
                        </Typography>
                      </Box>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          Created:
                        </Typography>
                        <Typography variant="body1">
                          {selectedUrl.createdAt.toLocaleString()}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Expires:
                        </Typography>
                        <Typography variant="body1">
                          {selectedUrl.expiresAt.toLocaleString()}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Click Statistics
                      </Typography>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="h4" color="primary.main">
                          {selectedUrl.clicks.length}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Total Clicks
                        </Typography>
                      </Box>
                      
                      {selectedUrl.clicks.length > 0 && (
                        <>
                          <Typography variant="subtitle2" gutterBottom>
                            Top Locations:
                          </Typography>
                          {getTopLocations(selectedUrl.clicks).map(({ location, count }) => (
                            <Box key={location} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                              <Typography variant="body2">{location}</Typography>
                              <Chip label={count} size="small" />
                            </Box>
                          ))}
                        </>
                      )}
                    </CardContent>
                  </Card>
                </Grid>

                {selectedUrl.clicks.length > 0 && (
                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom>
                      Click History
                    </Typography>
                    {selectedUrl.clicks
                      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
                      .map((click, index) => (
                        <Accordion key={index}>
                          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                              <Typography variant="body2">
                                {click.timestamp.toLocaleString()}
                              </Typography>
                              <Chip 
                                icon={<LocationIcon />}
                                label={click.location} 
                                size="small" 
                                variant="outlined"
                              />
                            </Box>
                          </AccordionSummary>
                          <AccordionDetails>
                            <Grid container spacing={2}>
                              <Grid item xs={12} sm={6}>
                                <Typography variant="body2" color="text.secondary">
                                  Source:
                                </Typography>
                                <Typography variant="body2">
                                  {click.source || 'Direct'}
                                </Typography>
                              </Grid>
                              <Grid item xs={12} sm={6}>
                                <Typography variant="body2" color="text.secondary">
                                  User Agent:
                                </Typography>
                                <Typography 
                                  variant="body2" 
                                  sx={{ 
                                    fontSize: '0.75rem',
                                    wordBreak: 'break-all'
                                  }}
                                >
                                  {click.userAgent?.substring(0, 100)}...
                                </Typography>
                              </Grid>
                            </Grid>
                          </AccordionDetails>
                        </Accordion>
                      ))}
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default Statistics;