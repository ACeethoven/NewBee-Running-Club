import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Grid,
  IconButton,
  Typography
} from '@mui/material';
import RepeatIcon from '@mui/icons-material/Repeat';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import CollectionsIcon from '@mui/icons-material/Collections';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import { getEventSeries, addEventToSeries, dissolveSeries, removeEventFromSeries } from '../api';
import EventGalleryPreview from './EventGalleryPreview';
import EventEngagementBar from './EventEngagementBar';
import { useAuth } from '../context/AuthContext';

/**
 * EventSeriesCard - Expandable card for recurring event series
 * Collapsed: Shows normal card with "Series" badge
 * Expanded: Shows header + grid of instance cards
 */
const EventSeriesCard = ({
  event,
  isExpanded,
  onToggleExpand,
  onEventClick,
  engagementData,
  adminModeEnabled = false,
  onSeriesUpdated
}) => {
  const [seriesEvents, setSeriesEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [dissolveDialogOpen, setDissolveDialogOpen] = useState(false);
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [eventToRemove, setEventToRemove] = useState(null);
  const { currentUser } = useAuth();

  const handleImageError = (e) => {
    e.target.src = '/images/2025/20250517_bk_half.jpg';
  };

  const handleDissolveSeries = async () => {
    if (!currentUser?.uid) return;
    try {
      await dissolveSeries(event.id, currentUser.uid);
      setDissolveDialogOpen(false);
      if (onSeriesUpdated) {
        onSeriesUpdated('Series dissolved successfully');
      }
    } catch (error) {
      console.error('Failed to dissolve series:', error);
    }
  };

  const handleRemoveFromSeries = async () => {
    if (!currentUser?.uid || !eventToRemove) return;
    try {
      await removeEventFromSeries(eventToRemove.id, currentUser.uid);
      setRemoveDialogOpen(false);
      setEventToRemove(null);
      // Refresh the series
      fetchSeries();
      if (onSeriesUpdated) {
        onSeriesUpdated('Event removed from series');
      }
    } catch (error) {
      console.error('Failed to remove event from series:', error);
    }
  };

  // Fetch series when expanding
  useEffect(() => {
    if (isExpanded && seriesEvents.length === 0) {
      fetchSeries();
    }
  }, [isExpanded]);

  const fetchSeries = async () => {
    setLoading(true);
    try {
      const events = await getEventSeries(event.id);
      setSeriesEvents(events);
    } catch (error) {
      console.error('Failed to fetch event series:', error);
    } finally {
      setLoading(false);
    }
  };

  // Drag and drop handlers (admin only)
  const handleDragOver = (e) => {
    if (adminModeEnabled) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      setIsDragOver(true);
    }
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragOver(false);

    if (!adminModeEnabled || !currentUser?.uid) return;

    const draggedEventId = e.dataTransfer.getData('eventId');
    if (draggedEventId && draggedEventId !== String(event.id)) {
      try {
        await addEventToSeries(parseInt(draggedEventId), event.id, currentUser.uid);
        // Refresh series data
        fetchSeries();
        if (onSeriesUpdated) {
          onSeriesUpdated('Event added to series successfully');
        }
      } catch (error) {
        console.error('Failed to add event to series:', error);
      }
    }
  };

  const getYear = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).getFullYear();
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Collapsed view: normal card with Series badge
  if (!isExpanded) {
    return (
      <Card
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          height: { xs: 'auto', sm: '200px' },
          overflow: 'hidden',
          cursor: 'pointer',
          border: isDragOver ? '2px dashed #FFA500' : 'none',
          '&:hover': {
            transform: 'translateY(-2px)',
            transition: 'transform 0.3s ease-in-out',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)'
          }
        }}
        onClick={onToggleExpand}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Mobile: Image at top */}
        <Box
          sx={{
            display: { xs: 'block', sm: 'none' },
            width: '100%',
            height: '150px',
            position: 'relative'
          }}
        >
          <CardMedia
            component="img"
            sx={{
              height: '100%',
              width: '100%',
              objectFit: 'cover',
              backgroundColor: '#f5f5f5'
            }}
            image={event.image}
            alt={event.name}
            onError={handleImageError}
          />
          {/* Series badge */}
          <Chip
            icon={<RepeatIcon sx={{ fontSize: 16 }} />}
            label="Series"
            size="small"
            sx={{
              position: 'absolute',
              top: 8,
              left: 8,
              backgroundColor: 'rgba(255, 165, 0, 0.9)',
              color: 'white',
              fontWeight: 600
            }}
          />
        </Box>

        {/* Time Column - hidden on mobile, shown on sm+ */}
        <Box
          sx={{
            display: { xs: 'none', sm: 'flex' },
            width: '120px',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'white',
            color: '#FFA500',
            p: 2,
            borderRight: '1px solid #e0e0e0',
            whiteSpace: 'nowrap',
            position: 'relative'
          }}
        >
          {/* Series badge for desktop */}
          <Chip
            icon={<RepeatIcon sx={{ fontSize: 14 }} />}
            label="Series"
            size="small"
            sx={{
              position: 'absolute',
              top: 8,
              backgroundColor: 'rgba(255, 165, 0, 0.9)',
              color: 'white',
              fontWeight: 600,
              fontSize: '0.7rem'
            }}
          />
          <Typography variant="h6" sx={{ fontWeight: 600, whiteSpace: 'nowrap', mt: 3 }}>
            {event.time}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
            {event.date}
          </Typography>
        </Box>

        {/* Image Column - hidden on mobile, shown on sm+ */}
        <Box
          sx={{
            display: { xs: 'none', sm: 'block' },
            width: '200px',
            flexShrink: 0
          }}
        >
          <CardMedia
            component="img"
            sx={{
              height: '100%',
              width: '100%',
              objectFit: 'cover',
              backgroundColor: '#f5f5f5'
            }}
            image={event.image}
            alt={event.name}
            onError={handleImageError}
          />
        </Box>

        {/* Content Column */}
        <Box
          sx={{
            flex: 1,
            p: 2,
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {/* Mobile: Show date/time and badge at top of content */}
          <Box sx={{ display: { xs: 'flex', sm: 'none' }, gap: 2, mb: 1, color: '#FFA500' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              {event.time}
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              {event.date}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'flex-start' }, mb: 1, gap: 1 }}>
            <Box>
              <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                {event.name}
              </Typography>
              <Typography variant="subtitle1" color="text.secondary" gutterBottom sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                {event.chineseName}
              </Typography>
            </Box>
            <Button
              variant="contained"
              sx={{
                backgroundColor: '#FFB84D',
                color: 'white',
                textTransform: 'none',
                fontSize: { xs: '14px', sm: '16px' },
                px: { xs: 1.5, sm: 2 },
                py: { xs: 1, sm: 1.5 },
                borderRadius: '12px',
                border: '2px solid #FFB84D',
                flexShrink: 0,
                '&:hover': {
                  backgroundColor: '#FFA833',
                  boxShadow: '0 4px 8px rgba(0, 0, 0, 0.15)',
                  transform: 'translateY(-2px)',
                }
              }}
            >
              View Series 查看系列
            </Button>
          </Box>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {event.location}
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {event.chineseLocation}
          </Typography>
          <EventGalleryPreview eventId={event.id} maxImages={5} size={36} />
          <Box sx={{ mt: 'auto' }}>
            <EventEngagementBar
              eventId={event.id}
              initialData={engagementData}
            />
          </Box>
        </Box>
      </Card>
    );
  }

  // Expanded view: header + grid of instance cards
  return (
    <Card
      sx={{
        overflow: 'hidden',
        border: isDragOver ? '2px dashed #FFA500' : 'none'
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          p: 2,
          borderBottom: '1px solid #e0e0e0',
          backgroundColor: '#fafafa'
        }}
      >
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {event.name}
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            {event.chineseName}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {adminModeEnabled && (
            <Button
              size="small"
              variant="outlined"
              color="error"
              startIcon={<LinkOffIcon />}
              onClick={() => setDissolveDialogOpen(true)}
              sx={{ textTransform: 'none' }}
            >
              Dissolve Series
            </Button>
          )}
          <IconButton onClick={onToggleExpand} sx={{ color: '#FFA500' }}>
            <ExpandLessIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Grid of instance cards */}
      <CardContent>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress sx={{ color: '#FFA500' }} />
          </Box>
        ) : (
          <Grid container spacing={2}>
            {seriesEvents.map((instance) => (
              <Grid item xs={6} sm={4} md={3} key={instance.id}>
                <Card
                  sx={{
                    cursor: 'pointer',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      transition: 'transform 0.2s ease-in-out',
                      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)'
                    }
                  }}
                  onClick={() => onEventClick({
                    id: instance.id,
                    name: instance.name,
                    chineseName: instance.chinese_name,
                    date: instance.date,
                    time: instance.time,
                    location: instance.location,
                    chineseLocation: instance.chinese_location,
                    description: instance.description,
                    chineseDescription: instance.chinese_description,
                    image: instance.image,
                    signupLink: instance.signup_link,
                    status: instance.status
                  })}
                >
                  {/* Year badge */}
                  <Box sx={{ position: 'relative' }}>
                    <CardMedia
                      component="img"
                      height="100"
                      image={instance.image || '/images/2025/20250517_bk_half.jpg'}
                      alt={instance.name}
                      onError={handleImageError}
                      sx={{
                        objectFit: 'cover',
                        backgroundColor: '#f5f5f5'
                      }}
                    />
                    <Chip
                      label={getYear(instance.date)}
                      size="small"
                      sx={{
                        position: 'absolute',
                        top: 8,
                        left: 8,
                        backgroundColor: 'rgba(0, 0, 0, 0.7)',
                        color: 'white',
                        fontWeight: 600
                      }}
                    />
                  </Box>
                  <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {formatDate(instance.date)}
                      </Typography>
                      {adminModeEnabled && instance.parent_event_id && (
                        <IconButton
                          size="small"
                          color="error"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEventToRemove(instance);
                            setRemoveDialogOpen(true);
                          }}
                          sx={{ p: 0.5 }}
                        >
                          <RemoveCircleOutlineIcon fontSize="small" />
                        </IconButton>
                      )}
                    </Box>
                    <EventGalleryPreview eventId={instance.id} maxImages={3} size={28} />
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Drop hint for admin */}
        {adminModeEnabled && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: 'block', textAlign: 'center', mt: 2 }}
          >
            Drag events here to add to series
          </Typography>
        )}
      </CardContent>

      {/* Dissolve Series Confirmation Dialog */}
      <Dialog
        open={dissolveDialogOpen}
        onClose={() => setDissolveDialogOpen(false)}
      >
        <DialogTitle>Dissolve Series?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This will unlink all events from this series. The events will remain but will no longer be grouped together.
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDissolveDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDissolveSeries} color="error" variant="contained">
            Dissolve
          </Button>
        </DialogActions>
      </Dialog>

      {/* Remove from Series Confirmation Dialog */}
      <Dialog
        open={removeDialogOpen}
        onClose={() => {
          setRemoveDialogOpen(false);
          setEventToRemove(null);
        }}
      >
        <DialogTitle>Remove from Series?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Remove "{eventToRemove?.name}" from this series? The event will still exist but will no longer be part of this group.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setRemoveDialogOpen(false);
            setEventToRemove(null);
          }}>Cancel</Button>
          <Button onClick={handleRemoveFromSeries} color="error" variant="contained">
            Remove
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default EventSeriesCard;
