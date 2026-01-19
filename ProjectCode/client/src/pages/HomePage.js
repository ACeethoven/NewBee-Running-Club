import { Box, Container, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import Logo from '../components/Logo';
import NavigationButtons from '../components/NavigationButtons';

const masterImages = [
  {
    src: '/master-image-1.jpg',
    alt: 'NewBee Running Club Master Image 1'
  },
  {
    src: '/master-image-2.jpg',
    alt: 'NewBee Running Club Master Image 2'
  },
  {
    src: '/master-image-3.jpg',
    alt: 'NewBee Running Club Master Image 3'
  }
];

export default function HomePage() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    // Change image every 5 seconds
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => 
        prevIndex === masterImages.length - 1 ? 0 : prevIndex + 1
      );
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 0.25, sm: 0.5 } }}>
      {/* Logo Section */}
      <Logo />

      {/* Buttons Section */}
      <NavigationButtons variant="filled" />

      {/* Master Image Section */}
      <Container maxWidth="xl" sx={{ px: { xs: 1, sm: 2 }, mt: 0 }}>
        <Box
          sx={{
            width: '100%',
            height: { xs: '200px', sm: '350px', md: '500px' },
            overflow: 'hidden',
            position: 'relative',
            borderRadius: { xs: '8px', sm: '12px' },
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
          }}
        >
          {masterImages.map((image, index) => (
            <Box
              key={index}
              component="img"
              src={image.src}
              alt={image.alt}
              sx={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                position: 'absolute',
                top: 0,
                left: 0,
                opacity: index === currentImageIndex ? 1 : 0,
                transition: 'opacity 1s ease-in-out',
                borderRadius: { xs: '8px', sm: '12px' },
              }}
            />
          ))}
        </Box>
      </Container>

      {/* Event Registration Text */}
      <Container maxWidth="xl" sx={{ px: { xs: 1, sm: 2 }, mt: { xs: 1, sm: 2 } }}>
        <Box>
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
            Event Registration
            <br />
            活动报名
          </Typography>
        </Box>
      </Container>

      {/* Event Registration Section */}
      <Container maxWidth="xl" sx={{ px: { xs: 1, sm: 2 }, mt: 0 }}>
        <Box
          sx={{
            width: '100%',
            height: { xs: '200px', sm: '350px', md: '500px' },
            overflow: 'hidden',
            position: 'relative',
            borderRadius: { xs: '8px', sm: '12px' },
            cursor: 'pointer',
            backgroundColor: '#4a4a4a',
            display: 'block',
            '&:hover': {
              backgroundColor: '#5a5a5a',
            },
          }}
          component="a"
          href="/event-registration"
        >
          <Box
            component="img"
            src="/EventRegistration.png"
            alt="Event Registration"
            sx={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              borderRadius: { xs: '8px', sm: '12px' },
            }}
          />
        </Box>
      </Container>

      {/* Highlights Text */}
      <Container maxWidth="xl" sx={{ px: { xs: 1, sm: 2 }, mt: { xs: 1, sm: 2 } }}>
        <Box>
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
            Event Highlights
            <br />
            活动高光
          </Typography>
        </Box>
      </Container>

      {/* Highlights Section */}
      <Container maxWidth="xl" sx={{ px: { xs: 1, sm: 2 }, mt: 0 }}>
        <Box
          sx={{
            width: '100%',
            height: { xs: '200px', sm: '350px', md: '500px' },
            overflow: 'hidden',
            position: 'relative',
            borderRadius: { xs: '8px', sm: '12px' },
            cursor: 'pointer',
            backgroundColor: '#4a4a4a',
            display: 'block',
            '&:hover': {
              backgroundColor: '#5a5a5a',
            },
          }}
          component="a"
          href="/Highlights"
        >
          <Box
            component="img"
            src="/Highlights.png"
            alt="Highlights"
            sx={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              borderRadius: { xs: '8px', sm: '12px' },
            }}
          />
        </Box>
      </Container>

    </Box>
  );
}
