import SearchIcon from '@mui/icons-material/Search';
import InfoIcon from '@mui/icons-material/Info';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { Alert, Box, Button, Container, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, IconButton, InputAdornment, InputLabel, MenuItem, Paper, Select, Tab, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tabs, TextField, Typography, useMediaQuery, useTheme } from '@mui/material';
import { useEffect, useState } from 'react';
import { getAvailableYears, getMenRecords, getWomenRecords } from '../api/records';
import { getCredits, createCredit, updateCredit, deleteCredit } from '../api/credits';
import ClubEntryRules from '../components/ClubEntryRules';
import Logo from '../components/Logo';
import NavigationButtons from '../components/NavigationButtons';
import { useAdmin, useAuth } from '../context';

export default function RecordsPage() {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const { adminModeEnabled } = useAdmin();
  const { currentUser } = useAuth();
  const [creditsData, setCreditsData] = useState({
    total: [],
    activity: [],
    registration: [],
    volunteer: []
  });
  const [recordsData, setRecordsData] = useState([]);
  const [womenRecordsData, setWomenRecordsData] = useState([]);
  const [availableYears, setAvailableYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState(0);
  const [currentRecordsTab, setCurrentRecordsTab] = useState(0);
  const [showAll, setShowAll] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Admin modal state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState('create'); // 'create' or 'edit'
  const [editingCredit, setEditingCredit] = useState(null);
  const [formData, setFormData] = useState({
    full_name: '',
    credit_type: 'total',
    registration_credits: 0,
    checkin_credits: 0
  });
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [creditToDelete, setCreditToDelete] = useState(null);

  const distances = [
    { label: "1 Mile\n一英里", value: "1M" },
    { label: "5K\n五公里", value: "5K" },
    { label: "4M\n四英里", value: "4M" },
    { label: "5M\n五英里", value: "5M" },
    { label: "10K\n十公里", value: "10K" },
    { label: "10M\n十英里", value: "10M" },
    { label: "12M\n十二英里", value: "12M" },
    { label: "Half Marathon\n半程马拉松", value: "Half Marathon" },
    { label: "Marathon\n全程马拉松", value: "Marathon" }
  ];

  const fetchRecordsData = async (year = null) => {
    try {
      // Fetch men's records data from API
      const menRecordsJson = await getMenRecords(year);

      // Transform API data to match component structure
      const transformedMenRecords = menRecordsJson.men_records?.map((record) => ({
        rank: record.rank,
        fullName: record.runner_name,
        time: record.time,
        race: record.race_name,
        distance: record.distance,
        ageGroup: record.age_group,
        pace: record.pace,
        raceDate: record.race_date
      })) || [];

      setRecordsData(transformedMenRecords);

      // Fetch women's records data from API
      const womenRecordsJson = await getWomenRecords(year);

      // Transform API data to match component structure
      const transformedWomenRecords = womenRecordsJson.women_records?.map((record) => ({
        rank: record.rank,
        fullName: record.runner_name,
        time: record.time,
        race: record.race_name,
        distance: record.distance,
        ageGroup: record.age_group,
        pace: record.pace,
        raceDate: record.race_date
      })) || [];

      setWomenRecordsData(transformedWomenRecords);
    } catch (error) {
      console.error('Error fetching records data:', error);
      setRecordsData([]);
      setWomenRecordsData([]);
    }
  };

  const handleYearChange = async (year) => {
    setSelectedYear(year);
    await fetchRecordsData(year || null);
  };

  // Credit type mapping for tabs
  const creditTypes = ['total', 'activity', 'registration', 'volunteer'];

  const fetchCreditsData = async () => {
    try {
      const creditTypeNames = ['total', 'activity', 'registration', 'volunteer'];
      const newData = {};

      for (const creditType of creditTypeNames) {
        const credits = await getCredits(creditType);
        // Transform API response to component format
        const transformedData = credits
          .map((credit, index) => ({
            id: credit.id,
            rank: index + 1,
            fullName: credit.full_name,
            registrationSum: parseFloat(credit.registration_credits || 0),
            checkinSum: parseFloat(credit.checkin_credits || 0)
          }));
        newData[creditType] = transformedData;
      }

      setCreditsData(newData);
    } catch (error) {
      console.error('Error fetching credits from API:', error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch available years
        const yearsJson = await getAvailableYears();
        setAvailableYears(yearsJson.years || []);

        // Fetch records data (initially without year filter)
        await fetchRecordsData();

        // Fetch credits data from API
        await fetchCreditsData();

        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Admin CRUD handlers
  const handleOpenDialog = (mode, credit = null) => {
    setDialogMode(mode);
    if (mode === 'edit' && credit) {
      setEditingCredit(credit);
      setFormData({
        full_name: credit.fullName,
        credit_type: creditTypes[currentTab],
        registration_credits: credit.registrationSum,
        checkin_credits: credit.checkinSum
      });
    } else {
      setEditingCredit(null);
      setFormData({
        full_name: '',
        credit_type: creditTypes[currentTab],
        registration_credits: 0,
        checkin_credits: 0
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingCredit(null);
    setFormData({
      full_name: '',
      credit_type: 'total',
      registration_credits: 0,
      checkin_credits: 0
    });
  };

  const handleFormChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    try {
      if (dialogMode === 'create') {
        await createCredit(formData, currentUser?.uid);
      } else {
        await updateCredit(editingCredit.id, formData, currentUser?.uid);
      }
      handleCloseDialog();
      await fetchCreditsData();
    } catch (error) {
      console.error('Error saving credit:', error);
      alert(`Error: ${error.message || 'Failed to save credit'}`);
    }
  };

  const handleDeleteClick = (credit) => {
    setCreditToDelete(credit);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteCredit(creditToDelete.id, currentUser?.uid);
      setDeleteConfirmOpen(false);
      setCreditToDelete(null);
      await fetchCreditsData();
    } catch (error) {
      console.error('Error deleting credit:', error);
      alert(`Error: ${error.message || 'Failed to delete credit'}`);
    }
  };

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
    setShowAll(false);
    setSearchQuery('');
  };

  const handleRecordsTabChange = (event, newValue) => {
    setCurrentRecordsTab(newValue);
  };

  const getTableHeaders = () => {
    const headers = ['Rank', 'Name', 'Registration Points', 'Check-in', 'Total Points'];
    if (adminModeEnabled) {
      headers.push('Actions');
    }
    return headers;
  };

  const getRecordsTableHeaders = () => {
    return ['Rank', 'Name', 'Time', 'Race'];
  };

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  const getFilteredData = () => {
    const data = creditsData[Object.keys(creditsData)[currentTab]] || [];
    if (!searchQuery) {
      return showAll ? data : data.slice(0, 10);
    }
    const filtered = data.filter(row => 
      row.fullName && row.fullName.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return showAll ? filtered : filtered.slice(0, 10);
  };

  const getFilteredRecordsData = () => {
    const currentDistance = distances[currentRecordsTab].value;
    return recordsData
      .filter(row => row.distance === currentDistance)
      .sort((a, b) => a.rank - b.rank);
  };

  const getFilteredWomenRecordsData = () => {
    const currentDistance = distances[currentRecordsTab].value;
    return womenRecordsData
      .filter(row => row.distance === currentDistance)
      .sort((a, b) => a.rank - b.rank);
  };

  const renderTableContent = () => {
    const displayData = getFilteredData();

    return displayData.map((row) => (
      <TableRow key={row.id || row.rank} hover>
        <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, px: { xs: 1, sm: 2 } }}>{row.rank}</TableCell>
        <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, px: { xs: 1, sm: 2 } }}>{row.fullName}</TableCell>
        <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, px: { xs: 1, sm: 2 } }}>{row.registrationSum}</TableCell>
        <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, px: { xs: 1, sm: 2 } }}>{row.checkinSum}</TableCell>
        <TableCell sx={{ fontWeight: 'bold', fontSize: { xs: '0.75rem', sm: '0.875rem' }, px: { xs: 1, sm: 2 } }}>
          {(row.registrationSum + row.checkinSum).toFixed(1)}
        </TableCell>
        {adminModeEnabled && (
          <TableCell sx={{ px: { xs: 0.5, sm: 1 } }}>
            <IconButton
              size="small"
              onClick={() => handleOpenDialog('edit', row)}
              sx={{ color: '#FFA500' }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => handleDeleteClick(row)}
              sx={{ color: '#ff4444' }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </TableCell>
        )}
      </TableRow>
    ));
  };

  const renderRecordsTableContent = () => {
    const displayData = getFilteredRecordsData();

    return displayData.map((row) => (
      <TableRow key={row.rank} hover>
        <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, px: { xs: 1, sm: 2 } }}>{row.rank}</TableCell>
        <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, px: { xs: 1, sm: 2 } }}>{row.fullName}</TableCell>
        <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, px: { xs: 1, sm: 2 } }}>{row.time}</TableCell>
        <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, px: { xs: 1, sm: 2 } }}>{row.race}</TableCell>
      </TableRow>
    ));
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 0.25, sm: 0.5 } }}>
      {/* Logo Section */}
      <Logo />
      
      {/* Navigation Buttons */}
      <NavigationButtons />

      {/* Admin Mode Info */}
      {adminModeEnabled && (
        <Container maxWidth="xl" sx={{ px: 2, mt: 2 }}>
          <Alert severity="info" icon={<InfoIcon />} sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>Admin Information:</strong> Club credits are stored in the database. Use the edit/delete buttons to modify entries, or "Add Credit" to create new ones. Race records are automatically imported from NYRR via the <code>fetch_historical_data.py</code> script.
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              <strong>管理员信息：</strong> 俱乐部积分存储在数据库中。使用编辑/删除按钮修改条目，或点击"添加积分"创建新条目。比赛记录通过 <code>fetch_historical_data.py</code> 脚本从NYRR自动导入。
            </Typography>
          </Alert>
        </Container>
      )}

      {/* Records Section */}
      <Container maxWidth="xl" sx={{ px: { xs: 1, sm: 2 }, mt: { xs: 2, sm: 4 } }}>
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
          Club Records
          <br />
          俱乐部记录
        </Typography>

        {/* Year Filter */}
        <Box sx={{
          display: 'flex',
          justifyContent: 'center',
          mb: 3
        }}>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel
              sx={{
                color: '#FFA500',
                '&.Mui-focused': { color: '#FFA500' }
              }}
            >
              Select Year 选择年份
            </InputLabel>
            <Select
              value={selectedYear}
              onChange={(e) => handleYearChange(e.target.value)}
              label="Select Year 选择年份"
              sx={{
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#FFA500',
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#FFA500',
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#FFA500',
                },
              }}
            >
              <MenuItem value="">
                All Years 所有年份
              </MenuItem>
              {availableYears.map((year) => (
                <MenuItem key={year} value={year}>
                  {year}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {/* Records Tabs */}
        <Tabs
          value={currentRecordsTab}
          onChange={handleRecordsTabChange}
          variant={isDesktop ? "fullWidth" : "scrollable"}
          scrollButtons={isDesktop ? false : "auto"}
          allowScrollButtonsMobile={!isDesktop}
          sx={{
            mb: 3,
            '& .MuiTab-root': {
              color: 'text.secondary',
              '&.Mui-selected': {
                color: '#FFA500',
              },
              minWidth: isDesktop ? 'auto' : { xs: 60, sm: 80 },
              px: { xs: 1, sm: 2 },
              py: { xs: 1, sm: 1.5 },
              fontSize: { xs: '0.65rem', sm: '0.875rem' }
            },
            '& .MuiTabs-indicator': {
              backgroundColor: '#FFA500',
            },
            '& .MuiTabs-scrollButtons': {
              '&.Mui-disabled': { opacity: 0.3 },
            },
          }}
        >
          {distances.map((distance, index) => (
            <Tab
              key={index}
              label={
                <Box sx={{
                  whiteSpace: 'pre-line',
                  textAlign: 'center',
                  lineHeight: 1.2,
                  fontSize: { xs: '0.6rem', sm: '0.875rem' }
                }}>
                  {distance.label}
                </Box>
              }
            />
          ))}
        </Tabs>

        {/* Records Table */}
        <Box sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          gap: 2,
          mb: 4
        }}>
          {/* Men's Records Table */}
          <TableContainer component={Paper} sx={{ flex: 1 }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                color: '#FFA500',
                p: { xs: 1.5, sm: 2 },
                borderBottom: '1px solid #FFA500',
                fontSize: { xs: '1rem', sm: '1.25rem' }
              }}
            >
              Men's Records
              男子记录
            </Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  {getRecordsTableHeaders().map((header, index) => (
                    <TableCell
                      key={index}
                      sx={{
                        fontWeight: 'bold',
                        backgroundColor: '#FFA500',
                        color: 'white',
                        fontSize: { xs: '0.75rem', sm: '0.875rem' },
                        px: { xs: 1, sm: 2 },
                        py: { xs: 0.75, sm: 1 }
                      }}
                    >
                      {header}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {renderRecordsTableContent()}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Women's Records Table */}
          <TableContainer component={Paper} sx={{ flex: 1 }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                color: '#FFA500',
                p: { xs: 1.5, sm: 2 },
                borderBottom: '1px solid #FFA500',
                fontSize: { xs: '1rem', sm: '1.25rem' }
              }}
            >
              Women's Records
              女子记录
            </Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  {getRecordsTableHeaders().map((header, index) => (
                    <TableCell
                      key={index}
                      sx={{
                        fontWeight: 'bold',
                        backgroundColor: '#FFA500',
                        color: 'white',
                        fontSize: { xs: '0.75rem', sm: '0.875rem' },
                        px: { xs: 1, sm: 2 },
                        py: { xs: 0.75, sm: 1 }
                      }}
                    >
                      {header}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {getFilteredWomenRecordsData().map((row) => (
                  <TableRow key={row.rank} hover>
                    <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, px: { xs: 1, sm: 2 } }}>{row.rank}</TableCell>
                    <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, px: { xs: 1, sm: 2 } }}>{row.fullName}</TableCell>
                    <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, px: { xs: 1, sm: 2 } }}>{row.time}</TableCell>
                    <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, px: { xs: 1, sm: 2 } }}>{row.race}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

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
          Club Credits
          <br />
          俱乐部积分榜
        </Typography>

        {/* Credits Tabs */}
        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          sx={{
            mb: 3,
            '& .MuiTab-root': {
              color: 'text.secondary',
              '&.Mui-selected': {
                color: '#FFA500',
              },
              minWidth: { xs: 'auto', sm: 120 },
              px: { xs: 1.5, sm: 2 },
              fontSize: { xs: '0.7rem', sm: '0.875rem' }
            },
            '& .MuiTabs-indicator': {
              backgroundColor: '#FFA500',
            },
            '& .MuiTabs-scrollButtons': {
              '&.Mui-disabled': { opacity: 0.3 },
            },
          }}
        >
          <Tab label={<Box sx={{ textAlign: 'center' }}>Total Credit<br/>总积分</Box>} />
          <Tab label={<Box sx={{ textAlign: 'center' }}>Activity Credit<br/>活动积分</Box>} />
          <Tab label={<Box sx={{ textAlign: 'center' }}>Race Credit<br/>比赛积分</Box>} />
          <Tab label={<Box sx={{ textAlign: 'center' }}>Volunteer Credit<br/>志愿者积分</Box>} />
        </Tabs>

        {/* Admin Add Credit Button */}
        {adminModeEnabled && (
          <Box sx={{ mb: 2 }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog('create')}
              sx={{
                backgroundColor: '#FFA500',
                '&:hover': {
                  backgroundColor: '#e69500',
                },
              }}
            >
              Add Credit 添加积分
            </Button>
          </Box>
        )}

        {loading ? (
          <Typography variant="body1" color="text.secondary">
            Loading data...
          </Typography>
        ) : creditsData[Object.keys(creditsData)[currentTab]]?.length > 0 ? (
          <>
            {/* Search Bar */}
            <Box sx={{ mb: 3 }}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Search by runner's name 搜索跑者姓名"
                value={searchQuery}
                onChange={handleSearchChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: '#FFA500' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: '#FFA500',
                    },
                    '&:hover fieldset': {
                      borderColor: '#FFA500',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#FFA500',
                    },
                  },
                }}
              />
            </Box>

            <TableContainer component={Paper} sx={{ mb: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    {getTableHeaders().map((header, index) => (
                      <TableCell
                        key={index}
                        sx={{
                          fontWeight: 'bold',
                          backgroundColor: '#FFA500',
                          color: 'white',
                          fontSize: { xs: '0.75rem', sm: '0.875rem' },
                          px: { xs: 1, sm: 2 },
                          py: { xs: 0.75, sm: 1 }
                        }}
                      >
                        {header}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {renderTableContent()}
                </TableBody>
              </Table>
            </TableContainer>
            
            {creditsData[Object.keys(creditsData)[currentTab]].length > 10 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                <Button
                  variant="outlined"
                  onClick={() => setShowAll(!showAll)}
                  sx={{
                    color: '#FFA500',
                    borderColor: '#FFA500',
                    '&:hover': {
                      borderColor: '#FFA500',
                      backgroundColor: 'rgba(255, 165, 0, 0.1)',
                    },
                  }}
                >
                  {showAll ? 'Show Less 显示较少' : 'Show All 显示全部'}
                </Button>
              </Box>
            )}
          </>
        ) : (
          <Typography variant="body1" color="text.secondary">
            No data available
          </Typography>
        )}

        {/* Club Entry Rules Section */}
        <Box sx={{ mt: 6 }}>
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
            Club Entry Rules
            <br />
            俱乐部积分规则
          </Typography>
          <ClubEntryRules />
        </Box>
      </Container>

      {/* Create/Edit Credit Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {dialogMode === 'create' ? 'Add New Credit 添加新积分' : 'Edit Credit 编辑积分'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Full Name 姓名"
              value={formData.full_name}
              onChange={(e) => handleFormChange('full_name', e.target.value)}
              fullWidth
              required
            />
            <FormControl fullWidth>
              <InputLabel>Credit Type 积分类型</InputLabel>
              <Select
                value={formData.credit_type}
                onChange={(e) => handleFormChange('credit_type', e.target.value)}
                label="Credit Type 积分类型"
              >
                <MenuItem value="total">Total 总积分</MenuItem>
                <MenuItem value="activity">Activity 活动积分</MenuItem>
                <MenuItem value="registration">Registration 比赛积分</MenuItem>
                <MenuItem value="volunteer">Volunteer 志愿者积分</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Registration Points 报名积分"
              type="number"
              value={formData.registration_credits}
              onChange={(e) => handleFormChange('registration_credits', parseFloat(e.target.value) || 0)}
              fullWidth
              inputProps={{ step: 0.5 }}
            />
            <TextField
              label="Check-in Points 签到积分"
              type="number"
              value={formData.checkin_credits}
              onChange={(e) => handleFormChange('checkin_credits', parseFloat(e.target.value) || 0)}
              fullWidth
              inputProps={{ step: 0.5 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel 取消</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            sx={{ backgroundColor: '#FFA500', '&:hover': { backgroundColor: '#e69500' } }}
          >
            {dialogMode === 'create' ? 'Create 创建' : 'Save 保存'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        <DialogTitle>Confirm Delete 确认删除</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the credit entry for "{creditToDelete?.fullName}"?
          </Typography>
          <Typography sx={{ mt: 1 }}>
            确定要删除 "{creditToDelete?.fullName}" 的积分记录吗？
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel 取消</Button>
          <Button
            onClick={handleDeleteConfirm}
            variant="contained"
            color="error"
          >
            Delete 删除
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 