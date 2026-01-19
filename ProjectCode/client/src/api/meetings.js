// List of meeting files - this will be updated as new files are added
// Note: Meeting minutes are now stored in the database. This is kept for legacy compatibility.
const meetingFiles = [];

export const getMeetingFiles = () => {
  return meetingFiles;
};

export const getMeetingContent = async (filename) => {
  try {
    const response = await fetch(`/data/meetings/${filename}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${filename}`);
    }
    return await response.text();
  } catch (error) {
    console.error(`Error fetching ${filename}:`, error);
    throw error;
  }
}; 