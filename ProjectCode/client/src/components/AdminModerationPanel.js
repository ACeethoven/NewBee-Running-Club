import { useState } from 'react';
import {
  Box,
  Typography,
  Switch,
  FormControlLabel,
  Paper,
  Collapse,
  IconButton,
  Alert
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import { useAuth } from '../context/AuthContext';
import { updateEventSettings } from '../api';

export default function AdminModerationPanel({ eventId, settings, onSettingsUpdate }) {
  const { currentUser } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [localSettings, setLocalSettings] = useState(settings);

  const handleToggle = async (field) => {
    if (loading) return;

    setLoading(true);
    setError(null);

    const newValue = !localSettings[field];
    const updateData = { [field]: newValue };

    try {
      const result = await updateEventSettings(eventId, updateData, currentUser?.uid);
      const updatedSettings = {
        comments_enabled: result.comments_enabled,
        likes_enabled: result.likes_enabled,
        reactions_enabled: result.reactions_enabled,
      };
      setLocalSettings(updatedSettings);
      if (onSettingsUpdate) {
        onSettingsUpdate(updatedSettings);
      }
    } catch (err) {
      console.error('Error updating settings:', err);
      setError('Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper
      elevation={0}
      sx={{
        mb: 3,
        border: '1px solid rgba(255, 184, 77, 0.3)',
        borderRadius: 2,
        backgroundColor: 'rgba(255, 184, 77, 0.04)',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 1.5,
          cursor: 'pointer',
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AdminPanelSettingsIcon sx={{ color: '#FFB84D' }} />
          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#B8860B' }}>
            Admin Controls
          </Typography>
        </Box>
        <IconButton size="small">
          {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      </Box>

      <Collapse in={expanded}>
        <Box sx={{ px: 2, pb: 2 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
            Toggle engagement features for this event
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={localSettings.comments_enabled}
                  onChange={() => handleToggle('comments_enabled')}
                  disabled={loading}
                  size="small"
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': {
                      color: '#FFB84D',
                    },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                      backgroundColor: '#FFB84D',
                    },
                  }}
                />
              }
              label={
                <Typography variant="body2">
                  Comments {localSettings.comments_enabled ? 'Enabled' : 'Disabled'}
                </Typography>
              }
            />

            <FormControlLabel
              control={
                <Switch
                  checked={localSettings.likes_enabled}
                  onChange={() => handleToggle('likes_enabled')}
                  disabled={loading}
                  size="small"
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': {
                      color: '#FFB84D',
                    },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                      backgroundColor: '#FFB84D',
                    },
                  }}
                />
              }
              label={
                <Typography variant="body2">
                  Likes {localSettings.likes_enabled ? 'Enabled' : 'Disabled'}
                </Typography>
              }
            />

            <FormControlLabel
              control={
                <Switch
                  checked={localSettings.reactions_enabled}
                  onChange={() => handleToggle('reactions_enabled')}
                  disabled={loading}
                  size="small"
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': {
                      color: '#FFB84D',
                    },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                      backgroundColor: '#FFB84D',
                    },
                  }}
                />
              }
              label={
                <Typography variant="body2">
                  Reactions {localSettings.reactions_enabled ? 'Enabled' : 'Disabled'}
                </Typography>
              }
            />
          </Box>

          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: 'block', mt: 1.5, fontStyle: 'italic' }}
          >
            Changes take effect immediately for all users.
          </Typography>
        </Box>
      </Collapse>
    </Paper>
  );
}
