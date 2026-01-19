import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  FormControl,
  FormHelperText,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Step,
  StepLabel,
  Stepper,
  Tab,
  Tabs,
  TextField,
  Typography
} from '@mui/material';
import { useState } from 'react';
import Logo from '../components/Logo';
import NavigationButtons from '../components/NavigationButtons';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import DirectionsRunIcon from '@mui/icons-material/DirectionsRun';
import GroupsIcon from '@mui/icons-material/Groups';
import RouteIcon from '@mui/icons-material/Route';
import TipsAndUpdatesIcon from '@mui/icons-material/TipsAndUpdates';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';

const steps = ['Introduction', 'Race Info', 'Fitness', 'Duration'];

const raceTypes = [
  { value: '5k', label: '5K' },
  { value: '10k', label: '10K' },
  { value: 'half', label: 'Half Marathon' },
  { value: 'full', label: 'Full Marathon' }
];

const trainingDurations = [
  { value: 4, label: '4 Weeks' },
  { value: 8, label: '8 Weeks' },
  { value: 12, label: '12 Weeks' },
  { value: 16, label: '16 Weeks' },
  { value: 20, label: '20 Weeks' },
  { value: 24, label: '24 Weeks' },
  { value: 36, label: '36 Weeks' },
  { value: 48, label: '48 Weeks' }
];

// Community tips data (will be fetched from API in future)
const communityTips = [
  {
    id: 1,
    category: 'recovery',
    title: 'Post-Run Stretching Routine',
    titleCn: '跑后拉伸套路',
    content: 'Spend at least 10 minutes stretching after every run. Focus on hip flexors, hamstrings, quads, and calves.',
    author: 'NewBee Team',
    upvotes: 42
  },
  {
    id: 2,
    category: 'nutrition',
    title: 'Race Day Breakfast',
    titleCn: '比赛日早餐',
    content: 'Eat a familiar breakfast 2-3 hours before your race. Include easily digestible carbs and avoid high fiber foods.',
    author: 'Coach Mike',
    upvotes: 38
  },
  {
    id: 3,
    category: 'technique',
    title: 'Cadence Training',
    titleCn: '步频训练',
    content: 'Aim for 170-180 steps per minute. Use a metronome app during easy runs to gradually increase your cadence.',
    author: 'Jenny L.',
    upvotes: 35
  },
  {
    id: 4,
    category: 'mental',
    title: 'Breaking Down Long Runs',
    titleCn: '分解长跑',
    content: 'Mentally divide long runs into smaller segments. Focus only on reaching the next mile marker, not the full distance.',
    author: 'David W.',
    upvotes: 31
  }
];

