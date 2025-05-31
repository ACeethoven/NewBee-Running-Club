// List of meeting files - this will be updated as new files are added
const meetingFiles = [
  '2024-04-30.md',
  '2024-05-15.md',
  '2025-05-30.md'
];

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