import { Box, Typography } from '@mui/material';

export default function CommitteeMemberCard({ member, onImageClick }) {
  return (
    <Box sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 1
    }}>
      <Box
        component="img"
        src={member.image}
        alt={`Committee Member ${member.name}`}
        onClick={() => onImageClick(member.image)}
        sx={{
          width: '100%',
          maxWidth: '300px',
          aspectRatio: '1',
          objectFit: 'cover',
          borderRadius: '12px',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
          transition: 'transform 0.2s',
          cursor: 'pointer',
          '&:hover': {
            transform: 'scale(1.05)'
          }
        }}
      />
      <Typography
        variant="h6"
        sx={{
          textAlign: 'center',
          color: '#333',
          fontWeight: 600,
          fontSize: '0.9rem',
          mt: 0.5
        }}
      >
        {member.name}
      </Typography>
      <Typography
        variant="body1"
        sx={{
          textAlign: 'center',
          color: '#666',
          fontSize: '0.8rem'
        }}
      >
        {member.position.en}
        <br />
        {member.position.zh}
      </Typography>
    </Box>
  );
}