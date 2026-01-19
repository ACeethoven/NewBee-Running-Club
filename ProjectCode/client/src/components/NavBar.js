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
                  <Button
                    component={NavLink}
                    to="/admin"
                    sx={{
                      color: '#FFD700',
                      textTransform: 'none',
                      fontSize: '0.9rem',
                      minWidth: 'auto',
                      px: 2,
                      py: 1,
                      borderRadius: 0,
                      '&:hover': {
                        backgroundColor: 'rgba(255, 215, 0, 0.25)',
                      }
                    }}
                  >
                    <AdminPanelSettingsIcon sx={{ fontSize: '1.2rem', mr: 0.5 }} />
                    Admin
                  </Button>
                  <Tooltip title={adminModeEnabled ? "Switch to Runner Mode / 切换跑者模式" : "Switch to Admin Mode / 切换管理员模式"}>
                    <Box sx={{ display: 'flex', alignItems: 'center', pr: 1 }}>
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
