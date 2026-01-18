import {
    Alert,
    Box,
    Button,
    CircularProgress,
    Container,
    Grid,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import NavigationButtons from '../components/NavigationButtons';
import { useAuth } from '../context/AuthContext';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export default function StatsPage() {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [memberData, setMemberData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchMemberData = async () => {
            if (!currentUser) {
                setLoading(false);
                return;
            }

            try {
                const response = await fetch(
                    `${API_BASE_URL}/api/members/firebase/${currentUser.uid}`
                );

                if (!response.ok) {
                    if (response.status === 404) {
                        setError('Member profile not found. Please complete your registration.');
                    } else {
                        throw new Error('Failed to fetch member data');
                    }
                    setLoading(false);
                    return;
                }

                const data = await response.json();
                setMemberData(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchMemberData();
    }, [currentUser]);

    // Calculate total credits
    const totalCredits = memberData
        ? Number(memberData.registration_credits || 0) +
          Number(memberData.checkin_credits || 0) +
          Number(memberData.volunteer_credits || 0) +
          Number(memberData.activity_credits || 0)
        : 0;

    // Not logged in
    if (!currentUser) {
        return (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                <Logo />
                <NavigationButtons />
                <Container maxWidth="xl" sx={{ px: 2, mt: 4 }}>
                    <Alert severity="info" sx={{ mb: 2 }}>
                        Please log in to view your dashboard.
                        请登录以查看您的仪表板。
                    </Alert>
                    <Button
                        variant="contained"
                        onClick={() => navigate('/login')}
                        sx={{ backgroundColor: '#FFA500' }}
                    >
                        Log In / 登录
                    </Button>
                </Container>
            </Box>
        );
    }

    // Loading state
    if (loading) {
        return (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                <Logo />
                <NavigationButtons />
                <Container maxWidth="xl" sx={{ px: 2, mt: 4, textAlign: 'center' }}>
                    <CircularProgress sx={{ color: '#FFA500' }} />
                    <Typography sx={{ mt: 2 }}>Loading your dashboard... 加载中...</Typography>
                </Container>
            </Box>
        );
    }

    // Error state
    if (error) {
        return (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                <Logo />
                <NavigationButtons />
                <Container maxWidth="xl" sx={{ px: 2, mt: 4 }}>
                    <Alert severity="warning" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                    <Button
                        variant="contained"
                        onClick={() => navigate('/join')}
                        sx={{ backgroundColor: '#FFA500' }}
                    >
                        Complete Registration / 完成注册
                    </Button>
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
                    Member Dashboard
                    会员仪表板
                </Typography>

                {/* Member Info Card */}
                <Paper sx={{ p: 3, mb: 4, backgroundColor: 'rgba(255, 165, 0, 0.05)' }}>
                    <Typography variant="h5" gutterBottom>
                        Welcome, {memberData.display_name || memberData.username}!
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        欢迎回来，{memberData.display_name_cn || memberData.display_name || memberData.username}！
                    </Typography>
                    {memberData.status && (
                        <Typography variant="body2" sx={{ mt: 1, color: '#FFA500' }}>
                            Status: {memberData.status.charAt(0).toUpperCase() + memberData.status.slice(1)}
                            {memberData.committee_position && ` - ${memberData.committee_position}`}
                        </Typography>
                    )}
                </Paper>

                {/* Credits Overview */}
                <Grid container spacing={3} sx={{ mb: 4 }}>
                    <Grid item xs={12} sm={6} md={2.4}>
                        <Paper sx={{ p: 3, textAlign: 'center', backgroundColor: 'rgba(255, 165, 0, 0.05)' }}>
                            <Typography variant="h6" color="text.secondary">
                                Total Credits
                            </Typography>
                            <Typography variant="h4" sx={{ color: '#FFA500', fontWeight: 'bold' }}>
                                {totalCredits.toFixed(0)}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                总积分
                            </Typography>
                        </Paper>
                    </Grid>
                    <Grid item xs={12} sm={6} md={2.4}>
                        <Paper sx={{ p: 3, textAlign: 'center', backgroundColor: 'rgba(255, 165, 0, 0.05)' }}>
                            <Typography variant="h6" color="text.secondary">
                                Registration
                            </Typography>
                            <Typography variant="h4" sx={{ color: '#FFA500', fontWeight: 'bold' }}>
                                {Number(memberData.registration_credits || 0).toFixed(0)}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                报名积分
                            </Typography>
                        </Paper>
                    </Grid>
                    <Grid item xs={12} sm={6} md={2.4}>
                        <Paper sx={{ p: 3, textAlign: 'center', backgroundColor: 'rgba(255, 165, 0, 0.05)' }}>
                            <Typography variant="h6" color="text.secondary">
                                Check-in
                            </Typography>
                            <Typography variant="h4" sx={{ color: '#FFA500', fontWeight: 'bold' }}>
                                {Number(memberData.checkin_credits || 0).toFixed(0)}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                签到积分
                            </Typography>
                        </Paper>
                    </Grid>
                    <Grid item xs={12} sm={6} md={2.4}>
                        <Paper sx={{ p: 3, textAlign: 'center', backgroundColor: 'rgba(255, 165, 0, 0.05)' }}>
                            <Typography variant="h6" color="text.secondary">
                                Volunteer
                            </Typography>
                            <Typography variant="h4" sx={{ color: '#FFA500', fontWeight: 'bold' }}>
                                {Number(memberData.volunteer_credits || 0).toFixed(0)}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                志愿者积分
                            </Typography>
                        </Paper>
                    </Grid>
                    <Grid item xs={12} sm={6} md={2.4}>
                        <Paper sx={{ p: 3, textAlign: 'center', backgroundColor: 'rgba(255, 165, 0, 0.05)' }}>
                            <Typography variant="h6" color="text.secondary">
                                Activity
                            </Typography>
                            <Typography variant="h4" sx={{ color: '#FFA500', fontWeight: 'bold' }}>
                                {Number(memberData.activity_credits || 0).toFixed(0)}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                活动积分
                            </Typography>
                        </Paper>
                    </Grid>
                </Grid>

                {/* Member Profile Info */}
                <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>
                        Profile Information
                        个人信息
                    </Typography>
                    <TableContainer>
                        <Table>
                            <TableBody>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 'bold', width: '30%' }}>Email 邮箱</TableCell>
                                    <TableCell>{memberData.email}</TableCell>
                                </TableRow>
                                {memberData.phone && (
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Phone 电话</TableCell>
                                        <TableCell>{memberData.phone}</TableCell>
                                    </TableRow>
                                )}
                                {memberData.nyrr_member_id && (
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 'bold' }}>NYRR ID</TableCell>
                                        <TableCell>{memberData.nyrr_member_id}</TableCell>
                                    </TableRow>
                                )}
                                {memberData.join_date && (
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Member Since 加入日期</TableCell>
                                        <TableCell>{new Date(memberData.join_date).toLocaleDateString()}</TableCell>
                                    </TableRow>
                                )}
                                {memberData.emergency_contact_name && (
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Emergency Contact 紧急联系人</TableCell>
                                        <TableCell>
                                            {memberData.emergency_contact_name}
                                            {memberData.emergency_contact_phone && ` (${memberData.emergency_contact_phone})`}
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    <Button
                        variant="outlined"
                        onClick={() => navigate('/profile')}
                        sx={{ mt: 2, borderColor: '#FFA500', color: '#FFA500' }}
                    >
                        Edit Profile / 编辑资料
                    </Button>
                </Paper>
            </Container>
        </Box>
    );
} 