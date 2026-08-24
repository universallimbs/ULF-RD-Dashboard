declare global {
  interface Window {
    google: any;
    gapi: any;
  }
}

export const uploadFileToDrive = async (file: File, token: string, folderName: string): Promise<any> => {
  // First, find the folder ID by name
  let folderId = null;
  if (folderName) {
    try {
      // Query to find folder by name. For a real app, this should ideally search within a parent 'MVP 1 - Project' folder
      const query = encodeURIComponent(`mimeType='application/vnd.google-apps.folder' and name='${folderName}' and trashed=false`);
      const searchRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name)`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const searchData = await searchRes.json();
      if (searchData.files && searchData.files.length > 0) {
        folderId = searchData.files[0].id;
      }
    } catch (e) {
      console.warn("Folder not found, uploading to root", e);
    }
  }

  const metadata = {
    name: file.name,
    mimeType: file.type || 'application/octet-stream',
    ...(folderId ? { parents: [folderId] } : {})
  };

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', file);

  const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,iconLink', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: form
  });

  if (!res.ok) {
    throw new Error('Failed to upload file to Google Drive');
  }

  return res.json();
};

export const determinePhaseFolder = (status: string, tags: string[] = []): string => {
  // Simple heuristic for dynamic folder routing based on status / tags
  if (tags.includes('Define')) return '1 - Define Scope';
  if (tags.includes('Concept')) return '2 - Concept Phase';
  if (tags.includes('Design')) return '3 - Design Phase';
  if (status === 'In Progress' && tags.includes('Build')) return '4 - Build Phase';
  if (status === 'Done') return '6 - Final Delivery & Feedback phase';

  return 'MVP 1 - Project'; // Fallback
};
