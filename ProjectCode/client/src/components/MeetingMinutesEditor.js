import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemText,
  TextField,
  Typography
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  ExpandLess,
  ExpandMore,
  Save as SaveIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import React, { useEffect, useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import DOMPurify from 'dompurify';
import { useAutoFillOnTab } from '../hooks';
import {
  getAllMeetingMinutes,
  createMeetingMinutes,
  updateMeetingMinutes,
  deleteMeetingMinutes
} from '../api/meetingMinutes';

// Quill editor modules configuration
const quillModules = {
  toolbar: [
    [{ 'header': [1, 2, 3, false] }],
    ['bold', 'italic', 'underline'],
    [{ 'list': 'ordered' }, { 'list': 'bullet' }],
    [{ 'indent': '-1' }, { 'indent': '+1' }],
    ['clean']
  ],
};

const quillFormats = [
  'header',
  'bold', 'italic', 'underline',
  'list', 'bullet',
  'indent'
];

export default function MeetingMinutesEditor({ firebaseUid }) {
  const [meetingMinutes, setMeetingMinutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [expanded, setExpanded] = useState(true);

  // Editor state
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    meeting_date: new Date().toISOString().split('T')[0],
    content: ''
  });
  const [saving, setSaving] = useState(false);

  // Delete confirmation dialog
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null, title: '' });
  const [deleting, setDeleting] = useState(false);

  // View expanded minutes
  const [viewingId, setViewingId] = useState(null);

  // Default values for Tab auto-fill
  const meetingDefaultValues = {
    title: 'Committee Meeting - [Month Year]'
  };

  const handleAutoFill = useAutoFillOnTab({
    setValue: (field, value) => setFormData(prev => ({ ...prev, [field]: value })),
    defaultValues: meetingDefaultValues
  });

  // Fetch meeting minutes
  useEffect(() => {
    fetchMeetingMinutes();
  }, []);

  const fetchMeetingMinutes = async () => {
    try {
      setLoading(true);
      const data = await getAllMeetingMinutes();
      setMeetingMinutes(data);
      setError('');
    } catch (err) {
      console.error('Error fetching meeting minutes:', err);
      setError('Failed to load meeting minutes.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleExpand = () => {
    setExpanded(!expanded);
  };

  const handleStartNew = () => {
    setIsEditing(true);
    setEditingId(null);
    setFormData({
      title: '',
      meeting_date: new Date().toISOString().split('T')[0],
      content: ''
    });
  };

  const handleStartEdit = (minutes) => {
    setIsEditing(true);
    setEditingId(minutes.id);
    setFormData({
      title: minutes.title,
      meeting_date: minutes.meeting_date,
      content: minutes.content
    });
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditingId(null);
    setFormData({
      title: '',
      meeting_date: new Date().toISOString().split('T')[0],
      content: ''
    });
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      setError('Please enter a title.');
      return;
    }
    if (!formData.meeting_date) {
      setError('Please select a meeting date.');
      return;
    }
    if (!formData.content.trim() || formData.content === '<p><br></p>') {
      setError('Please enter meeting minutes content.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      if (editingId) {
        // Update existing
        await updateMeetingMinutes(editingId, formData, firebaseUid);
        setSuccessMessage('Meeting minutes updated successfully!');
      } else {
        // Create new
        await createMeetingMinutes(formData, firebaseUid);
        setSuccessMessage('Meeting minutes created successfully!');
      }

      // Refresh list and reset form
      await fetchMeetingMinutes();
      handleCancel();

      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err) {
      console.error('Error saving meeting minutes:', err);
      setError('Failed to save meeting minutes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = (minutes) => {
    setDeleteDialog({ open: true, id: minutes.id, title: minutes.title });
  };

  const handleDeleteConfirm = async () => {
    setDeleting(true);
    try {
      await deleteMeetingMinutes(deleteDialog.id, firebaseUid);
      setSuccessMessage('Meeting minutes deleted successfully!');
      await fetchMeetingMinutes();
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err) {
      console.error('Error deleting meeting minutes:', err);
      setError('Failed to delete meeting minutes.');
    } finally {
      setDeleting(false);
      setDeleteDialog({ open: false, id: null, title: '' });
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialog({ open: false, id: null, title: '' });
  };

  const toggleView = (id) => {
    setViewingId(viewingId === id ? null : id);
  };

  // Sanitize HTML content for display
  const sanitizeHtml = (html) => {
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ['h1', 'h2', 'h3', 'p', 'strong', 'em', 'u', 'ol', 'ul', 'li', 'br'],
      ALLOWED_ATTR: []
    });
  };

  // Format date for display
  const formatDate = (dateStr) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Card sx={{ border: '1px solid #FFA500', mt: 4 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5" sx={{ fontWeight: 600, color: '#FFA500' }}>
            Meeting Minutes
            <Typography variant="body2" component="span" sx={{ ml: 1, color: 'text.secondary' }}>
              / 会议纪要
            </Typography>
          </Typography>
          <Box>
            {!isEditing && (
              <Button
                startIcon={<AddIcon />}
                onClick={handleStartNew}
                sx={{
                  mr: 1,
                  backgroundColor: '#FFA500',
                  color: 'white',
                  '&:hover': { backgroundColor: '#FF8C00' }
                }}
              >
                Add New
              </Button>
            )}
            <IconButton onClick={handleToggleExpand}>
              {expanded ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
          </Box>
        </Box>

        <Collapse in={expanded}>
          {successMessage && (
            <Alert severity="success" sx={{ mt: 2 }}>
              {successMessage}
            </Alert>
          )}

          {error && (
            <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          {/* Editor Form */}
          {isEditing && (
            <Box sx={{ mt: 3, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
              <Typography variant="h6" gutterBottom>
                {editingId ? 'Edit Meeting Minutes' : 'New Meeting Minutes'}
              </Typography>

              <TextField
                name="title"
                fullWidth
                label="Title / 标题"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                onKeyDown={handleAutoFill}
                sx={{ mb: 2 }}
                placeholder={meetingDefaultValues.title}
              />

              <TextField
                fullWidth
                type="date"
                label="Meeting Date / 会议日期"
                value={formData.meeting_date}
                onChange={(e) => setFormData({ ...formData, meeting_date: e.target.value })}
                sx={{ mb: 2 }}
                InputLabelProps={{ shrink: true }}
              />

              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Content / 内容 (supports bold, lists, and indentation)
              </Typography>
              <Box sx={{ mb: 2, '.ql-container': { minHeight: '200px' } }}>
                <ReactQuill
                  theme="snow"
                  value={formData.content}
                  onChange={(content) => setFormData({ ...formData, content })}
                  modules={quillModules}
                  formats={quillFormats}
                  placeholder="Enter meeting minutes here..."
                />
              </Box>

              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button
                  startIcon={<CancelIcon />}
                  onClick={handleCancel}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
                  onClick={handleSave}
                  disabled={saving}
                  sx={{
                    backgroundColor: '#FFA500',
                    '&:hover': { backgroundColor: '#FF8C00' }
                  }}
                >
                  {saving ? 'Saving...' : 'Save'}
                </Button>
              </Box>
            </Box>
          )}

          {/* List of Meeting Minutes */}
          <Box sx={{ mt: 3 }}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                <CircularProgress />
              </Box>
            ) : meetingMinutes.length === 0 ? (
              <Alert severity="info">
                No meeting minutes yet. Click "Add New" to create one.
                <br />
                还没有会议纪要。点击"Add New"创建一个。
              </Alert>
            ) : (
              <List>
                {meetingMinutes.map((minutes, index) => (
                  <React.Fragment key={minutes.id}>
                    {index > 0 && <Divider />}
                    <ListItem
                      sx={{
                        flexDirection: 'column',
                        alignItems: 'stretch',
                        py: 2
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                        <ListItemText
                          primary={
                            <Typography
                              variant="subtitle1"
                              sx={{ fontWeight: 500, cursor: 'pointer' }}
                              onClick={() => toggleView(minutes.id)}
                            >
                              {minutes.title}
                            </Typography>
                          }
                          secondary={
                            <>
                              {formatDate(minutes.meeting_date)}
                              {minutes.created_by && (
                                <span> - Created by {minutes.created_by}</span>
                              )}
                            </>
                          }
                        />
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <IconButton
                            size="small"
                            onClick={() => toggleView(minutes.id)}
                            title="View"
                          >
                            {viewingId === minutes.id ? <ExpandLess /> : <ExpandMore />}
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleStartEdit(minutes)}
                            title="Edit"
                            disabled={isEditing}
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteClick(minutes)}
                            title="Delete"
                            color="error"
                            disabled={isEditing}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      </Box>

                      <Collapse in={viewingId === minutes.id}>
                        <Box
                          sx={{
                            mt: 2,
                            p: 2,
                            backgroundColor: '#f5f5f5',
                            borderRadius: 1,
                            '& p': { my: 1 },
                            '& ul, & ol': { pl: 3 },
                            '& li': { my: 0.5 }
                          }}
                          dangerouslySetInnerHTML={{ __html: sanitizeHtml(minutes.content) }}
                        />
                      </Collapse>
                    </ListItem>
                  </React.Fragment>
                ))}
              </List>
            )}
          </Box>
        </Collapse>
      </CardContent>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog.open} onClose={handleDeleteCancel}>
        <DialogTitle>
          Delete Meeting Minutes?
          <br />
          删除会议纪要？
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete "{deleteDialog.title}"? This action cannot be undone.
            <br /><br />
            您确定要删除"{deleteDialog.title}"吗？此操作无法撤销。
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} disabled={deleting}>
            Cancel 取消
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            variant="contained"
            color="error"
            disabled={deleting}
          >
            {deleting ? <CircularProgress size={20} /> : 'Delete 删除'}
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
}
