import {
  Alert,
  Avatar,
  Badge,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  Paper,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography
} from '@mui/material';
import {
  Edit as EditIcon,
  EmojiEvents as TrophyIcon,
  DirectionsRun as RunIcon,
  Timer as TimerIcon,
  Close as CloseIcon,
  CameraAlt as CameraIcon,
  LocationOn as LocationIcon,
  Stars as StarsIcon
} from '@mui/icons-material';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context';
import { logout } from '../firebase/auth';
import { storage } from '../firebase/config';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getMemberByFirebaseUid, updateMember } from '../api/members';
import { getMemberRaceResults } from '../api/results';

const ProfilePage = () => {
  const { currentUser } = useAuth();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // Member data state
  const [memberData, setMemberData] = useState(null);
  const [loadingMember, setLoadingMember] = useState(true);

  // Race results state
  const [raceData, setRaceData] = useState({ results: [], stats: { total_races: 0, prs: {}, recent_results: [] } });
  const [loadingRaces, setLoadingRaces] = useState(false);

  // Photo upload state
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [saving, setSaving] = useState(false);

  // Fetch member data
  const fetchMemberData = useCallback(async () => {
    if (!currentUser?.uid) return;

    setLoadingMember(true);
    try {
      const response = await getMemberByFirebaseUid(currentUser.uid);
      setMemberData(response);

      // If member has NYRR ID or name, fetch race results
      if (response?.nyrr_member_id || response?.display_name) {
        setLoadingRaces(true);
        try {
          const searchKey = response.nyrr_member_id || response.display_name;
          const raceResponse = await getMemberRaceResults(searchKey);
          setRaceData(raceResponse);
        } catch (raceErr) {
          console.error('Failed to fetch race results:', raceErr);
        } finally {
          setLoadingRaces(false);
        }
      }
    } catch (err) {
      console.error('Failed to fetch member data:', err);
      // Member might not exist in database yet - that's ok
    } finally {
      setLoadingMember(false);
    }
  }, [currentUser?.uid]);

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
    } else {
      fetchMemberData();
    }
  }, [currentUser, navigate, fetchMemberData]);

  const handleLogout = async () => {
    setError('');

    try {
      const { error } = await logout();
      if (error) {
        setError(error);
      }
    } catch (err) {
      setError('Failed to log out');
    }
  };

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file. / 请选择图片文件。');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB. / 图片大小不能超过5MB。');
      return;
    }

    if (!memberData?.id) {
      setError('Cannot upload photo: Member not found in database. / 无法上传照片：数据库中找不到会员。');
      return;
    }

    setUploadingPhoto(true);
    setError('');

    try {
      // Create storage reference
      const timestamp = Date.now();
      const fileName = `${timestamp}_${file.name}`;
      const storageRef = ref(storage, `profile-photos/${currentUser.uid}/${fileName}`);

      // Upload file
      await uploadBytes(storageRef, file);

      // Get download URL
      const downloadURL = await getDownloadURL(storageRef);

      // Update member with new photo URL
      await updateMember(memberData.id, { profile_photo_url: downloadURL });

      setSuccess('Profile photo updated! / 头像更新成功！');
      fetchMemberData(); // Refresh data
    } catch (err) {
      console.error('Error uploading photo:', err);
      setError('Failed to upload photo. Please try again. / 上传失败，请重试。');
    } finally {
      setUploadingPhoto(false);
      // Clear the input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleOpenEditDialog = () => {
    setEditFormData({
      display_name: memberData?.display_name || currentUser?.displayName || '',
      display_name_cn: memberData?.display_name_cn || '',
      email: memberData?.email || currentUser?.email || '',
      phone: memberData?.phone || '',
      nyrr_member_id: memberData?.nyrr_member_id || '',
      emergency_contact_name: memberData?.emergency_contact_name || '',
      emergency_contact_phone: memberData?.emergency_contact_phone || '',
      location: memberData?.location || '',
      weekly_frequency: memberData?.weekly_frequency || '',
      monthly_mileage: memberData?.monthly_mileage || '',
      running_experience: memberData?.running_experience || '',
      goals: memberData?.goals || ''
    });
    setEditDialogOpen(true);
  };

  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
    setEditFormData({});
  };

  const handleEditFormChange = (field) => (event) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const handleSaveProfile = async () => {
    if (!memberData?.id) {
      setError('Cannot update profile: Member not found in database');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await updateMember(memberData.id, editFormData);
      setSuccess('Profile updated successfully! / 个人资料更新成功！');
      handleCloseEditDialog();
      fetchMemberData(); // Refresh data
    } catch (err) {
      setError('Failed to update profile. Please try again. / 更新失败，请重试。');
    } finally {
      setSaving(false);
    }
  };

  if (!currentUser) return null;

  const displayName = memberData?.display_name || currentUser?.displayName || 'User';
  const displayNameCn = memberData?.display_name_cn;

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Hidden file input for photo upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handlePhotoUpload}
        accept="image/*"
        style={{ display: 'none' }}
      />

      {/* Header Section */}
      <Paper elevation={3} sx={{ p: 4, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Tooltip title="Click to change photo / 点击更换头像">
              <Badge
                overlap="circular"
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                badgeContent={
                  <IconButton
                    size="small"
                    onClick={handlePhotoClick}
                    disabled={uploadingPhoto}
                    sx={{
                      backgroundColor: '#FFB84D',
                      color: 'white',
                      width: 32,
                      height: 32,
                      '&:hover': { backgroundColor: '#FFA833' }
                    }}
                  >
                    {uploadingPhoto ? <CircularProgress size={16} color="inherit" /> : <CameraIcon fontSize="small" />}
                  </IconButton>
                }
              >
                <Avatar
                  src={memberData?.profile_photo_url || currentUser?.photoURL}
                  alt={displayName}
                  sx={{
                    width: 100,
                    height: 100,
                    cursor: 'pointer',
                    '&:hover': { opacity: 0.8 }
                  }}
                  onClick={handlePhotoClick}
                />
              </Badge>
            </Tooltip>
            <Box>
              <Typography variant="h4" component="h1">
                {displayName}
                {displayNameCn && (
                  <Typography component="span" variant="h5" color="text.secondary" sx={{ ml: 1 }}>
                    ({displayNameCn})
                  </Typography>
                )}
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
                {memberData?.email || currentUser?.email}
              </Typography>
              {memberData?.status && (
                <Chip
                  label={memberData.status === 'runner' ? 'Member / 会员' :
                         memberData.status === 'admin' ? 'Admin / 管理员' :
                         memberData.status === 'pending' ? 'Pending / 待审核' : memberData.status}
                  color={memberData.status === 'admin' ? 'primary' :
                         memberData.status === 'runner' ? 'success' : 'default'}
                  size="small"
                  sx={{ mt: 1 }}
                />
              )}
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {memberData && (
              <Button
                variant="outlined"
                startIcon={<EditIcon />}
                onClick={handleOpenEditDialog}
                sx={{ textTransform: 'none' }}
              >
                Edit Profile
              </Button>
            )}
            <Button
              variant="contained"
              onClick={handleLogout}
              sx={{
                backgroundColor: '#FFB84D',
                color: 'white',
                textTransform: 'none',
                '&:hover': {
                  backgroundColor: '#FFA833',
                }
              }}
            >
              Log Out
            </Button>
          </Box>
        </Box>

        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mt: 2 }}>{success}</Alert>}

        {/* Profile Details */}
        {loadingMember ? (
          <Box sx={{ mt: 3 }}>
            <Skeleton variant="text" width="60%" />
            <Skeleton variant="text" width="40%" />
          </Box>
        ) : memberData && (
          <Box sx={{ mt: 3 }}>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="caption" color="text.secondary">Phone / 电话</Typography>
                <Typography variant="body1">{memberData.phone || '-'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="caption" color="text.secondary">NYRR ID</Typography>
                <Typography variant="body1">{memberData.nyrr_member_id || '-'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="caption" color="text.secondary">Join Date / 加入日期</Typography>
                <Typography variant="body1">{memberData.join_date || '-'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="caption" color="text.secondary">Emergency Contact / 紧急联系人</Typography>
                <Typography variant="body1">
                  {memberData.emergency_contact_name ?
                    `${memberData.emergency_contact_name} (${memberData.emergency_contact_phone || '-'})` : '-'}
                </Typography>
              </Grid>
            </Grid>
          </Box>
        )}
      </Paper>

      {/* Running Profile Section */}
      {memberData && (memberData.location || memberData.weekly_frequency || memberData.monthly_mileage || memberData.running_experience || memberData.goals) && (
        <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LocationIcon color="primary" /> Running Profile / 跑步档案
          </Typography>
          <Grid container spacing={2}>
            {memberData.location && (
              <Grid item xs={12} sm={6} md={4}>
                <Typography variant="caption" color="text.secondary">Location / 地点</Typography>
                <Typography variant="body1">{memberData.location}</Typography>
              </Grid>
            )}
            {memberData.weekly_frequency && (
              <Grid item xs={12} sm={6} md={4}>
                <Typography variant="caption" color="text.secondary">Weekly Frequency / 每周跑步频次</Typography>
                <Typography variant="body1">{memberData.weekly_frequency}</Typography>
              </Grid>
            )}
            {memberData.monthly_mileage && (
              <Grid item xs={12} sm={6} md={4}>
                <Typography variant="caption" color="text.secondary">Monthly Mileage / 月跑量</Typography>
                <Typography variant="body1">{memberData.monthly_mileage}</Typography>
              </Grid>
            )}
            {memberData.running_experience && (
              <Grid item xs={12}>
                <Typography variant="caption" color="text.secondary">Running Experience / 跑步经历</Typography>
                <Typography variant="body1">{memberData.running_experience}</Typography>
              </Grid>
            )}
            {memberData.goals && (
              <Grid item xs={12}>
                <Typography variant="caption" color="text.secondary">Goals / 目标</Typography>
                <Typography variant="body1">{memberData.goals}</Typography>
              </Grid>
            )}
          </Grid>
        </Paper>
      )}

      {/* Club Credits Section */}
      {memberData && (
        <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <StarsIcon sx={{ color: '#FFB84D' }} /> Club Credits / 俱乐部积分
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6} sm={3}>
              <Card variant="outlined" sx={{ textAlign: 'center', p: 2 }}>
                <Typography variant="h4" color="primary">{memberData.registration_credits || 0}</Typography>
                <Typography variant="body2" color="text.secondary">Registration / 比赛积分</Typography>
              </Card>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Card variant="outlined" sx={{ textAlign: 'center', p: 2 }}>
                <Typography variant="h4" color="primary">{memberData.checkin_credits || 0}</Typography>
                <Typography variant="body2" color="text.secondary">Check-in / 签到积分</Typography>
              </Card>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Card variant="outlined" sx={{ textAlign: 'center', p: 2 }}>
                <Typography variant="h4" color="primary">{memberData.volunteer_credits || 0}</Typography>
                <Typography variant="body2" color="text.secondary">Volunteer / 志愿者积分</Typography>
              </Card>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Card variant="outlined" sx={{ textAlign: 'center', p: 2 }}>
                <Typography variant="h4" sx={{ color: '#FFB84D' }}>
                  {(memberData.registration_credits || 0) + (memberData.checkin_credits || 0) + (memberData.volunteer_credits || 0)}
                </Typography>
                <Typography variant="body2" color="text.secondary">Total / 总积分</Typography>
              </Card>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Race Statistics Section */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card elevation={2}>
            <CardContent sx={{ textAlign: 'center' }}>
              <RunIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="h3" component="div">
                {loadingRaces ? <CircularProgress size={24} /> : raceData.stats.total_races}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Races / 总比赛数
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card elevation={2}>
            <CardContent sx={{ textAlign: 'center' }}>
              <TrophyIcon sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
              <Typography variant="h3" component="div">
                {loadingRaces ? <CircularProgress size={24} /> : Object.keys(raceData.stats.prs).length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Personal Records / 个人记录
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card elevation={2}>
            <CardContent sx={{ textAlign: 'center' }}>
              <TimerIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
              <Typography variant="h3" component="div">
                {loadingRaces ? <CircularProgress size={24} /> : raceData.stats.recent_results.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Recent Races / 近期比赛
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Personal Records Section */}
      {Object.keys(raceData.stats.prs).length > 0 && (
        <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TrophyIcon color="warning" /> Personal Records / 个人最佳成绩
          </Typography>
          <Grid container spacing={2}>
            {Object.entries(raceData.stats.prs).map(([distance, pr]) => (
              <Grid item xs={12} sm={6} md={4} key={distance}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary">{distance}</Typography>
                    <Typography variant="h5" color="primary">{pr.time}</Typography>
                    <Typography variant="body2">{pr.race}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {pr.date} {pr.pace && `• Pace: ${pr.pace}`}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Paper>
      )}

      {/* Race History Section */}
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <RunIcon color="primary" /> Race History / 比赛历史
        </Typography>

        {loadingRaces ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : raceData.results.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography color="text.secondary">
              No race results found. / 暂无比赛记录。
            </Typography>
            {!memberData?.nyrr_member_id && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Add your NYRR ID to see your race history. / 添加您的NYRR ID以查看比赛记录。
              </Typography>
            )}
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date / 日期</TableCell>
                  <TableCell>Race / 比赛</TableCell>
                  <TableCell>Distance / 距离</TableCell>
                  <TableCell>Time / 成绩</TableCell>
                  <TableCell>Pace / 配速</TableCell>
                  <TableCell>Place / 名次</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {raceData.results.map((result) => (
                  <TableRow key={result.id} hover>
                    <TableCell>{result.race_date}</TableCell>
                    <TableCell>{result.race}</TableCell>
                    <TableCell>{result.distance}</TableCell>
                    <TableCell sx={{ fontWeight: 'medium' }}>{result.overall_time}</TableCell>
                    <TableCell>{result.pace}</TableCell>
                    <TableCell>
                      {result.overall_place && `#${result.overall_place}`}
                      {result.gender_place && (
                        <Typography variant="caption" display="block" color="text.secondary">
                          Gender: #{result.gender_place}
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Edit Profile Dialog */}
      <Dialog open={editDialogOpen} onClose={handleCloseEditDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          Edit Profile / 编辑资料
          <IconButton
            onClick={handleCloseEditDialog}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 0 }}>
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="primary" sx={{ mb: 1 }}>
                Basic Information / 基本信息
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Name (English) / 英文名"
                value={editFormData.display_name || ''}
                onChange={handleEditFormChange('display_name')}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Name (Chinese) / 中文名"
                value={editFormData.display_name_cn || ''}
                onChange={handleEditFormChange('display_name_cn')}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email / 邮箱"
                type="email"
                value={editFormData.email || ''}
                onChange={handleEditFormChange('email')}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phone / 电话"
                value={editFormData.phone || ''}
                onChange={handleEditFormChange('phone')}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="NYRR Runner ID"
                value={editFormData.nyrr_member_id || ''}
                onChange={handleEditFormChange('nyrr_member_id')}
                helperText="Your NYRR account ID for race results"
              />
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle2" color="primary" sx={{ mb: 1, mt: 2 }}>
                Emergency Contact / 紧急联系人
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Contact Name / 联系人姓名"
                value={editFormData.emergency_contact_name || ''}
                onChange={handleEditFormChange('emergency_contact_name')}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Contact Phone / 联系人电话"
                value={editFormData.emergency_contact_phone || ''}
                onChange={handleEditFormChange('emergency_contact_phone')}
              />
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle2" color="primary" sx={{ mb: 1, mt: 2 }}>
                Running Profile / 跑步档案
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Location / 跑步地点"
                value={editFormData.location || ''}
                onChange={handleEditFormChange('location')}
                helperText="Where do you usually run? / 你通常在哪里跑步？"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Weekly Frequency / 每周跑步频次"
                value={editFormData.weekly_frequency || ''}
                onChange={handleEditFormChange('weekly_frequency')}
                helperText="e.g., 3-4 times per week / 例如：每周3-4次"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Monthly Mileage / 月跑量"
                value={editFormData.monthly_mileage || ''}
                onChange={handleEditFormChange('monthly_mileage')}
                helperText="e.g., 100 miles / 例如：100英里"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Running Experience / 跑步经历"
                value={editFormData.running_experience || ''}
                onChange={handleEditFormChange('running_experience')}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Goals / 跑步目标"
                value={editFormData.goals || ''}
                onChange={handleEditFormChange('goals')}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={handleCloseEditDialog} disabled={saving}>
            Cancel / 取消
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveProfile}
            disabled={saving}
            sx={{
              backgroundColor: '#FFB84D',
              '&:hover': { backgroundColor: '#FFA833' }
            }}
          >
            {saving ? <CircularProgress size={20} /> : 'Save / 保存'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ProfilePage;
