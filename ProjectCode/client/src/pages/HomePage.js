import { Box, Container, Typography } from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import NavigationButtons from '../components/NavigationButtons';

const masterImages = [
  {
    src: '/master-image-1.jpg',
    alt: 'NewBee Running Club - About Us',
    link: '/about',
    label: 'About Us',
    labelCn: '关于我们'
  },
  {
    src: '/master-image-2.jpg',
    alt: 'NewBee Running Club - Join Us',
    link: '/join',
    label: 'Join Us',
    labelCn: '加入我们'
  },
  {
    src: '/master-image-3.jpg',
    alt: 'NewBee Running Club - Events Calendar',
    link: '/calendar',
    label: 'Events',
    labelCn: '活动日历'
  }
];

export default function HomePage() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Change image every 5 seconds
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) =>
        prevIndex === masterImages.length - 1 ? 0 : prevIndex + 1
      );
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleBannerClick = () => {
    const currentImage = masterImages[currentImageIndex];
    if (currentImage.link) {
      navigate(currentImage.link);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 0.25, sm: 0.5 } }}>
      {/* Logo Section */}
      <Logo />

      {/* Buttons Section */}
      <NavigationButtons variant="filled" />

      {/* Master Image Section - Clickable Banner */}
      <Container maxWidth="xl" sx={{ px: { xs: 1, sm: 2 }, mt: 0 }}>
        <Box
          onClick={handleBannerClick}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          sx={{
            width: '100%',
            height: { xs: '200px', sm: '350px', md: '500px' },
            overflow: 'hidden',
            position: 'relative',
            borderRadius: { xs: '8px', sm: '12px' },
            boxShadow: isHovered
              ? '0 8px 24px rgba(255, 165, 0, 0.3)'
              : '0 2px 4px rgba(0, 0, 0, 0.1)',
            cursor: 'pointer',
            transition: 'box-shadow 0.3s ease, transform 0.3s ease',
            transform: isHovered ? 'scale(1.005)' : 'scale(1)',
            '&:active': {
              transform: 'scale(0.995)',
            },
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
                transition: 'opacity 1s ease-in-out, filter 0.3s ease',
                borderRadius: { xs: '8px', sm: '12px' },
                filter: isHovered ? 'brightness(0.85)' : 'brightness(1)',
              }}
            />
          ))}

          {/* Hover Overlay with Label */}
          <Box
            sx={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 50%, transparent 100%)',
              padding: { xs: 2, sm: 3, md: 4 },
              opacity: isHovered ? 1 : 0,
              transition: 'opacity 0.3s ease',
              borderRadius: { xs: '0 0 8px 8px', sm: '0 0 12px 12px' },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography
                  variant="h5"
                  sx={{
                    color: 'white',
                    fontWeight: 600,
                    fontSize: { xs: '1rem', sm: '1.25rem', md: '1.5rem' },
                    textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
                  }}
                >
                  {masterImages[currentImageIndex].label}
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    color: 'rgba(255,255,255,0.9)',
                    fontSize: { xs: '0.875rem', sm: '1rem', md: '1.125rem' },
                    textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
                  }}
                >
                  {masterImages[currentImageIndex].labelCn}
                </Typography>
              </Box>
              <ArrowForwardIcon
                sx={{
                  color: '#FFA500',
                  fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' },
                  transform: isHovered ? 'translateX(4px)' : 'translateX(0)',
                  transition: 'transform 0.3s ease',
                }}
              />
            </Box>
          </Box>

          {/* Carousel Indicators */}
          <Box
            sx={{
              position: 'absolute',
              bottom: { xs: 8, sm: 12 },
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              gap: 1,
              zIndex: 2,
              opacity: isHovered ? 0 : 1,
              transition: 'opacity 0.3s ease',
            }}
          >
            {masterImages.map((_, index) => (
              <Box
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentImageIndex(index);
                }}
                sx={{
                  width: { xs: 8, sm: 10 },
                  height: { xs: 8, sm: 10 },
                  borderRadius: '50%',
                  backgroundColor: index === currentImageIndex ? '#FFA500' : 'rgba(255,255,255,0.5)',
                  cursor: 'pointer',
                  transition: 'background-color 0.3s ease, transform 0.2s ease',
                  '&:hover': {
                    transform: 'scale(1.2)',
                    backgroundColor: index === currentImageIndex ? '#FFA500' : 'rgba(255,255,255,0.8)',
                  },
                }}
              />
            ))}
          </Box>
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
