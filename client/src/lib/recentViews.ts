export interface RecentFile {
  _id: string;
  title: string;
  subject: string;
  uploaderName?: string; // NEW: Added to support the updated Home feed UI
}

const STORAGE_KEY = 'mitrashare_recent_views';

export const saveRecentView = (file: RecentFile) => {
  let recents: RecentFile[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  
  // Remove if it already exists (so we can move it to the top)
  recents = recents.filter(f => f._id !== file._id);
  
  // Add the new file to the front of the array
  recents.unshift(file);
  
  // Keep only the last 20 to save memory and screen space
  if (recents.length > 20) recents.pop();
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(recents));
};

export const getRecentViews = (): RecentFile[] => {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
};