import { AppBar, Box, Button, Container, Switch, Toolbar, Tooltip, Typography, useMediaQuery, useTheme } from '@mui/material';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import PersonIcon from '@mui/icons-material/Person';
import { NavLink } from 'react-router-dom';
import { useAdmin } from '../context';

function NavText({ href, text, shortText }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Typography
      variant="subtitle1"
      noWrap
      sx={{
        fontFamily: 'Orbitron, monospace',
        fontWeight: 500,
        letterSpacing: '.05rem',
        color: '#FFFFFF',
        fontSize: { xs: '0.75rem', sm: '0.9rem' },
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        padding: { xs: '4px 8px', sm: '4px 12px' },
        borderRadius: '8px',
        border: '1px solid rgba(255, 255, 255, 0.3)',
        transition: 'all 0.2s ease',
        '&:hover': {
          backgroundColor: 'rgba(255, 255, 255, 0.2)',
          border: '1px solid rgba(255, 255, 255, 0.4)',
        }
      }}
    >
      <NavLink
        to={href}
        style={{
          color: 'inherit',
          textDecoration: 'none',
        }}
      >
        {isMobile && shortText ? shortText : text}
      </NavLink>
    </Typography>
  );
}

export default function NavBar() {
  const { isAdmin, adminModeEnabled, toggleAdminMode } = useAdmin();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Top Banner */}
      <AppBar
        position="static"
        elevation={0}
        sx={{
          backgroundColor: '#e98f4bff',
          boxShadow: 'none',
          width: '100%',
        }}
      >
        <Container maxWidth={false} sx={{ px: { xs: 1, sm: 2, md: 4 } }}>
          <Toolbar disableGutters sx={{
            display: 'flex',
            justifyContent: 'space-between',
            py: 1,
            minHeight: '48px'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <NavText
                href='/'
                text='纽约新蜂跑团 NewBee Running Club'
                shortText='NewBee RC'
              />
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 2 } }}>
              {/* Admin Panel Button with Mode Toggle - only visible to admins */}
              {isAdmin && (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    backgroundColor: adminModeEnabled ? 'rgba(255, 215, 0, 0.2)' : 'rgba(255, 215, 0, 0.15)',
                    borderRadius: '8px',
                    border: adminModeEnabled ? '1px solid #FFD700' : '1px solid rgba(255, 215, 0, 0.5)',
                    transition: 'all 0.3s ease',
                    overflow: 'hidden',
                  }}
                >
                  <Tooltip title="Admin Panel / 管理面板">
                    <Button
                      component={NavLink}
                      to="/admin"
                      sx={{
                        color: '#FFD700',
                        textTransform: 'none',
                        fontSize: { xs: '0.75rem', sm: '0.9rem' },
                        minWidth: 'auto',
                        px: { xs: 1, sm: 2 },
                        py: { xs: 0.5, sm: 1 },
                        borderRadius: 0,
                        '&:hover': {
                          backgroundColor: 'rgba(255, 215, 0, 0.25)',
                        }
                      }}
                    >
                      <AdminPanelSettingsIcon sx={{ fontSize: { xs: '1.1rem', sm: '1.2rem' }, mr: isMobile ? 0 : 0.5 }} />
                      {!isMobile && 'Admin'}
                    </Button>
                  </Tooltip>
                  <Tooltip title={adminModeEnabled ? "Switch to Runner Mode / 切换跑者模式" : "Switch to Admin Mode / 切换管理员模式"}>
                    <Box sx={{ display: 'flex', alignItems: 'center', pr: { xs: 0.5, sm: 1 } }}>
                      <Switch
                        checked={adminModeEnabled}
                        onChange={toggleAdminMode}
                        size="small"
                        sx={{
                          '& .MuiSwitch-switchBase': {
                            color: 'white',
                            '&.Mui-checked': {
                              color: '#FFD700',
                            },
                            '&.Mui-checked + .MuiSwitch-track': {
                              backgroundColor: '#FFD700',
                            },
                          },
                          '& .MuiSwitch-track': {
                            backgroundColor: 'rgba(255, 255, 255, 0.5)',
                          },
                        }}
                      />
                    </Box>
                  </Tooltip>
                </Box>
              )}

              <Tooltip title="Profile / 个人资料">
                <Button
                  component={NavLink}
                  to="/profile"
                  sx={{
                    color: 'white',
                    textTransform: 'none',
                    fontSize: { xs: '0.75rem', sm: '0.9rem' },
                    minWidth: 'auto',
                    px: { xs: 1, sm: 3 },
                    py: { xs: 0.5, sm: 1 },
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                      border: '1px solid rgba(255, 255, 255, 0.4)',
                    }
                  }}
                >
                  {isMobile ? <PersonIcon sx={{ fontSize: '1.1rem' }} /> : 'Profile'}
                </Button>
              </Tooltip>
            </Box>
          </Toolbar>
        </Container>
      </AppBar>
    </Box>
  );
}
