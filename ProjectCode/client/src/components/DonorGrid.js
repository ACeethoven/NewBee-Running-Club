import { Box, Grid, Typography } from '@mui/material';
import React from 'react';

const DonorGrid = ({ data }) => {
  // Split data into two columns
  const midPoint = Math.ceil(data.length / 2);
  const leftColumn = data.slice(0, midPoint);
  const rightColumn = data.slice(midPoint);

  return (
    <Box sx={{ width: '100%' }}>
      <Grid container spacing={2}>
        {/* Left Column */}
        <Grid item xs={12} md={6}>
          {leftColumn.map((donor) => (
            <Box
              key={donor.id}
              sx={{
                p: 1,
                borderBottom: '1px solid #eee',
                '&:last-child': {
                  borderBottom: 'none'
                }
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body1">
                  {donor.name}
                </Typography>
                {donor.notes && (
                  <Typography variant="caption" sx={{ color: 'text.secondary', ml: 2 }}>
                    {donor.notes}
                  </Typography>
                )}
              </Box>
            </Box>
          ))}
        </Grid>
        {/* Right Column */}
        <Grid item xs={12} md={6}>
          {rightColumn.map((donor) => (
            <Box
              key={donor.id}
              sx={{
                p: 1,
                borderBottom: '1px solid #eee',
                '&:last-child': {
                  borderBottom: 'none'
                }
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body1">
                  {donor.name}
                </Typography>
                {donor.notes && (
                  <Typography variant="caption" sx={{ color: 'text.secondary', ml: 2 }}>
                    {donor.notes}
                  </Typography>
                )}
              </Box>
            </Box>
          ))}
        </Grid>
      </Grid>
    </Box>
  );
};

export default DonorGrid; 