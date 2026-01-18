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
  Typography
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import Logo from '../components/Logo';
import NavigationButtons from '../components/NavigationButtons';
import { useAuth } from '../context/AuthContext';
import { getPendingMembers, approveMember, rejectMember, getMemberByFirebaseUid } from '../api/members';
import { committeeMembers } from '../data/committeeMembers';

export default function AdminPanelPage() {
  const { currentUser } = useAuth();
  const [pendingMembers, setPendingMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, action: null, memberId: null, memberName: '' });
  const [successMessage, setSuccessMessage] = useState('');
  const [isCommittee, setIsCommittee] = useState(false);
  const [currentMemberData, setCurrentMemberData] = useState(null);

  // Check if current user is committee member
  useEffect(() => {
    const checkCommitteeStatus = async () => {
      if (!currentUser) {
        setIsCommittee(false);
        return;
      }

      try {
        // Get current user's member data
        const memberData = await getMemberByFirebaseUid(currentUser.uid);
        setCurrentMemberData(memberData);

        // Check if user is admin status OR is in the committee list
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

  // Fetch pending members
  useEffect(() => {
    const fetchPendingMembers = async () => {
      if (!isCommittee) {
        setLoading(false);
        return;
      }

      try {
        const members = await getPendingMembers(currentUser.uid);
        setPendingMembers(members);
        setError('');
      } catch (err) {
        console.error('Error fetching pending members:', err);
        setError('Failed to load pending applications. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (isCommittee) {
      fetchPendingMembers();
    }
  }, [isCommittee]);

  const handleApprove = (memberId, memberName) => {
    setConfirmDialog({
      open: true,
      action: 'approve',
      memberId,
      memberName
    });
  };

  const handleReject = (memberId, memberName) => {
    setConfirmDialog({
      open: true,
      action: 'reject',
      memberId,
      memberName
    });
  };

  const handleConfirmAction = async () => {
    const { action, memberId, memberName } = confirmDialog;
    setActionLoading(memberId);
    setConfirmDialog({ ...confirmDialog, open: false });

    try {
      if (action === 'approve') {
        await approveMember(memberId, currentUser.uid);
        setSuccessMessage(`Successfully approved ${memberName}!`);
      } else {
        await rejectMember(memberId, currentUser.uid);
        setSuccessMessage(`Successfully rejected ${memberName}'s application.`);
      }

      // Remove the member from the list
      setPendingMembers(prev => prev.filter(m => m.id !== memberId));

      // Clear success message after 5 seconds
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err) {
      console.error(`Error ${action}ing member:`, err);
      setError(`Failed to ${action} member. Please try again.`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelAction = () => {
    setConfirmDialog({ open: false, action: null, memberId: null, memberName: '' });
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
          <CircularProgress />
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
            mb: 3
          }}
        >
          Admin Panel - Pending Applications
          <br />
          管理面板 - 待审核申请
        </Typography>

        {successMessage && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {successMessage}
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {pendingMembers.length === 0 ? (
          <Alert severity="info">
            No pending applications at this time.
            <br />
            目前没有待审核的申请。
          </Alert>
        ) : (
          <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
            {pendingMembers.map((member) => (
              <Card key={member.id} sx={{ border: '1px solid #FFA500' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" component="div">
                      {member.display_name || member.username}
                    </Typography>
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

                  {member.phone && (
                    <Typography color="text.secondary" gutterBottom>
                      <strong>Phone:</strong> {member.phone}
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
                    {actionLoading === member.id ? <CircularProgress size={20} /> : 'Reject 拒绝'}
                  </Button>
                  <Button
                    size="small"
                    variant="contained"
                    onClick={() => handleApprove(member.id, member.display_name || member.username)}
                    disabled={actionLoading === member.id}
                    sx={{
                      backgroundColor: '#FFA500',
                      '&:hover': { backgroundColor: '#FF8C00' }
                    }}
                  >
                    {actionLoading === member.id ? <CircularProgress size={20} /> : 'Approve 批准'}
                  </Button>
                </CardActions>
              </Card>
            ))}
          </Box>
        )}
      </Container>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialog.open} onClose={handleCancelAction}>
        <DialogTitle>
          {confirmDialog.action === 'approve' ? 'Approve Application?' : 'Reject Application?'}
          <br />
          {confirmDialog.action === 'approve' ? '批准申请？' : '拒绝申请？'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {confirmDialog.action === 'approve' ? (
              <>
                Are you sure you want to approve {confirmDialog.memberName}'s application?
                They will be granted access to all club features and receive an approval email.
                <br /><br />
                您确定要批准 {confirmDialog.memberName} 的申请吗？
                他们将获得所有俱乐部功能的访问权限并收到批准邮件。
              </>
            ) : (
              <>
                Are you sure you want to reject {confirmDialog.memberName}'s application?
                Their account will be deleted from the system.
                <br /><br />
                您确定要拒绝 {confirmDialog.memberName} 的申请吗？
                他们的账户将从系统中删除。
              </>
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelAction}>
            Cancel 取消
          </Button>
          <Button
            onClick={handleConfirmAction}
            variant="contained"
            color={confirmDialog.action === 'approve' ? 'primary' : 'error'}
            autoFocus
          >
            {confirmDialog.action === 'approve' ? 'Approve 批准' : 'Reject 拒绝'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
