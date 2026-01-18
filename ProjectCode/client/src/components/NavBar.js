import { AppBar, Box, Button, Container, Switch, Toolbar, Tooltip, Typography } from '@mui/material';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import { NavLink } from 'react-router-dom';
import { useAdmin } from '../context';

function NavText({ href, text }) {
  return (
    <Typography
      variant="subtitle1"
      noWrap
      sx={{
        fontFamily: 'Orbitron, monospace',
        fontWeight: 500,
        letterSpacing: '.05rem',
        color: '#FFFFFF',
        fontSize: '0.9rem',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        padding: '4px 12px',
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
        {text}
      </NavLink>
    </Typography>
  );
}

export default function NavBar() {
  const { isAdmin, adminModeEnabled, toggleAdminMode } = useAdmin();

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Top Banner */}
      <AppBar
        position="static"
        elevation={0}
        sx={{
          backgroundColor: '#e98f4bff',
          boxShadow: 'none',
          width: '100vw',
          left: 0,
          right: 0
        }}
      >
        <Container maxWidth={false} sx={{ px: { xs: 2, md: 4 } }}>
          <Toolbar disableGutters sx={{
            display: 'flex',
            justifyContent: 'space-between',
            py: 1,
            minHeight: '48px'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <NavText href='/' text='纽约新蜂跑团 NewBee Running Club' />
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {/* Admin Mode Toggle */}
              {isAdmin && (
                <Tooltip title={adminModeEnabled ? "Disable Admin Mode / 关闭管理员模式" : "Enable Admin Mode / 开启管理员模式"}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      backgroundColor: adminModeEnabled ? 'rgba(255, 193, 7, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      px: 1,
                      py: 0.5,
                      border: adminModeEnabled ? '1px solid #FFD700' : '1px solid rgba(255, 255, 255, 0.3)',
                      transition: 'all 0.3s ease',
                    }}
                  >
                    <AdminPanelSettingsIcon
                      sx={{
                        color: adminModeEnabled ? '#FFD700' : 'white',
                        fontSize: '1.2rem',
                        mr: 0.5
                      }}
                    />
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
                    <Typography
                      variant="caption"
                      sx={{
                        color: adminModeEnabled ? '#FFD700' : 'white',
                        fontWeight: adminModeEnabled ? 600 : 400,
                        ml: 0.5,
                        display: { xs: 'none', sm: 'block' }
                      }}
                    >
                      Admin
                    </Typography>
                  </Box>
                </Tooltip>
              )}

              <Button
                component={NavLink}
                to="/profile"
                sx={{
                  color: 'white',
                  textTransform: 'none',
                  fontSize: '0.9rem',
                  minWidth: 'auto',
                  px: 3,
                  py: 1,
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
                Profile
              </Button>
            </Box>
          </Toolbar>
        </Container>
      </AppBar>
    </Box>
  );
}
