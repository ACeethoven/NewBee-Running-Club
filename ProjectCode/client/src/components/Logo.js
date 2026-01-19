import { Box, Container } from '@mui/material';

export default function Logo() {
  return (
    <Container maxWidth="xl" sx={{ px: { xs: 1, sm: 2 }, pt: { xs: 1, sm: 2 }, pb: 0 }}>
      <Box
        component="img"
        src="/PageLogo.png"
        alt="NewBee Running Club Logo"
        sx={{
          height: { xs: '50px', sm: '65px', md: '80px' },
          width: 'auto',
          objectFit: 'contain'
        }}
      />
    </Container>
  );
} 