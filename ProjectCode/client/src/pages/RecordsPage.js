import SearchIcon from '@mui/icons-material/Search';
import { Box, Button, Container, FormControl, InputAdornment, InputLabel, MenuItem, Paper, Select, Tab, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tabs, TextField, Typography } from '@mui/material';
import Papa from 'papaparse';
import { useEffect, useState } from 'react';
import ClubEntryRules from '../components/ClubEntryRules';
import Logo from '../components/Logo';
import PageButtons from '../components/PageButtons';

export default function RecordsPage() {
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
      // Construct API URLs with optional year parameter
      const yearParam = year ? `?year=${year}` : '';
      const menUrl = `http://localhost:8000/api/results/men-records${yearParam}`;
      const womenUrl = `http://localhost:8000/api/results/women-records${yearParam}`;

      // Fetch men's records data from API
      const menRecordsResponse = await fetch(menUrl);
      const menRecordsJson = await menRecordsResponse.json();

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
      const womenRecordsResponse = await fetch(womenUrl);
      const womenRecordsJson = await womenRecordsResponse.json();

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

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch all four CSV files for credits
        const files = [
          { name: 'total', path: '/data/total_credits.csv' },
          { name: 'activity', path: '/data/activity_credits.csv' },
          { name: 'registration', path: '/data/registration_credits.csv' },
          { name: 'volunteer', path: '/data/volunteer_credits.csv' }
        ];

        const fetchPromises = files.map(file => 
          fetch(file.path)
            .then(response => response.text())
            .then(csvText => {
              return new Promise((resolve) => {
                Papa.parse(csvText, {
                  header: true,
                  complete: (results) => {
                    const parsedData = results.data
                      .filter(row => row.fullName)
                      .map(row => ({
                        rank: parseInt(row.rank) || 0,
                        fullName: row.fullName,
                        registrationSum: parseFloat(row.registration_sum || 0),
                        checkinSum: parseFloat(row.checkin_sum || 0)
                      }))
                      .sort((a, b) => {
                        const totalA = a.registrationSum + a.checkinSum;
                        const totalB = b.registrationSum + b.checkinSum;
                        if (totalB !== totalA) {
                          return totalB - totalA;
                        }
                        return a.fullName.localeCompare(b.fullName);
                      })
                      .map((row, index) => ({
                        ...row,
                        rank: index + 1
                      }));
                    resolve({ name: file.name, data: parsedData });
                  },
                  error: (error) => {
                    console.error(`Error parsing ${file.name} CSV:`, error);
                    resolve({ name: file.name, data: [] });
                  }
                });
              });
            })
        );

        // Fetch available years
        const yearsResponse = await fetch('http://localhost:8000/api/results/available-years');
        const yearsJson = await yearsResponse.json();
        setAvailableYears(yearsJson.years || []);

        // Fetch records data (initially without year filter)
        await fetchRecordsData();

        const results = await Promise.all(fetchPromises);
        const newData = {};
        results.forEach(result => {
          newData[result.name] = result.data;
        });
        
        setCreditsData(newData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching CSV files:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
    setShowAll(false);
    setSearchQuery('');
  };

  const handleRecordsTabChange = (event, newValue) => {
    setCurrentRecordsTab(newValue);
  };

  const getTableHeaders = () => {
    return ['Rank', 'Name', 'Registration Points', 'Check-in Points', 'Total Points'];
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
      <TableRow key={row.rank} hover>
        <TableCell>{row.rank}</TableCell>
        <TableCell>{row.fullName}</TableCell>
        <TableCell>{row.registrationSum}</TableCell>
        <TableCell>{row.checkinSum}</TableCell>
        <TableCell sx={{ fontWeight: 'bold' }}>
          {(row.registrationSum + row.checkinSum).toFixed(1)}
        </TableCell>
      </TableRow>
    ));
  };

  const renderRecordsTableContent = () => {
    const displayData = getFilteredRecordsData();

    return displayData.map((row) => (
      <TableRow key={row.rank} hover>
        <TableCell>{row.rank}</TableCell>
        <TableCell>{row.fullName}</TableCell>
        <TableCell>{row.time}</TableCell>
        <TableCell>{row.race}</TableCell>
      </TableRow>
    ));
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
      {/* Logo Section */}
      <Logo />
      
      {/* Navigation Buttons */}
      <PageButtons />
      
      {/* Records Section */}
      <Container maxWidth="xl" sx={{ px: 2, mt: 4 }}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 600,
            color: '#FFA500',
            mb: 3
          }}
        >
          Club Records
          俱乐部记录
        </Typography>

        {/* Year Filter */}
        <Box sx={{ mb: 3 }}>
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
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            mb: 3,
            '& .MuiTab-root': {
              color: 'text.secondary',
              '&.Mui-selected': {
                color: '#FFA500',
              },
              minWidth: 0,
              flex: 1,
              whiteSpace: 'nowrap',
              fontSize: { xs: '0.75rem', sm: '0.875rem' }
            },
            '& .MuiTabs-indicator': {
              backgroundColor: '#FFA500',
            },
          }}
        >
          {distances.map((distance, index) => (
            <Tab 
              key={index} 
              label={
                <Box sx={{ whiteSpace: 'pre-line', textAlign: 'center' }}>
                  {distance.label}
                </Box>
              } 
            />
          ))}
        </Tabs>

        {/* Records Table */}
        <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
          {/* Men's Records Table */}
          <TableContainer component={Paper} sx={{ flex: 1 }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                color: '#FFA500',
                p: 2,
                borderBottom: '1px solid #FFA500'
              }}
            >
              Men's Records
              男子记录
            </Typography>
            <Table>
              <TableHead>
                <TableRow>
                  {getRecordsTableHeaders().map((header, index) => (
                    <TableCell
                      key={index}
                      sx={{ fontWeight: 'bold', backgroundColor: '#FFA500', color: 'white' }}
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
                p: 2,
                borderBottom: '1px solid #FFA500'
              }}
            >
              Women's Records
              女子记录
            </Typography>
            <Table>
              <TableHead>
                <TableRow>
                  {getRecordsTableHeaders().map((header, index) => (
                    <TableCell
                      key={index}
                      sx={{ fontWeight: 'bold', backgroundColor: '#FFA500', color: 'white' }}
                    >
                      {header}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {getFilteredWomenRecordsData().map((row) => (
                  <TableRow key={row.rank} hover>
                    <TableCell>{row.rank}</TableCell>
                    <TableCell>{row.fullName}</TableCell>
                    <TableCell>{row.time}</TableCell>
                    <TableCell>{row.race}</TableCell>
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
            mb: 3
          }}
        >
          Club Credits
          俱乐部积分榜
        </Typography>

        {/* Credits Tabs */}
        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{
            mb: 3,
            '& .MuiTab-root': {
              color: 'text.secondary',
              '&.Mui-selected': {
                color: '#FFA500',
              },
              minWidth: 0,
              flex: 1,
              whiteSpace: 'nowrap',
              fontSize: { xs: '0.75rem', sm: '0.875rem' }
            },
            '& .MuiTabs-indicator': {
              backgroundColor: '#FFA500',
            },
            maxWidth: '100%',
            width: '100%'
          }}
        >
          <Tab label="Total Credit 总积分" />
          <Tab label="Activity Credit 活动积分" />
          <Tab label="Race Credit 比赛积分" />
          <Tab label="Volunteer Credit 志愿者积分" />
        </Tabs>

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
              <Table>
                <TableHead>
                  <TableRow>
                    {getTableHeaders().map((header, index) => (
                      <TableCell
                        key={index}
                        sx={{ fontWeight: 'bold', backgroundColor: '#FFA500', color: 'white' }}
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
              mb: 3
            }}
          >
            Club Entry Rules
            俱乐部积分规则
          </Typography>
          <ClubEntryRules />
        </Box>
      </Container>
    </Box>
  );
} 