// Popular routes data (will be fetched from API in future)
const popularRoutes = [
  {
    id: 1,
    name: 'Central Park Loop',
    nameCn: '中央公园环线',
    distance: '6.1 mi',
    difficulty: 'Easy',
    rating: 4.8,
    description: 'The classic loop around Central Park. Great for all skill levels with smooth paths and scenic views.'
  },
  {
    id: 2,
    name: 'Brooklyn Bridge Run',
    nameCn: '布鲁克林大桥跑',
    distance: '3.2 mi',
    difficulty: 'Moderate',
    rating: 4.6,
    description: 'Cross the iconic Brooklyn Bridge and back. Best done early morning to avoid pedestrian traffic.'
  },
  {
    id: 3,
    name: 'Prospect Park Hills',
    nameCn: '展望公园山路',
    distance: '5.5 mi',
    difficulty: 'Hard',
    rating: 4.7,
    description: 'Challenging hill workout with the famous Harlem Hill. Great for marathon training.'
  }
];

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`training-tabpanel-${index}`}
      aria-labelledby={`training-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const getCategoryColor = (category) => {
  const colors = {
    recovery: '#4CAF50',
    nutrition: '#FF9800',
    technique: '#2196F3',
    mental: '#9C27B0',
    gear: '#795548'
  };
  return colors[category] || '#FFA500';
};

export default function TrainingPage() {
  const [tabValue, setTabValue] = useState(0);
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    raceType: '',
    targetTime: '',
    current5k: '',
    current10k: '',
    currentHalf: '',
    currentFull: '',
    trainingDuration: ''
  });
  const [planGenerated, setPlanGenerated] = useState(false);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleInputChange = (field) => (event) => {
    setFormData({
      ...formData,
      [field]: event.target.value
    });
  };

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const isStepValid = () => {
    switch (activeStep) {
      case 1:
        return formData.raceType && formData.targetTime;
      case 2:
        return formData.current5k || formData.current10k || formData.currentHalf || formData.currentFull;
      case 3:
        return formData.trainingDuration;
      default:
        return true;
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    // TODO: Send data to AI system and generate training plan
    console.log('Form submitted:', formData);
    setPlanGenerated(true);
  };

  const handleReset = () => {
    setActiveStep(0);
    setFormData({
      raceType: '',
      targetTime: '',
      current5k: '',
      current10k: '',
      currentHalf: '',
      currentFull: '',
      trainingDuration: ''
    });
    setPlanGenerated(false);
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box sx={{ maxWidth: 800, mx: 'auto', px: { xs: 1, sm: 2 } }}>
            <Typography variant="h5" sx={{ mb: { xs: 2, sm: 3 }, color: '#333', fontSize: { xs: '1.1rem', sm: '1.5rem' } }}>
              Our Training Philosophy
              <br />
              <span style={{ color: '#666' }}>我们的训练理念</span>
            </Typography>
            <Typography variant="body1" sx={{ mb: { xs: 2, sm: 3 }, fontSize: { xs: '0.875rem', sm: '1rem' } }}>
              Our AI-powered training system is built on proven methodologies from renowned running coaches and scientific research. We incorporate principles from:
            </Typography>
            <Box component="ul" sx={{ pl: { xs: 2, sm: 4 }, mb: { xs: 2, sm: 3 } }}>
              <Typography component="li" sx={{ mb: { xs: 1, sm: 2 }, fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                <strong>Advanced Marathoning</strong> by Pete Pfitzinger and Scott Douglas
              </Typography>
              <Typography component="li" sx={{ mb: { xs: 1, sm: 2 }, fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                <strong>Daniels' Running Formula</strong> by Jack Daniels
              </Typography>
              <Typography component="li" sx={{ mb: { xs: 1, sm: 2 }, fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                <strong>Hansons Marathon Method</strong> by Luke Humphrey
              </Typography>
              <Typography component="li" sx={{ mb: { xs: 1, sm: 2 }, fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                <strong>80/20 Running</strong> by Matt Fitzgerald
              </Typography>
            </Box>
            <Typography variant="body1" sx={{ mb: { xs: 2, sm: 3 }, fontSize: { xs: '0.875rem', sm: '1rem' } }}>
              Our system analyzes your current fitness level, race goals, and available training time to create a personalized plan that balances:
            </Typography>
            <Box component="ul" sx={{ pl: { xs: 2, sm: 4 }, mb: { xs: 2, sm: 3 } }}>
              <Typography component="li" sx={{ mb: { xs: 1, sm: 2 }, fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                Progressive overload and recovery
              </Typography>
              <Typography component="li" sx={{ mb: { xs: 1, sm: 2 }, fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                Aerobic and anaerobic development
              </Typography>
              <Typography component="li" sx={{ mb: { xs: 1, sm: 2 }, fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                Race-specific workouts
              </Typography>
              <Typography component="li" sx={{ mb: { xs: 1, sm: 2 }, fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                Injury prevention
              </Typography>
            </Box>
          </Box>
        );

      case 1:
        return (
          <Box sx={{ maxWidth: 600, mx: 'auto' }}>
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Race Type / 比赛类型</InputLabel>
              <Select
                value={formData.raceType}
                onChange={handleInputChange('raceType')}
                label="Race Type / 比赛类型"
              >
                {raceTypes.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Target Time / 目标时间"
              value={formData.targetTime}
              onChange={handleInputChange('targetTime')}
              helperText="Format: HH:MM:SS (e.g., 01:45:00 for 1 hour 45 minutes)"
              sx={{ mb: 3 }}
            />
          </Box>
        );

      case 2:
        return (
          <Box sx={{ maxWidth: 600, mx: 'auto' }}>
            <Typography variant="subtitle1" sx={{ mb: 2 }}>
              Please provide your current best times (if available):
              <br />
              <span style={{ color: '#666' }}>请提供您目前的最佳成绩（如有）：</span>
            </Typography>

            <TextField
              fullWidth
              label="5K Time / 5公里时间"
              value={formData.current5k}
              onChange={handleInputChange('current5k')}
              helperText="Format: HH:MM:SS"
              sx={{ mb: 3 }}
            />

            <TextField
              fullWidth
              label="10K Time / 10公里时间"
              value={formData.current10k}
              onChange={handleInputChange('current10k')}
              helperText="Format: HH:MM:SS"
              sx={{ mb: 3 }}
            />

            <TextField
              fullWidth
              label="Half Marathon Time / 半马时间"
              value={formData.currentHalf}
              onChange={handleInputChange('currentHalf')}
              helperText="Format: HH:MM:SS"
              sx={{ mb: 3 }}
            />

            <TextField
              fullWidth
              label="Full Marathon Time / 全马时间"
              value={formData.currentFull}
              onChange={handleInputChange('currentFull')}
              helperText="Format: HH:MM:SS"
              sx={{ mb: 3 }}
            />
          </Box>
        );

      case 3:
        return (
          <Box sx={{ maxWidth: 600, mx: 'auto' }}>
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Training Duration / 训练时长</InputLabel>
              <Select
                value={formData.trainingDuration}
                onChange={handleInputChange('trainingDuration')}
                label="Training Duration / 训练时长"
              >
                {trainingDurations.map((duration) => (
                  <MenuItem key={duration.value} value={duration.value}>
                    {duration.label}
                  </MenuItem>
                ))}
              </Select>
              <FormHelperText>
                Select how long you want to train for your goal race
                <br />
                选择您想要为目标比赛训练的时间长度
              </FormHelperText>
            </FormControl>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 0.25, sm: 0.5 } }}>
      {/* Logo Section */}
      <Logo />

      {/* Navigation Buttons */}
      <NavigationButtons />

      {/* Training Section */}
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
          Training with Us
          <br />
          和我们一起训练
        </Typography>

        {/* Feature Cards */}
        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid item xs={6} md={3}>
            <Card sx={{
              height: '100%',
              textAlign: 'center',
              border: '2px solid #FFA500',
              transition: 'transform 0.2s',
              '&:hover': { transform: 'translateY(-4px)' }
            }}>
              <CardContent>
                <SmartToyIcon sx={{ fontSize: 40, color: '#FFA500', mb: 1 }} />
                <Typography variant="subtitle1" fontWeight={600}>AI Coach</Typography>
                <Typography variant="body2" color="text.secondary">智能教练</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} md={3}>
            <Card sx={{
              height: '100%',
              textAlign: 'center',
              border: '2px solid #FFA500',
              transition: 'transform 0.2s',
              '&:hover': { transform: 'translateY(-4px)' }
            }}>
              <CardContent>
                <CalendarMonthIcon sx={{ fontSize: 40, color: '#FFA500', mb: 1 }} />
                <Typography variant="subtitle1" fontWeight={600}>Custom Plans</Typography>
                <Typography variant="body2" color="text.secondary">定制计划</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} md={3}>
            <Card sx={{
              height: '100%',
              textAlign: 'center',
              border: '2px solid #FFA500',
              transition: 'transform 0.2s',
              '&:hover': { transform: 'translateY(-4px)' }
            }}>
              <CardContent>
                <GroupsIcon sx={{ fontSize: 40, color: '#FFA500', mb: 1 }} />
                <Typography variant="subtitle1" fontWeight={600}>Community</Typography>
                <Typography variant="body2" color="text.secondary">社区智慧</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} md={3}>
            <Card sx={{
              height: '100%',
              textAlign: 'center',
              border: '2px solid #FFA500',
              transition: 'transform 0.2s',
              '&:hover': { transform: 'translateY(-4px)' }
            }}>
              <CardContent>
                <RouteIcon sx={{ fontSize: 40, color: '#FFA500', mb: 1 }} />
                <Typography variant="subtitle1" fontWeight={600}>NYC Routes</Typography>
                <Typography variant="body2" color="text.secondary">纽约跑步路线</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

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
            <Tab icon={<FitnessCenterIcon />} label="Training Plan" iconPosition="start" />
            <Tab icon={<TipsAndUpdatesIcon />} label="Community Tips" iconPosition="start" />
            <Tab icon={<RouteIcon />} label="Routes" iconPosition="start" />
          </Tabs>
        </Paper>

        {/* Tab 0: Training Plan Generator */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{
            backgroundColor: 'white',
            borderRadius: { xs: '8px', sm: '12px' },
            p: { xs: 2, sm: 3, md: 6 },
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
          }}>
            {!planGenerated ? (
              <>
                <Box sx={{ width: '100%', overflowX: 'auto', mb: { xs: 3, sm: 4 } }}>
                  <Stepper
                    activeStep={activeStep}
                    alternativeLabel
                    sx={{
                      minWidth: { xs: 300, sm: 'auto' },
                      '& .MuiStepLabel-label': {
                        fontSize: { xs: '0.6rem', sm: '0.875rem' },
                        mt: { xs: 0.5, sm: 1 }
                      },
                      '& .MuiStepIcon-root': {
                        fontSize: { xs: '1.1rem', sm: '1.5rem' }
                      },
                      '& .MuiStepIcon-root.Mui-active': {
                        color: '#FFA500'
                      },
                      '& .MuiStepIcon-root.Mui-completed': {
                        color: '#FFA500'
                      },
                      '& .MuiStepConnector-line': {
                        minWidth: { xs: 20, sm: 40 }
                      }
                    }}
                  >
                    {steps.map((label) => (
                      <Step key={label}>
                        <StepLabel>{label}</StepLabel>
                      </Step>
                    ))}
                  </Stepper>
                </Box>

                {renderStepContent(activeStep)}

                <Box sx={{ display: 'flex', justifyContent: 'center', gap: { xs: 1, sm: 2 }, mt: { xs: 3, sm: 4 } }}>
                  {activeStep > 0 && (
                    <Button
                      variant="outlined"
                      onClick={handleBack}
                      sx={{
                        color: '#FFA500',
                        borderColor: '#FFA500',
                        '&:hover': {
                          borderColor: '#FFA500',
                          backgroundColor: 'rgba(255, 165, 0, 0.1)',
                        },
                        px: { xs: 2, sm: 4 },
                        py: { xs: 1, sm: 1.5 },
                        fontSize: { xs: '0.875rem', sm: '1.1rem' }
                      }}
                    >
                      Back / 返回
                    </Button>
                  )}
                  {activeStep < steps.length - 1 ? (
                    <Button
                      variant="contained"
                      onClick={handleNext}
                      disabled={!isStepValid()}
                      sx={{
                        backgroundColor: '#FFA500',
                        '&:hover': {
                          backgroundColor: '#FF8C00',
                        },
                        '&.Mui-disabled': {
                          backgroundColor: 'rgba(255, 165, 0, 0.5)',
                          color: 'white'
                        },
                        px: { xs: 2, sm: 4 },
                        py: { xs: 1, sm: 1.5 },
                        fontSize: { xs: '0.875rem', sm: '1.1rem' }
                      }}
                    >
                      Next / 下一步
                    </Button>
                  ) : (
                    <Button
                      variant="contained"
                      onClick={handleSubmit}
                      disabled={!isStepValid()}
                      sx={{
                        backgroundColor: '#FFA500',
                        '&:hover': {
                          backgroundColor: '#FF8C00',
                        },
                        '&.Mui-disabled': {
                          backgroundColor: 'rgba(255, 165, 0, 0.5)',
                          color: 'white'
                        },
                        px: { xs: 2, sm: 4 },
                        py: { xs: 1, sm: 1.5 },
                        fontSize: { xs: '0.875rem', sm: '1.1rem' }
                      }}
                    >
                      Generate Plan / 生成计划
                    </Button>
                  )}
                </Box>
              </>
            ) : (
              <Box sx={{ textAlign: 'center' }}>
                <Alert severity="info" sx={{ mb: 3, maxWidth: 600, mx: 'auto' }}>
                  <Typography variant="h6" gutterBottom>
                    AI Training Plan Generator - Coming Soon!
                  </Typography>
                  <Typography variant="body2">
                    We're building an intelligent training system powered by AI. Your personalized training plan based on:
                  </Typography>
                  <Box sx={{ mt: 2, textAlign: 'left' }}>
                    <Typography variant="body2">
                      <strong>Race:</strong> {raceTypes.find(r => r.value === formData.raceType)?.label}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Target Time:</strong> {formData.targetTime}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Duration:</strong> {trainingDurations.find(d => d.value === parseInt(formData.trainingDuration))?.label}
                    </Typography>
                  </Box>
                </Alert>

                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                  AI智能训练计划生成器即将上线！我们正在构建一个由人工智能驱动的智能训练系统。
                </Typography>

                <Button
                  variant="outlined"
                  onClick={handleReset}
                  sx={{
                    color: '#FFA500',
                    borderColor: '#FFA500',
                    '&:hover': {
                      borderColor: '#FFA500',
                      backgroundColor: 'rgba(255, 165, 0, 0.1)',
                    },
                  }}
                >
                  Start Over / 重新开始
                </Button>
              </Box>
            )}
          </Box>
        </TabPanel>

        {/* Tab 1: Community Tips */}
        <TabPanel value={tabValue} index={1}>
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
            Community Training Tips / 社区训练技巧
          </Typography>

          <Alert severity="info" sx={{ mb: 3 }}>
            Tips from NewBee members! In the future, you'll be able to submit your own tips and upvote helpful advice.
            <br />
            来自新蜂成员的技巧！未来您将可以提交自己的技巧并为有用的建议点赞。
          </Alert>

          <Grid container spacing={3}>
            {communityTips.map((tip) => (
              <Grid item xs={12} md={6} key={tip.id}>
                <Card sx={{
                  height: '100%',
                  transition: 'transform 0.2s',
                  '&:hover': { transform: 'translateY(-2px)', boxShadow: 3 }
                }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box>
                        <Chip
                          label={tip.category}
                          size="small"
                          sx={{
                            backgroundColor: getCategoryColor(tip.category),
                            color: 'white',
                            mb: 1
                          }}
                        />
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {tip.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {tip.titleCn}
                        </Typography>
                      </Box>
                      <Chip
                        icon={<TipsAndUpdatesIcon sx={{ fontSize: 16 }} />}
                        label={`${tip.upvotes}`}
                        variant="outlined"
                        size="small"
                      />
                    </Box>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                      {tip.content}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Shared by {tip.author}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        {/* Tab 2: Routes */}
        <TabPanel value={tabValue} index={2}>
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
            Popular NYC Running Routes / 热门纽约跑步路线
          </Typography>

          <Alert severity="info" sx={{ mb: 3 }}>
            Discover the best running routes in New York City, contributed by NewBee members.
            <br />
            发现纽约市最佳跑步路线，由新蜂成员贡献。
          </Alert>

          <Grid container spacing={3}>
            {popularRoutes.map((route) => (
              <Grid item xs={12} md={4} key={route.id}>
                <Card sx={{
                  height: '100%',
                  transition: 'transform 0.2s',
                  '&:hover': { transform: 'translateY(-2px)', boxShadow: 3 }
                }}>
                  <Box sx={{
                    height: 150,
                    backgroundColor: 'rgba(255, 165, 0, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <RouteIcon sx={{ fontSize: 60, color: '#FFA500' }} />
                  </Box>
                  <CardContent>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {route.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {route.nameCn}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                      <Chip label={route.distance} size="small" variant="outlined" />
                      <Chip
                        label={route.difficulty}
                        size="small"
                        sx={{
                          backgroundColor: route.difficulty === 'Easy' ? '#4CAF50' :
                            route.difficulty === 'Moderate' ? '#FF9800' : '#F44336',
                          color: 'white'
                        }}
                      />
                      <Chip label={`${route.rating} stars`} size="small" variant="outlined" />
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {route.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>
      </Container>
    </Box>
  );
}
