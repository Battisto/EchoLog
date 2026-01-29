// Utility helper functions
const formatDuration = (startTime, endTime) => {
  if (!startTime || !endTime) return null;
  
  const duration = Math.abs(new Date(endTime) - new Date(startTime));
  const hours = Math.floor(duration / (1000 * 60 * 60));
  const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
  
  return `${hours}h ${minutes}m`;
};

const validateObjectId = (id) => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};

module.exports = {
  formatDuration,
  validateObjectId
};
