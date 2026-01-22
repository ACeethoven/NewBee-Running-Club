import React, { useState, useEffect } from 'react';
import { Box, Avatar, Typography, Skeleton, Tooltip } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import CollectionsIcon from '@mui/icons-material/Collections';
import { getEventGalleryPreview } from '../api/gallery';
import { useAuth } from '../context/AuthContext';

/**
 * EventGalleryPreview - Displays a horizontal row of thumbnail images for event cards
 * Shows 4-5 small images with a "+N more" badge if more exist
 * Click navigates to the full gallery page
 */
const EventGalleryPreview = ({ eventId, maxImages = 4, size = 48 }) => {
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  useEffect(() => {
    const fetchPreview = async () => {
      if (!eventId) return;

      setLoading(true);
      try {
        const data = await getEventGalleryPreview(
          eventId,
          maxImages + 1,
          currentUser?.uid
        );
        setPreview(data);
        setError(null);
      } catch (err) {
        console.error('Failed to load gallery preview:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPreview();
  }, [eventId, maxImages, currentUser?.uid]);

  const handleClick = () => {
    navigate(`/events/${eventId}/gallery`);
  };

  // Don't render anything if no images
  if (!loading && (!preview || preview.total_count === 0)) {
    return null;
  }

  // Loading state
  if (loading) {
    return (
      <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', my: 1 }}>
        {[...Array(Math.min(maxImages, 3))].map((_, i) => (
          <Skeleton
            key={i}
            variant="rounded"
            width={size}
            height={size}
            sx={{ borderRadius: 1 }}
          />
        ))}
      </Box>
    );
  }

  // Error state - don't show anything
  if (error) {
    return null;
  }

  const displayImages = preview.images.slice(0, maxImages);
  const remainingCount = preview.total_count - maxImages;

  return (
    <Tooltip title="View gallery / 查看相册" arrow>
      <Box
        onClick={handleClick}
        sx={{
          display: 'flex',
          gap: 0.5,
          alignItems: 'center',
          my: 1,
          cursor: 'pointer',
          '&:hover': {
            opacity: 0.85,
          },
        }}
      >
        {/* Gallery icon */}
        <CollectionsIcon
          sx={{
            fontSize: 18,
            color: 'text.secondary',
            mr: 0.5,
          }}
        />

        {/* Image thumbnails */}
        {displayImages.map((image, index) => (
          <Avatar
            key={image.id}
            src={image.image_url}
            variant="rounded"
            sx={{
              width: size,
              height: size,
              borderRadius: 1,
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <CollectionsIcon />
          </Avatar>
        ))}

        {/* "+N more" badge */}
        {remainingCount > 0 && (
          <Box
            sx={{
              width: size,
              height: size,
              borderRadius: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'action.hover',
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Typography
              variant="caption"
              sx={{
                fontWeight: 600,
                color: 'text.secondary',
              }}
            >
              +{remainingCount}
            </Typography>
          </Box>
        )}
      </Box>
    </Tooltip>
  );
};

export default EventGalleryPreview;
