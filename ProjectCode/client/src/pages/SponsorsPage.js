import { Alert, Box, Button, Container, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Tab, Tabs, TextField, Tooltip, Typography } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import InfoIcon from '@mui/icons-material/Info';
import Papa from 'papaparse';
import { useEffect, useState } from 'react';
import DonorGrid from '../components/DonorGrid';
import Logo from '../components/Logo';
import NavigationButtons from '../components/NavigationButtons';
import { useAdmin } from '../context';

export default function SponsorsPage() {
  const { adminModeEnabled } = useAdmin();
  const [individualDonors, setIndividualDonors] = useState([]);
  const [enterpriseDonors, setEnterpriseDonors] = useState([]);
  const [selectedTab, setSelectedTab] = useState(0);
  const [adminInfoOpen, setAdminInfoOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingDonor, setEditingDonor] = useState(null);
  const [donorFormData, setDonorFormData] = useState({ name: '', notes: '' });

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
  };

  useEffect(() => {
    // Fetch donor data
    const fetchData = async () => {
      try {
        console.log('Starting to fetch donor data...');

        const [individualResponse, enterpriseResponse] = await Promise.all([
          fetch('/data/individualDonors.csv'),
          fetch('/data/enterpriseDonors.csv')
        ]);

        console.log('Fetch responses:', {
          individual: individualResponse.status,
          enterprise: enterpriseResponse.status
        });

        if (!individualResponse.ok || !enterpriseResponse.ok) {
          throw new Error(`Failed to fetch donor data: ${individualResponse.status} ${enterpriseResponse.status}`);
        }

        const [individualText, enterpriseText] = await Promise.all([
          individualResponse.text(),
          enterpriseResponse.text()
        ]);

        console.log('CSV text received:', {
          individualLength: individualText.length,
          enterpriseLength: enterpriseText.length
        });

        // Parse CSV data
        const individualParsed = Papa.parse(individualText, {
          header: true,
          skipEmptyLines: true
        });

        const enterpriseParsed = Papa.parse(enterpriseText, {
          header: true,
          skipEmptyLines: true
        });

        console.log('Parsed CSV data:', {
          individualRows: individualParsed.data.length,
          enterpriseRows: enterpriseParsed.data.length
        });

        // Process individual donors
        const individualData = individualParsed.data
          .filter(donor => donor['WECHAT NAME'] && donor.AMOUNT && donor.NOTES !== 'Anonymous Donor') // Filter out empty rows and anonymous donors
          .map((donor, index) => ({
            id: index,
            name: donor['WECHAT NAME'],
            notes: donor.NOTES
          }))
          .sort((a, b) => a.name.localeCompare(b.name)); // Sort alphabetically

        // Process enterprise donors
        const enterpriseData = enterpriseParsed.data
          .filter(donor => donor.name && donor.amount) // Filter out empty rows
          .map((donor, index) => ({
            id: index,
            name: donor.name
          }))
          .sort((a, b) => a.name.localeCompare(b.name)); // Sort alphabetically

        console.log('Processed data:', {
          individualDonors: individualData.length,
          enterpriseDonors: enterpriseData.length,
          sampleIndividual: individualData[0],
          sampleEnterprise: enterpriseData[0]
        });

        setIndividualDonors(individualData);
        setEnterpriseDonors(enterpriseData);
      } catch (error) {
        console.error('Error in fetchData:', error);
      }
    };

    fetchData();
  }, []);

  const handleEditDonor = (donor) => {
    setEditingDonor(donor);
    setDonorFormData({ name: donor.name, notes: donor.notes || '' });
    setEditDialogOpen(true);
  };

  const handleAddDonor = () => {
    setEditingDonor(null);
    setDonorFormData({ name: '', notes: '' });
    setEditDialogOpen(true);
  };

  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
    setEditingDonor(null);
    setDonorFormData({ name: '', notes: '' });
  };

  const handleSaveDonor = () => {
    // For now, show the info dialog about CSV editing
    setEditDialogOpen(false);
    setAdminInfoOpen(true);
  };

  const handleDeleteDonor = (donor) => {
    // For now, show the info dialog about CSV editing
    setAdminInfoOpen(true);
  };

  const individualColumns = [
    { field: 'name', headerName: 'Name', width: 300 }
  ];

  const enterpriseColumns = [
    { field: 'name', headerName: 'Organization', width: 300 }
  ];

  // Custom render for DonorGrid with admin buttons
  const renderDonorWithAdminControls = (donors, columns) => {
    if (!adminModeEnabled) {
      return <DonorGrid data={donors} columns={columns} />;
    }

    return (
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddDonor}
            sx={{
              backgroundColor: '#FFB84D',
              color: 'white',
              textTransform: 'none',
              '&:hover': {
                backgroundColor: '#FFA833',
              }
            }}
          >
            Add Donor / 添加捐助者
          </Button>
        </Box>
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: 2
        }}>
          {donors.map((donor) => (
            <Box
              key={donor.id}
              sx={{
                p: 2,
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: 'white',
                '&:hover': {
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }
              }}
            >
              <Typography variant="body1">{donor.name}</Typography>
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                <Tooltip title="Edit donor / 编辑捐助者">
                  <IconButton
                    size="small"
                    onClick={() => handleEditDonor(donor)}
                    sx={{ color: 'primary.main' }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete donor / 删除捐助者">
                  <IconButton
                    size="small"
                    onClick={() => handleDeleteDonor(donor)}
                    sx={{ color: 'error.main' }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
          ))}
        </Box>
      </Box>
    );
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
      {/* Logo Section */}
      <Logo />

      {/* Navigation Buttons */}
      <NavigationButtons />

      {/* Admin Mode Alert */}
      {adminModeEnabled && (
        <Container maxWidth="xl" sx={{ px: 2, mt: 2 }}>
          <Alert
            severity="info"
            icon={<InfoIcon />}
            action={
              <Button color="inherit" size="small" onClick={() => setAdminInfoOpen(true)}>
                Learn More
              </Button>
            }
          >
            Admin mode enabled. You can edit and delete donors. / 管理员模式已开启，您可以编辑和删除捐助者。
          </Alert>
        </Container>
      )}

      {/* Sponsors Text */}
      <Container maxWidth="xl" sx={{ px: 2, mt: 4 }}>
        <Box>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 600,
              color: '#FFA500',
              mb: 3
            }}
          >
            Our Sponsors/Donors
            我们的捐助者/赞助商
          </Typography>
        </Box>
      </Container>

      {/* Sponsors Content */}
      <Container maxWidth="xl" sx={{ px: 2, mt: 0, mb: 0 }}>
        <Box sx={{
          backgroundColor: 'white',
          borderRadius: '12px',
          p: { xs: 3, md: 6 },
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
        }}>
          <Typography
            variant="body1"
            sx={{
              fontFamily: 'Roboto, sans-serif',
              fontSize: '16px',
              lineHeight: 1.6,
              color: '#333',
              mb: 3,
            }}
          >
            新蜂已正式注册为 501(c)(3) 非营利组织，将以更专业的方式服务跑者。欢迎通过 Zelle：newbeerunningclub@gmail.com 支持跑团运作。所有款项将用于活动物资、义工补给等方面。感谢每一位支持新蜂的你
            以下排名不分先后，不论多少，每一笔捐款我们都非常感谢。谢谢大家的支持！
          </Typography>
          <Typography
            variant="body1"
            sx={{
              fontFamily: 'Roboto, sans-serif',
              fontSize: '16px',
              lineHeight: 1.6,
              color: '#333',
              mb: 3,
            }}
          >
            NewBee has officially registered as a 501(c)(3) non-profit organization, serving runners in a more professional manner. Support our running club via Zelle: newbeerunningclub@gmail.com. All funds will be used for event supplies and volunteer support. Thank you for supporting NewBee
            Below is the list of our sponsors/donors. Thank you for your support!
          </Typography>
        </Box>
      </Container>

      {/* Donors Tabs Section */}
      <Container maxWidth="xl" sx={{ px: 2, mt: 4 }}>
        <Box sx={{
          borderBottom: 1,
          borderColor: 'divider',
          '& .MuiTabs-root': {
            minHeight: 'unset',
          },
          '& .MuiTab-root': {
            minHeight: 'unset',
            padding: '12px 0',
            width: '50%',
            fontSize: '2.125rem', // Same as h4
            fontWeight: 600,
            color: 'rgba(102, 102, 102, 0.25)', // Much more transparent gray
            '&.Mui-selected': {
              color: '#FFA500', // Same as main title
            },
          },
          '& .MuiTabs-indicator': {
            backgroundColor: '#FFA500', // Same as main title
            height: '3px',
          },
        }}>
          <Tabs
            value={selectedTab}
            onChange={handleTabChange}
            variant="fullWidth"
          >
            <Tab
              label={
                <Typography sx={{
                  fontSize: 'inherit',
                  fontWeight: 'inherit',
                  textAlign: 'center',
                  whiteSpace: 'pre-line'
                }}>
                  {`Individual Donors\n个人赞助者`}
                </Typography>
              }
            />
            <Tab
              label={
                <Typography sx={{
                  fontSize: 'inherit',
                  fontWeight: 'inherit',
                  textAlign: 'center',
                  whiteSpace: 'pre-line'
                }}>
                  {`Enterprise Donors\n企业赞助者`}
                </Typography>
              }
            />
          </Tabs>
        </Box>

        {/* Individual Donors Tab Panel */}
        <Box sx={{ display: selectedTab === 0 ? 'block' : 'none', mt: 3 }}>
          {renderDonorWithAdminControls(individualDonors, individualColumns)}
        </Box>

        {/* Enterprise Donors Tab Panel */}
        <Box sx={{ display: selectedTab === 1 ? 'block' : 'none', mt: 3 }}>
          {renderDonorWithAdminControls(enterpriseDonors, enterpriseColumns)}
        </Box>
      </Container>

      {/* Edit Donor Dialog */}
      <Dialog open={editDialogOpen} onClose={handleCloseEditDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingDonor ? 'Edit Donor / 编辑捐助者' : 'Add Donor / 添加捐助者'}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Name / 名称"
            value={donorFormData.name}
            onChange={(e) => setDonorFormData({ ...donorFormData, name: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Notes / 备注"
            value={donorFormData.notes}
            onChange={(e) => setDonorFormData({ ...donorFormData, notes: e.target.value })}
            margin="normal"
            multiline
            rows={2}
          />
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              Changes will be reflected after editing the CSV file.
              <br />
              更改将在编辑CSV文件后生效。
            </Typography>
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditDialog}>Cancel / 取消</Button>
          <Button
            variant="contained"
            onClick={handleSaveDonor}
            sx={{
              backgroundColor: '#FFB84D',
              '&:hover': { backgroundColor: '#FFA833' }
            }}
          >
            Learn How / 了解方法
          </Button>
        </DialogActions>
      </Dialog>

      {/* Admin Info Dialog */}
      <Dialog open={adminInfoOpen} onClose={() => setAdminInfoOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Donor Management / 捐助者管理
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2" gutterBottom>
              <strong>How to manage donors:</strong>
            </Typography>
            <Typography variant="body2" component="div">
              Donors are stored in CSV files. To add, edit, or delete donors:
              <ol style={{ margin: '8px 0', paddingLeft: '20px' }}>
                <li>For individual donors: Edit <code>public/data/individualDonors.csv</code></li>
                <li>For enterprise donors: Edit <code>public/data/enterpriseDonors.csv</code></li>
                <li>Save the file and refresh the page</li>
              </ol>
            </Typography>
          </Alert>
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2" gutterBottom>
              <strong>如何管理捐助者：</strong>
            </Typography>
            <Typography variant="body2" component="div">
              捐助者存储在CSV文件中。要添加、编辑或删除捐助者：
              <ol style={{ margin: '8px 0', paddingLeft: '20px' }}>
                <li>个人捐助者：编辑 <code>public/data/individualDonors.csv</code></li>
                <li>企业捐助者：编辑 <code>public/data/enterpriseDonors.csv</code></li>
                <li>保存文件并刷新页面</li>
              </ol>
            </Typography>
          </Alert>
          <Alert severity="warning">
            <Typography variant="body2">
              <strong>API Integration:</strong> The donor API endpoints (<code>/api/donors</code>) are available for programmatic management. Contact the development team for API access.
              <br /><br />
              <strong>API集成：</strong> 捐助者API端点（<code>/api/donors</code>）可用于程序化管理。请联系开发团队获取API访问权限。
            </Typography>
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAdminInfoOpen(false)}>
            Close / 关闭
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
