import {
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Tooltip,
  Typography
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import Logo from '../components/Logo';
import NavigationButtons from '../components/NavigationButtons';
import MeetingMinutesEditor from '../components/MeetingMinutesEditor';
import { useAuth } from '../context/AuthContext';
import { getPendingMembers, approveMember, rejectMember, getMemberByFirebaseUid, getAllMembers } from '../api/members';
import { createEvent, getAllEvents, updateEvent, deleteEvent } from '../api/events';
import { getDonationSummary } from '../api/donors';
import { committeeMembers } from '../data/committeeMembers';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import PeopleIcon from '@mui/icons-material/People';
import EventIcon from '@mui/icons-material/Event';
import EmailIcon from '@mui/icons-material/Email';
import BarChartIcon from '@mui/icons-material/BarChart';
import DescriptionIcon from '@mui/icons-material/Description';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`admin-tabpanel-${index}`}
      aria-labelledby={`admin-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export default function AdminPanelPage() {
  const { currentUser } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [pendingMembers, setPendingMembers] = useState([]);
  const [allMembers, setAllMembers] = useState([]);
  const [events, setEvents] = useState([]);
  const [donationStats, setDonationStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, action: null, id: null, name: '' });
  const [successMessage, setSuccessMessage] = useState('');
  const [isCommittee, setIsCommittee] = useState(false);
  const [currentMemberData, setCurrentMemberData] = useState(null);

  // Event form state
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [eventFormData, setEventFormData] = useState({
    name: '',
    chinese_name: '',
    date: '',
    time: '',
    location: '',
    chinese_location: '',
    description: '',
    chinese_description: '',
    image: '',
    signup_link: '',
    status: 'Upcoming'
  });

  // Newsletter state
  const [newsletterSubject, setNewsletterSubject] = useState('');
  const [newsletterContent, setNewsletterContent] = useState('');
  const [sendingNewsletter, setSendingNewsletter] = useState(false);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Check if current user is committee member
  useEffect(() => {
    const checkCommitteeStatus = async () => {
      if (!currentUser) {
        setIsCommittee(false);
        return;
      }

      try {
        const memberData = await getMemberByFirebaseUid(currentUser.uid);
        setCurrentMemberData(memberData);
        const isAdmin = memberData.status === 'admin';
        const isInCommitteeList = committeeMembers.some(
          cm => cm.name === memberData.display_name || cm.name === memberData.username
        );
        setIsCommittee(isAdmin || isInCommitteeList);
      } catch (err) {
        console.error('Error checking committee status:', err);
        setIsCommittee(false);
      }
    };

    checkCommitteeStatus();
  }, [currentUser]);

  // Fetch all admin data
  useEffect(() => {
    const fetchAdminData = async () => {
      if (!isCommittee || !currentUser) {
        setLoading(false);
        return;
      }

      try {
        const [pending, members, eventList, donations] = await Promise.all([
          getPendingMembers(currentUser.uid).catch(() => []),
          getAllMembers(currentUser.uid).catch(() => []),
          getAllEvents().catch(() => []),
          getDonationSummary().catch(() => [])
        ]);

        setPendingMembers(pending);
        setAllMembers(members);
        setEvents(eventList);
        setDonationStats(donations);
        setError('');
      } catch (err) {
        console.error('Error fetching admin data:', err);
        setError('Failed to load admin data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (isCommittee) {
      fetchAdminData();
    }
  }, [isCommittee, currentUser]);

  const handleApprove = (memberId, memberName) => {
    setConfirmDialog({ open: true, action: 'approve', id: memberId, name: memberName });
  };

  const handleReject = (memberId, memberName) => {
    setConfirmDialog({ open: true, action: 'reject', id: memberId, name: memberName });
  };

  const handleConfirmAction = async () => {
    const { action, id, name } = confirmDialog;
    setActionLoading(id);
    setConfirmDialog({ ...confirmDialog, open: false });

    try {
      if (action === 'approve') {
        await approveMember(id, currentUser.uid);
        setSuccessMessage(`Successfully approved ${name}!`);
        setPendingMembers(prev => prev.filter(m => m.id !== id));
      } else if (action === 'reject') {
        await rejectMember(id, currentUser.uid);
        setSuccessMessage(`Successfully rejected ${name}'s application.`);
        setPendingMembers(prev => prev.filter(m => m.id !== id));
      } else if (action === 'deleteEvent') {
        await deleteEvent(id, currentUser.uid);
        setSuccessMessage('Event deleted successfully!');
        setEvents(prev => prev.filter(e => e.id !== id));
      }
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err) {
      console.error(`Error performing action:`, err);
      setError(`Failed to complete action. Please try again.`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelAction = () => {
    setConfirmDialog({ open: false, action: null, id: null, name: '' });
  };

  // Event form handlers
  const handleEventDialogOpen = (event = null) => {
    if (event) {
      setEditingEvent(event);
      setEventFormData({
        name: event.name || '',
        chinese_name: event.chinese_name || '',
        date: event.date || '',
        time: event.time || '',
        location: event.location || '',
        chinese_location: event.chinese_location || '',
        description: event.description || '',
        chinese_description: event.chinese_description || '',
        image: event.image || '',
        signup_link: event.signup_link || '',
        status: event.status || 'Upcoming'
      });
    } else {
      setEditingEvent(null);
      setEventFormData({
        name: '',
        chinese_name: '',
        date: new Date().toISOString().split('T')[0],
        time: '',
        location: '',
        chinese_location: '',
        description: '',
        chinese_description: '',
        image: '',
        signup_link: '',
        status: 'Upcoming'
      });
    }
    setEventDialogOpen(true);
  };

  const handleEventDialogClose = () => {
    setEventDialogOpen(false);
    setEditingEvent(null);
  };

  const handleEventFormChange = (e) => {
    const { name, value } = e.target;
    setEventFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveEvent = async () => {
    setActionLoading('event');
    try {
      if (editingEvent) {
        const updated = await updateEvent(editingEvent.id, eventFormData, currentUser.uid);
        setEvents(prev => prev.map(e => e.id === editingEvent.id ? updated : e));
        setSuccessMessage('Event updated successfully!');
      } else {
        const created = await createEvent(eventFormData, currentUser.uid);
        setEvents(prev => [created, ...prev]);
        setSuccessMessage('Event created successfully!');
      }
      handleEventDialogClose();
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err) {
      console.error('Error saving event:', err);
      setError('Failed to save event. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteEvent = (eventId, eventName) => {
    setConfirmDialog({ open: true, action: 'deleteEvent', id: eventId, name: eventName });
  };

  // Newsletter handler (placeholder - actual email sending would require backend integration)
  const handleSendNewsletter = async () => {
    if (!newsletterSubject || !newsletterContent) {
      setError('Please fill in both subject and content for the newsletter.');
      return;
    }
    setSendingNewsletter(true);
    try {
      // TODO: Integrate with email service (SendGrid, AWS SES, etc.)
      // For now, just show a success message
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSuccessMessage('Newsletter feature is in development. Email integration coming soon!');
      setNewsletterSubject('');
      setNewsletterContent('');
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err) {
      setError('Failed to send newsletter. Please try again.');
    } finally {
      setSendingNewsletter(false);
    }
  };

  // Analytics calculations
  const getMemberStats = () => {
    const total = allMembers.length;
    const active = allMembers.filter(m => m.status === 'runner' || m.status === 'admin').length;
    const pending = pendingMembers.length;
    const admins = allMembers.filter(m => m.status === 'admin').length;
    return { total, active, pending, admins };
  };

  const getEventStats = () => {
    const total = events.length;
    const upcoming = events.filter(e => e.status === 'Upcoming').length;
    const highlights = events.filter(e => e.status === 'Highlight').length;
    return { total, upcoming, highlights };
  };

  const getDonationTotals = () => {
    const individual = donationStats.find(d => d.donor_type === 'individual') || { total_amount: 0, donor_count: 0 };
    const enterprise = donationStats.find(d => d.donor_type === 'enterprise') || { total_amount: 0, donor_count: 0 };
    return {
      total: parseFloat(individual.total_amount || 0) + parseFloat(enterprise.total_amount || 0),
      individualTotal: parseFloat(individual.total_amount || 0),
      enterpriseTotal: parseFloat(enterprise.total_amount || 0),
      donorCount: (individual.donor_count || 0) + (enterprise.donor_count || 0)
    };
  };

  if (!currentUser) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
        <Logo />
        <NavigationButtons />
        <Container maxWidth="xl" sx={{ px: 2, mt: 4 }}>
          <Alert severity="warning">
            Please log in to access the admin panel.
            <br />
            请登录以访问管理面板。
          </Alert>
        </Container>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
        <Logo />
        <NavigationButtons />
        <Container maxWidth="xl" sx={{ px: 2, mt: 4, display: 'flex', justifyContent: 'center' }}>
          <CircularProgress sx={{ color: '#FFA500' }} />
        </Container>
      </Box>
    );
  }

  if (!isCommittee) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
        <Logo />
        <NavigationButtons />
        <Container maxWidth="xl" sx={{ px: 2, mt: 4 }}>
          <Alert severity="error">
            Access Denied: You do not have permission to access this page.
            <br />
            访问被拒绝：您没有权限访问此页面。
          </Alert>
        </Container>
      </Box>
    );
  }

  const memberStats = getMemberStats();
  const eventStats = getEventStats();
  const donationTotals = getDonationTotals();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
      <Logo />
      <NavigationButtons />

      <Container maxWidth="xl" sx={{ px: 2, mt: 4 }}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 600,
            color: '#FFA500',
            mb: { xs: 2, sm: 3 },
            fontSize: { xs: '1.25rem', sm: '1.75rem', md: '2.125rem' },
            textAlign: 'center'
          }}
        >
          Admin Dashboard
          <br />
          管理面板
        </Typography>

        {successMessage && (
          <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccessMessage('')}>
            {successMessage}
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {/* Tabbed Interface */}
        <Paper sx={{ width: '100%', mb: 3 }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              borderBottom: 1,
              borderColor: 'divider',
              '& .MuiTab-root': {
                minHeight: 64,
                textTransform: 'none',
                fontWeight: 500,
              },
              '& .Mui-selected': {
                color: '#FFA500 !important',
              },
              '& .MuiTabs-indicator': {
                backgroundColor: '#FFA500',
              },
            }}
          >
            <Tab icon={<PeopleIcon />} label="Members" iconPosition="start" />
            <Tab icon={<EventIcon />} label="Events" iconPosition="start" />
            <Tab icon={<EmailIcon />} label="Newsletter" iconPosition="start" />
            <Tab icon={<BarChartIcon />} label="Analytics" iconPosition="start" />
            <Tab icon={<DescriptionIcon />} label="Meeting Notes" iconPosition="start" />
          </Tabs>
        </Paper>

        {/* Tab 0: Manage Members */}
        <TabPanel value={tabValue} index={0}>
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
            Pending Applications ({pendingMembers.length})
          </Typography>

          {pendingMembers.length === 0 ? (
            <Alert severity="info">
              No pending applications at this time. / 目前没有待审核的申请。
            </Alert>
          ) : (
            <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
              {pendingMembers.map((member) => (
                <Card key={member.id} sx={{ border: '1px solid #FFA500' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6">{member.display_name || member.username}</Typography>
                      <Chip label="Pending" color="warning" size="small" />
                    </Box>
                    <Typography color="text.secondary" gutterBottom>
                      <strong>Email:</strong> {member.email}
                    </Typography>
                    {member.nyrr_member_id && (
                      <Typography color="text.secondary" gutterBottom>
                        <strong>NYRR ID:</strong> {member.nyrr_member_id}
                      </Typography>
                    )}
                    <Typography color="text.secondary" gutterBottom>
                      <strong>Applied:</strong> {new Date(member.created_at).toLocaleString()}
                    </Typography>
                  </CardContent>
                  <CardActions sx={{ justifyContent: 'flex-end', px: 2, pb: 2 }}>
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      onClick={() => handleReject(member.id, member.display_name || member.username)}
                      disabled={actionLoading === member.id}
                    >
                      {actionLoading === member.id ? <CircularProgress size={20} /> : 'Reject'}
                    </Button>
                    <Button
                      size="small"
                      variant="contained"
                      onClick={() => handleApprove(member.id, member.display_name || member.username)}
                      disabled={actionLoading === member.id}
                      sx={{ backgroundColor: '#FFA500', '&:hover': { backgroundColor: '#FF8C00' } }}
                    >
                      {actionLoading === member.id ? <CircularProgress size={20} /> : 'Approve'}
                    </Button>
                  </CardActions>
                </Card>
              ))}
            </Box>
          )}

          <Typography variant="h5" sx={{ fontWeight: 600, mt: 5, mb: 3 }}>
            All Members ({allMembers.length})
          </Typography>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: 'rgba(255, 165, 0, 0.1)' }}>
                  <TableCell><strong>Name</strong></TableCell>
                  <TableCell><strong>Email</strong></TableCell>
                  <TableCell><strong>Status</strong></TableCell>
                  <TableCell><strong>Joined</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {allMembers.slice(0, 20).map((member) => (
                  <TableRow key={member.id} hover>
                    <TableCell>{member.display_name || member.username}</TableCell>
                    <TableCell>{member.email}</TableCell>
                    <TableCell>
                      <Chip
                        label={member.status}
                        size="small"
                        color={
                          member.status === 'admin' ? 'primary' :
                          member.status === 'runner' ? 'success' :
                          member.status === 'pending' ? 'warning' : 'default'
                        }
                      />
                    </TableCell>
                    <TableCell>
                      {member.created_at ? new Date(member.created_at).toLocaleDateString() : 'N/A'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          {allMembers.length > 20 && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
              Showing 20 of {allMembers.length} members
            </Typography>
          )}
        </TabPanel>

        {/* Tab 1: Create/Manage Events */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              Manage Events
            </Typography>
            <Button
              variant="contained"
              onClick={() => handleEventDialogOpen()}
              sx={{ backgroundColor: '#FFA500', '&:hover': { backgroundColor: '#FF8C00' } }}
            >
              + Create Event
            </Button>
          </Box>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: 'rgba(255, 165, 0, 0.1)' }}>
                  <TableCell><strong>Event Name</strong></TableCell>
                  <TableCell><strong>Date</strong></TableCell>
                  <TableCell><strong>Location</strong></TableCell>
                  <TableCell><strong>Status</strong></TableCell>
                  <TableCell align="right"><strong>Actions</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {events.map((event) => (
                  <TableRow key={event.id} hover>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight={500}>{event.name}</Typography>
                        {event.chinese_name && (
                          <Typography variant="caption" color="text.secondary">{event.chinese_name}</Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>{event.date} {event.time}</TableCell>
                    <TableCell>{event.location || 'TBD'}</TableCell>
                    <TableCell>
                      <Chip
                        label={event.status}
                        size="small"
                        color={event.status === 'Upcoming' ? 'primary' : event.status === 'Highlight' ? 'success' : 'default'}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => handleEventDialogOpen(event)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" onClick={() => handleDeleteEvent(event.id, event.name)}>
                          <DeleteIcon fontSize="small" color="error" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Tab 2: Send Newsletter */}
        <TabPanel value={tabValue} index={2}>
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
            Send Newsletter
          </Typography>

          <Paper sx={{ p: 3 }}>
            <Alert severity="info" sx={{ mb: 3 }}>
              Newsletter functionality requires email service integration (coming soon).
              <br />
              邮件通知功能需要邮件服务集成（即将推出）。
            </Alert>

            <TextField
              fullWidth
              label="Subject / 主题"
              value={newsletterSubject}
              onChange={(e) => setNewsletterSubject(e.target.value)}
              margin="normal"
            />

            <TextField
              fullWidth
              label="Content / 内容"
              value={newsletterContent}
              onChange={(e) => setNewsletterContent(e.target.value)}
              margin="normal"
              multiline
              rows={8}
              placeholder="Write your newsletter content here... / 在此输入邮件内容..."
            />

            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                onClick={handleSendNewsletter}
                disabled={sendingNewsletter || !newsletterSubject || !newsletterContent}
                sx={{ backgroundColor: '#FFA500', '&:hover': { backgroundColor: '#FF8C00' } }}
              >
                {sendingNewsletter ? <CircularProgress size={24} /> : 'Send Newsletter'}
              </Button>
            </Box>
          </Paper>
        </TabPanel>

        {/* Tab 3: View Analytics */}
        <TabPanel value={tabValue} index={3}>
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
            Club Analytics
          </Typography>

          <Grid container spacing={3}>
            {/* Member Stats */}
            <Grid item xs={12} md={6} lg={3}>
              <Paper sx={{ p: 3, textAlign: 'center', border: '2px solid #FFA500' }}>
                <PeopleIcon sx={{ fontSize: 48, color: '#FFA500', mb: 1 }} />
                <Typography variant="h3" sx={{ fontWeight: 700, color: '#FFA500' }}>
                  {memberStats.total}
                </Typography>
                <Typography variant="body1" color="text.secondary">Total Members</Typography>
                <Typography variant="caption" color="text.secondary">
                  {memberStats.active} active, {memberStats.pending} pending
                </Typography>
              </Paper>
            </Grid>

            {/* Event Stats */}
            <Grid item xs={12} md={6} lg={3}>
              <Paper sx={{ p: 3, textAlign: 'center', border: '2px solid #FFA500' }}>
                <EventIcon sx={{ fontSize: 48, color: '#FFA500', mb: 1 }} />
                <Typography variant="h3" sx={{ fontWeight: 700, color: '#FFA500' }}>
                  {eventStats.total}
                </Typography>
                <Typography variant="body1" color="text.secondary">Total Events</Typography>
                <Typography variant="caption" color="text.secondary">
                  {eventStats.upcoming} upcoming, {eventStats.highlights} highlights
                </Typography>
              </Paper>
            </Grid>

            {/* Donation Stats */}
            <Grid item xs={12} md={6} lg={3}>
              <Paper sx={{ p: 3, textAlign: 'center', border: '2px solid #FFA500' }}>
                <Typography variant="h6" sx={{ color: '#FFA500', mb: 1 }}>$</Typography>
                <Typography variant="h3" sx={{ fontWeight: 700, color: '#FFA500' }}>
                  {donationTotals.total.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </Typography>
                <Typography variant="body1" color="text.secondary">Total Donations</Typography>
                <Typography variant="caption" color="text.secondary">
                  From {donationTotals.donorCount} donors
                </Typography>
              </Paper>
            </Grid>

            {/* Admin Stats */}
            <Grid item xs={12} md={6} lg={3}>
              <Paper sx={{ p: 3, textAlign: 'center', border: '2px solid #FFA500' }}>
                <Typography variant="h6" sx={{ color: '#FFA500', mb: 1 }}>Committee</Typography>
                <Typography variant="h3" sx={{ fontWeight: 700, color: '#FFA500' }}>
                  {memberStats.admins}
                </Typography>
                <Typography variant="body1" color="text.secondary">Admin Members</Typography>
                <Typography variant="caption" color="text.secondary">
                  Managing the club
                </Typography>
              </Paper>
            </Grid>
          </Grid>

          {/* Donation Breakdown */}
          <Paper sx={{ p: 3, mt: 4 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              Donation Breakdown
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Box sx={{ p: 2, backgroundColor: 'rgba(255, 165, 0, 0.05)', borderRadius: 2 }}>
                  <Typography variant="body2" color="text.secondary">Individual Donations</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 600 }}>
                    ${donationTotals.individualTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ p: 2, backgroundColor: 'rgba(255, 165, 0, 0.05)', borderRadius: 2 }}>
                  <Typography variant="body2" color="text.secondary">Enterprise Donations</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 600 }}>
                    ${donationTotals.enterpriseTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </TabPanel>

        {/* Tab 4: Meeting Minutes */}
        <TabPanel value={tabValue} index={4}>
          <MeetingMinutesEditor firebaseUid={currentUser?.uid} />
        </TabPanel>
      </Container>

      {/* Event Create/Edit Dialog */}
      <Dialog open={eventDialogOpen} onClose={handleEventDialogClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingEvent ? 'Edit Event / 编辑活动' : 'Create Event / 创建活动'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Event Name (English)"
                name="name"
                value={eventFormData.name}
                onChange={handleEventFormChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Event Name (Chinese)"
                name="chinese_name"
                value={eventFormData.chinese_name}
                onChange={handleEventFormChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Date"
                name="date"
                type="date"
                value={eventFormData.date}
                onChange={handleEventFormChange}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Time"
                name="time"
                value={eventFormData.time}
                onChange={handleEventFormChange}
                placeholder="e.g., 8:00 AM"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Location (English)"
                name="location"
                value={eventFormData.location}
                onChange={handleEventFormChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Location (Chinese)"
                name="chinese_location"
                value={eventFormData.chinese_location}
                onChange={handleEventFormChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description (English)"
                name="description"
                value={eventFormData.description}
                onChange={handleEventFormChange}
                multiline
                rows={3}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description (Chinese)"
                name="chinese_description"
                value={eventFormData.chinese_description}
                onChange={handleEventFormChange}
                multiline
                rows={3}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Image URL"
                name="image"
                value={eventFormData.image}
                onChange={handleEventFormChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Signup Link"
                name="signup_link"
                value={eventFormData.signup_link}
                onChange={handleEventFormChange}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  name="status"
                  value={eventFormData.status}
                  onChange={handleEventFormChange}
                  label="Status"
                >
                  <MenuItem value="Upcoming">Upcoming</MenuItem>
                  <MenuItem value="Highlight">Highlight</MenuItem>
                  <MenuItem value="Cancelled">Cancelled</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleEventDialogClose} disabled={actionLoading === 'event'}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveEvent}
            disabled={actionLoading === 'event' || !eventFormData.name || !eventFormData.date}
            sx={{ backgroundColor: '#FFA500', '&:hover': { backgroundColor: '#FF8C00' } }}
          >
            {actionLoading === 'event' ? <CircularProgress size={24} /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialog.open} onClose={handleCancelAction}>
        <DialogTitle>
          {confirmDialog.action === 'approve' ? 'Approve Application?' :
           confirmDialog.action === 'reject' ? 'Reject Application?' :
           confirmDialog.action === 'deleteEvent' ? 'Delete Event?' : 'Confirm Action'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {confirmDialog.action === 'approve' && (
              <>Are you sure you want to approve {confirmDialog.name}'s application?</>
            )}
            {confirmDialog.action === 'reject' && (
              <>Are you sure you want to reject {confirmDialog.name}'s application?</>
            )}
            {confirmDialog.action === 'deleteEvent' && (
              <>Are you sure you want to delete the event "{confirmDialog.name}"? This action cannot be undone.</>
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelAction}>Cancel</Button>
          <Button
            onClick={handleConfirmAction}
            variant="contained"
            color={confirmDialog.action === 'approve' ? 'primary' : 'error'}
            autoFocus
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
