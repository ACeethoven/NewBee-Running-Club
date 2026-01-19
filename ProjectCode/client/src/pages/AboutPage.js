import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Modal,
  TextField,
  Tooltip,
  Typography
} from '@mui/material';
import { safeMarkdown } from '../utils/markdown';
import { useEffect, useState, useCallback } from 'react';
import { getMeetingContent, getMeetingFiles } from '../api/meetings';
import {
  getAllMeetingMinutes,
  createMeetingMinutes,
  updateMeetingMinutes,
  deleteMeetingMinutes
} from '../api/meetingMinutes';
import Logo from '../components/Logo';
import NavigationButtons from '../components/NavigationButtons';
import CommitteeMemberCard from '../components/CommitteeMemberCard';
import { committeeMembers } from '../data/committeeMembers';
import { useAdmin } from '../context/AdminContext';
import { useAuth } from '../context/AuthContext';
import { useAutoFillOnTab } from '../hooks';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import DOMPurify from 'dompurify';

// Quill editor configuration
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

export default function AboutPage() {
  const { adminModeEnabled } = useAdmin();
  const { currentUser } = useAuth();

  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [electionStandards, setElectionStandards] = useState('');
  const [standardsLoading, setStandardsLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);

  // Meeting minutes editor state
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    meeting_date: new Date().toISOString().split('T')[0],
    content: ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Delete confirmation dialog
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null, title: '' });
  const [deleting, setDeleting] = useState(false);

  // Default values for Tab auto-fill
  const meetingDefaultValues = {
    title: 'Committee Meeting - [Month Year]'
  };

  const handleAutoFill = useAutoFillOnTab({
    setValue: (field, value) => setFormData(prev => ({ ...prev, [field]: value })),
    defaultValues: meetingDefaultValues
  });

  const handleImageClick = (imageSrc) => {
    setSelectedImage(imageSrc);
  };

  const handleCloseModal = () => {
    setSelectedImage(null);
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

  // Fetch meeting minutes from database API
  const fetchMeetingMinutes = useCallback(async () => {
    try {
      setLoading(true);
      const dbMeetings = await getAllMeetingMinutes();

      // Also fetch local markdown files as fallback
      const mdFiles = getMeetingFiles();
      const localMeetings = await Promise.all(
        mdFiles.map(async (filename) => {
          try {
            const content = await getMeetingContent(filename);
            const title = content.split('\n')[0].replace('# ', '');
            const date = filename.split('.')[0];
            return {
              title,
              content,
              meeting_date: date,
              filename,
              isLocal: true
            };
          } catch (error) {
            return null;
          }
        })
      );

      // Combine database meetings with local ones
      const validLocalMeetings = localMeetings.filter(m => m !== null);

      // Database meetings take priority - format them consistently
      const formattedDbMeetings = dbMeetings.map(m => ({
        ...m,
        isLocal: false
      }));

      // Combine and sort by date (most recent first)
      const allMeetings = [...formattedDbMeetings, ...validLocalMeetings];
      allMeetings.sort((a, b) => new Date(b.meeting_date) - new Date(a.meeting_date));

      setMeetings(allMeetings);
      setError('');
    } catch (err) {
      console.error('Error fetching meeting minutes:', err);
      // Fall back to local files only
      try {
        const mdFiles = getMeetingFiles();
        const localMeetings = await Promise.all(
          mdFiles.map(async (filename) => {
            try {
              const content = await getMeetingContent(filename);
              const title = content.split('\n')[0].replace('# ', '');
              const date = filename.split('.')[0];
              return { title, content, meeting_date: date, filename, isLocal: true };
            } catch (error) {
              return null;
            }
          })
        );
        const validMeetings = localMeetings.filter(m => m !== null);
        validMeetings.sort((a, b) => new Date(b.meeting_date) - new Date(a.meeting_date));
        setMeetings(validMeetings);
      } catch (localErr) {
        console.error('Error fetching local meetings:', localErr);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Meeting minutes editor handlers
  const handleStartNew = () => {
    setIsEditing(true);
    setEditingId(null);
    setFormData({
      title: '',
      meeting_date: new Date().toISOString().split('T')[0],
      content: ''
    });
  };

  const handleStartEdit = (meeting) => {
    if (meeting.isLocal) {
      setError('Local files cannot be edited. Only database entries can be modified.');
      setTimeout(() => setError(''), 5000);
      return;
    }
    setIsEditing(true);
    setEditingId(meeting.id);
    setFormData({
      title: meeting.title,
      meeting_date: meeting.meeting_date,
      content: meeting.content
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
      setError('Please enter a title. / 请输入标题。');
      return;
    }
    if (!formData.meeting_date) {
      setError('Please select a meeting date. / 请选择会议日期。');
      return;
    }
    if (!formData.content.trim() || formData.content === '<p><br></p>') {
      setError('Please enter meeting minutes content. / 请输入会议纪要内容。');
      return;
    }

    setSaving(true);
    setError('');

    try {
      if (editingId) {
        await updateMeetingMinutes(editingId, formData, currentUser.uid);
        setSuccessMessage('Meeting minutes updated successfully! / 会议纪要更新成功！');
      } else {
        await createMeetingMinutes(formData, currentUser.uid);
        setSuccessMessage('Meeting minutes created successfully! / 会议纪要创建成功！');
      }

      await fetchMeetingMinutes();
      handleCancel();
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err) {
      console.error('Error saving meeting minutes:', err);
      setError('Failed to save meeting minutes. Please try again. / 保存失败，请重试。');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = (meeting) => {
    if (meeting.isLocal) {
      setError('Local files cannot be deleted through the app.');
      setTimeout(() => setError(''), 5000);
      return;
    }
    setDeleteDialog({ open: true, id: meeting.id, title: meeting.title });
  };

  const handleDeleteConfirm = async () => {
    setDeleting(true);
    try {
      await deleteMeetingMinutes(deleteDialog.id, currentUser.uid);
      setSuccessMessage('Meeting minutes deleted successfully! / 会议纪要已删除！');
      await fetchMeetingMinutes();
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err) {
      console.error('Error deleting meeting minutes:', err);
      setError('Failed to delete meeting minutes. / 删除失败。');
    } finally {
      setDeleting(false);
      setDeleteDialog({ open: false, id: null, title: '' });
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialog({ open: false, id: null, title: '' });
  };

  useEffect(() => {
    const fetchElectionStandards = async () => {
      try {
        const response = await fetch('/data/committee/election_standards.md');
        const text = await response.text();
        setElectionStandards(text);
        setStandardsLoading(false);
      } catch (error) {
        console.error('Error fetching election standards:', error);
        setStandardsLoading(false);
      }
    };

    fetchElectionStandards();
  }, []);

  useEffect(() => {
    fetchMeetingMinutes();
  }, [fetchMeetingMinutes]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
      {/* Logo Section */}
      <Logo />
      
      {/* Navigation Buttons */}
      <NavigationButtons />

      {/* Latest News Text */}
      <Container maxWidth="xl" sx={{ px: 2, mt: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: { xs: 2, sm: 3 } }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 600,
              color: '#FFA500',
              fontSize: { xs: '1.25rem', sm: '1.75rem', md: '2.125rem' }
            }}
          >
            Latest News
            <br />
            最新动态
          </Typography>

          {adminModeEnabled && !isEditing && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleStartNew}
              sx={{
                backgroundColor: '#FFB84D',
                color: 'white',
                textTransform: 'none',
                '&:hover': {
                  backgroundColor: '#FFA833',
                }
              }}
            >
              Add Meeting Minutes
            </Button>
          )}
        </Box>
      </Container>

      {/* Latest News Content */}
      <Container maxWidth="xl" sx={{ px: 2, mt: 0, mb: 4 }}>
        {/* Success/Error Messages */}
        {successMessage && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMessage('')}>
            {successMessage}
          </Alert>
        )}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {/* Editor Form */}
        {isEditing && (
          <Box sx={{
            mb: 3,
            p: { xs: 2, sm: 3 },
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
            border: '2px solid #FFA500'
          }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: '#333' }}>
              {editingId ? 'Edit Meeting Minutes / 编辑会议纪要' : 'New Meeting Minutes / 新会议纪要'}
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
              Content / 内容 (supports bold, lists, and formatting)
            </Typography>
            <Box sx={{ mb: 2, '.ql-container': { minHeight: '200px' }, backgroundColor: 'white' }}>
              <ReactQuill
                theme="snow"
                value={formData.content}
                onChange={(content) => setFormData({ ...formData, content })}
                modules={quillModules}
                formats={quillFormats}
                placeholder="Enter meeting minutes here... / 在此输入会议纪要..."
              />
            </Box>

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button
                startIcon={<CancelIcon />}
                onClick={handleCancel}
                disabled={saving}
              >
                Cancel / 取消
              </Button>
              <Button
                variant="contained"
                startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                onClick={handleSave}
                disabled={saving}
                sx={{
                  backgroundColor: '#FFA500',
                  '&:hover': { backgroundColor: '#FF8C00' }
                }}
              >
                {saving ? 'Saving...' : 'Save / 保存'}
              </Button>
            </Box>
          </Box>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress sx={{ color: '#FFA500' }} />
          </Box>
        ) : meetings.length === 0 ? (
          <Typography variant="body1" color="text.secondary">
            No meeting minutes available.
          </Typography>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {meetings.map((meeting) => (
              <Accordion
                key={meeting.id || meeting.filename}
                defaultExpanded={false}
                sx={{
                  backgroundColor: 'white',
                  borderRadius: '12px !important',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                  '&:before': {
                    display: 'none',
                  },
                  '&.Mui-expanded': {
                    margin: '0',
                  }
                }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  sx={{
                    '& .MuiAccordionSummary-content': {
                      margin: '12px 0',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      pr: 1
                    },
                    '& .MuiAccordionSummary-expandIconWrapper': {
                      color: '#FFA500',
                    }
                  }}
                >
                  <Box sx={{ flex: 1 }}>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 600,
                        color: '#333',
                        fontSize: { xs: '1rem', sm: '1.25rem' }
                      }}
                    >
                      {meeting.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {formatDate(meeting.meeting_date)}
                      {meeting.isLocal && ' (Local file)'}
                    </Typography>
                  </Box>

                  {adminModeEnabled && !meeting.isLocal && (
                    <Box sx={{ display: 'flex', gap: 0.5, ml: 2 }} onClick={(e) => e.stopPropagation()}>
                      <Tooltip title="Edit / 编辑">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartEdit(meeting);
                          }}
                          disabled={isEditing}
                          sx={{ color: 'primary.main' }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete / 删除">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClick(meeting);
                          }}
                          disabled={isEditing}
                          sx={{ color: 'error.main' }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  )}
                </AccordionSummary>
                <AccordionDetails>
                  <Box
                    dangerouslySetInnerHTML={{
                      __html: meeting.isLocal ? safeMarkdown(meeting.content) : sanitizeHtml(meeting.content)
                    }}
                    sx={{
                      '& h1': {
                        fontSize: '1.8rem',
                        fontWeight: 600,
                        color: '#333',
                        marginBottom: '1rem'
                      },
                      '& h2': {
                        fontSize: '1.5rem',
                        fontWeight: 600,
                        color: '#444',
                        marginBottom: '0.8rem'
                      },
                      '& h3': {
                        fontSize: '1.2rem',
                        fontWeight: 600,
                        color: '#555',
                        marginBottom: '0.6rem'
                      },
                      '& p': {
                        marginBottom: '0.5rem'
                      },
                      '& ul, & ol': {
                        paddingLeft: '1.5rem',
                        marginBottom: '1rem'
                      },
                      '& li': {
                        marginBottom: '0.5rem'
                      }
                    }}
                  />
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        )}
      </Container>

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
            Cancel / 取消
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            variant="contained"
            color="error"
            disabled={deleting}
          >
            {deleting ? <CircularProgress size={20} /> : 'Delete / 删除'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Board of Committee Text */}
      <Container maxWidth="xl" sx={{ px: 2, mt: 4 }}>
        <Box>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 600,
              color: '#FFA500',
              mb: { xs: 2, sm: 3 },
              fontSize: { xs: '1.25rem', sm: '1.75rem', md: '2.125rem' }
            }}
          >
            Board of Committee
            <br />
            新蜂委员会
          </Typography>
        </Box>
      </Container>

      {/* Committee Members Section */}
      <Container maxWidth="xl" sx={{ px: 2, mt: 4, mb: 6 }}>
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(5, 1fr)' },
          gap: 3
        }}>
          {committeeMembers.map((member) => (
            <CommitteeMemberCard
              key={member.id}
              member={member}
              onImageClick={handleImageClick}
            />
          ))}
        </Box>
      </Container>

      {/* Image Modal */}
      <Modal
        open={!!selectedImage}
        onClose={handleCloseModal}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.8)'
        }}
      >
        <Box
          onClick={handleCloseModal}
          sx={{
            position: 'relative',
            width: 'auto',
            maxWidth: '90vw',
            maxHeight: '90vh',
            cursor: 'pointer'
          }}
        >
          {selectedImage && (
            <Box
              component="img"
              src={selectedImage}
              alt="Enlarged Committee Member"
              sx={{
                width: 'auto',
                height: 'auto',
                maxWidth: '100%',
                maxHeight: '90vh',
                objectFit: 'contain',
                borderRadius: '8px'
              }}
            />
          )}
        </Box>
      </Modal>

      {/* Committee Election Standards Section */}
      <Container maxWidth="xl" sx={{ px: 2, mt: 0, mb: 4 }}>
        <Accordion 
          sx={{ 
            backgroundColor: 'white',
            borderRadius: '12px !important',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
            '&:before': {
              display: 'none',
            },
            '&.Mui-expanded': {
              margin: '0',
            }
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            sx={{
              '& .MuiAccordionSummary-content': {
                margin: '12px 0',
              },
              '& .MuiAccordionSummary-expandIconWrapper': {
                color: '#FFA500',
              }
            }}
          >
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                color: '#333',
              }}
            >
              Committee Election Standards
              委员会选举/换届标准
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            {standardsLoading ? (
              <Typography variant="body1" color="text.secondary">
                Loading...
              </Typography>
            ) : (
              <div
                dangerouslySetInnerHTML={{
                  __html: safeMarkdown(electionStandards)
                }}
                style={{
                  '& h1': {
                    fontSize: '1.8rem',
                    fontWeight: 600,
                    color: '#333',
                    marginBottom: '1rem'
                  },
                  '& h2': {
                    fontSize: '1.5rem',
                    fontWeight: 600,
                    color: '#444',
                    marginBottom: '0.8rem'
                  },
                  '& h3': {
                    fontSize: '1.2rem',
                    fontWeight: 600,
                    color: '#555',
                    marginBottom: '0.6rem'
                  },
                  '& ul': {
                    paddingLeft: '1.5rem',
                    marginBottom: '1rem'
                  },
                  '& li': {
                    marginBottom: '0.5rem'
                  }
                }}
              />
            )}
          </AccordionDetails>
        </Accordion>
      </Container>

      {/* History Text */}
      <Container maxWidth="xl" sx={{ px: 2, mt: 4 }}>
        <Box>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 600,
              color: '#FFA500',
              mb: { xs: 2, sm: 3 },
              fontSize: { xs: '1.25rem', sm: '1.75rem', md: '2.125rem' }
            }}
          >
            NewBee's History
            <br />
            新蜂历史
          </Typography>
        </Box>
      </Container>

      {/* History Content */}
      <Container maxWidth="xl" sx={{ px: 2, mt: 0, mb: 4 }}>
        <Box sx={{ 
          backgroundColor: 'white',
          borderRadius: '12px',
          p: { xs: 3, md: 6 },
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
        }}>
          <Typography
            variant="body1"
            sx={{
              mb: 3,
              fontSize: '1rem',
              lineHeight: 1.8,
              color: '#333',
              whiteSpace: 'pre-line'
            }}
          >
            新蜂跑团
             - 纽约新蜂跑团成立于2016年，由Junxiao Yi、Patrick等人共同创办。跑团的初衷是为在纽约的华人群体提供一个共同跑步、结交朋友的平台。随着时间的推移，新蜂跑团逐渐发展壮大，吸引了越来越多热爱跑步的朋友加入。
            如今，新蜂跑团已成为NYRR（纽约路跑协会）旗下300多支跑团中的佼佼者，并位居A组（前12名），展现出强大的竞争力。跑团的规模也不断扩展，目前已拥有600多名成员，其中超过150人已在NYRR注册。我们致力于提供专业的训练和支持，鼓励每一位跑者不断挑战自我，超越极限。
          </Typography>
          <Typography
            variant="body1"
            sx={{
              fontSize: '1rem',
              lineHeight: 1.8,
              color: '#333',
              whiteSpace: 'pre-line'
            }}
          >
            NewBee Running Club
             - NewBee Running Club was founded in 2016 by Junxiao Yi, Patrick, and others with the mission to create a community for Chinese runners in New York to run together and build friendships. Over time, the club has grown and evolved, attracting more and more running enthusiasts.
            Today, the NewBee Running Club is one of the most competitive clubs in the NYRR (New York Road Runners) league, ranking in the A group (top 12) out of over 300 clubs. The club has also expanded significantly, with over 600 members, and more than 150 registered with NYRR. We are committed to providing professional training and support, encouraging each runner to challenge themselves and reach new limits.
          </Typography>
        </Box>
      </Container>

      {/* History Photos Section */}
      <Container maxWidth="xl" sx={{ px: 2, mt: 4 }}>
        <Box sx={{ 
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
          gap: 3
        }}>
          {/* Photo 1 */}
          <Box sx={{ 
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2
          }}>
            <Box
              component="img"
              src="/History - 1.png"
              alt="NewBee History 1"
              sx={{
                width: '100%',
                height: '300px',
                objectFit: 'cover',
                borderRadius: '12px',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
              }}
            />
            <Typography
              variant="body1"
              sx={{
                textAlign: 'center',
                color: '#333',
                fontSize: '0.9rem',
                lineHeight: 1.6
              }}
            >
              2016年成立初期
              Early Days of 2016
            </Typography>
          </Box>

          {/* Photo 2 */}
          <Box sx={{ 
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2
          }}>
            <Box
              component="img"
              src="/History - 2.png"
              alt="NewBee History 2"
              sx={{
                width: '100%',
                height: '300px',
                objectFit: 'cover',
                borderRadius: '12px',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
              }}
            />
            <Typography
              variant="body1"
              sx={{
                textAlign: 'center',
                color: '#333',
                fontSize: '0.9rem',
                lineHeight: 1.6
              }}
            >
              2018年团队发展
              Team Growth in 2018
            </Typography>
          </Box>

          {/* Photo 3 */}
          <Box sx={{ 
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2
          }}>
            <Box
              component="img"
              src="/History - 3.png"
              alt="NewBee History 3"
              sx={{
                width: '100%',
                height: '300px',
                objectFit: 'cover',
                borderRadius: '12px',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
              }}
            />
            <Typography
              variant="body1"
              sx={{
                textAlign: 'center',
                color: '#333',
                fontSize: '0.9rem',
                lineHeight: 1.6
              }}
            >
              2023年成就时刻
              Achievement Moments in 2023
            </Typography>
          </Box>
        </Box>
      </Container>

    </Box>
  );
} 