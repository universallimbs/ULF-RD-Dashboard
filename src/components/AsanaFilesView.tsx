import React, { useMemo, useState } from 'react';
import { useAsanaStore } from '../store/asanaStore';
import { FileText, Image as ImageIcon, ExternalLink, Calendar, Upload, Plus, X } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { determinePhaseFolder, uploadFileToDrive } from '../lib/drive';

export default function AsanaFilesView() {
  const { tasks, addAttachment } = useAsanaStore();
  const [isUploading, setIsUploading] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [isDrivePickerOpen, setIsDrivePickerOpen] = useState(false);

  // Aggregate all attachments from all tasks
  const allFiles = useMemo(() => {
    return tasks.flatMap(task =>
      task.attachments.map(att => ({
        ...att,
        taskId: task.id,
        taskTitle: task.title
      }))
    ).sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
  }, [tasks]);

  const handleDriveUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !selectedTaskId) return;
    const file = e.target.files[0];
    const task = tasks.find(t => t.id === selectedTaskId);
    if (!task) return;

    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) {
      const mockUrl = URL.createObjectURL(file);
      addAttachment(task.id, {
        id: `mock_${Date.now()}`,
        fileName: file.name,
        url: mockUrl,
        uploadedAt: new Date().toISOString(),
        type: file.type.startsWith('image/') ? 'image' : 'document'
      });
      setSelectedTaskId('');
      return;
    }

    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: 'https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.metadata.readonly',
      callback: async (response: any) => {
        if (response.error) {
          console.error("Auth error", response);
          return;
        }
        setIsUploading(true);
        try {
          const folderName = determinePhaseFolder(task.status, task.tags);
          const res = await uploadFileToDrive(file, response.access_token, folderName);

          addAttachment(task.id, {
            id: res.id,
            fileName: res.name,
            url: res.webViewLink || '#',
            uploadedAt: new Date().toISOString(),
            type: file.type.startsWith('image/') ? 'image' : 'document'
          });

          setSelectedTaskId('');
        } catch (err) {
          console.error(err);
        } finally {
          setIsUploading(false);
        }
      }
    });
    client.requestAccessToken();
  };

  const openDrivePicker = () => {
    if (!selectedTaskId) return;
    const task = tasks.find(t => t.id === selectedTaskId);
    if (!task) return;

    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) {
      alert("Google Drive API is disabled in Local Storage Mode.");
      return;
    }

    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: 'https://www.googleapis.com/auth/drive.readonly',
      callback: (response: any) => {
        if (response.error) {
          console.error("Auth error", response);
          return;
        }

        const showPicker = () => {
          const picker = new window.google.picker.PickerBuilder()
            .addView(window.google.picker.ViewId.DOCS)
            .setOAuthToken(response.access_token)
            .setCallback((data: any) => {
              if (data.action === window.google.picker.Action.PICKED) {
                const doc = data.docs[0];
                addAttachment(task.id, {
                  id: doc.id,
                  fileName: doc.name,
                  url: doc.url,
                  uploadedAt: new Date().toISOString(),
                  type: doc.mimeType?.startsWith('image/') ? 'image' : 'document'
                });
                setIsDrivePickerOpen(false);
                setSelectedTaskId('');
              }
            })
            .build();
          picker.setVisible(true);
        };

        if (window.google.picker) {
          showPicker();
        } else {
          window.gapi.load('picker', { callback: showPicker });
        }
      }
    });
    client.requestAccessToken();
  };

  return (
    <div className="flex flex-col h-full bg-[#181a1c] p-6 overflow-auto">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h2 className="text-xl font-bold text-[#f6f3fa]">Project Files (Google Drive)</h2>
          {!import.meta.env.VITE_GOOGLE_CLIENT_ID && (
            <span className="mt-2 inline-block bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 text-xs px-2.5 py-1 rounded-md font-medium tracking-wide">
              Local Storage Mode - Google Drive Disconnected
            </span>
          )}
          <p className="text-[#f6f3fa]/50 text-sm mt-2">Upload and organize files directly into Drive folders.</p>
        </div>
        <button
          onClick={() => setIsDrivePickerOpen(true)}
          className="bg-[#6339b5] hover:bg-[#522b9c] text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
        >
          <Plus size={16} />
          Attach File
        </button>
      </div>

      {isDrivePickerOpen && (
        <div className="bg-[#202225] border border-[#f6f3fa]/10 p-4 rounded-xl mb-6 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-[#f6f3fa] font-medium">Select a Task to Attach To</h3>
            <button onClick={() => setIsDrivePickerOpen(false)} className="text-[#f6f3fa]/50 hover:text-[#f6f3fa]">
              <X size={16} />
            </button>
          </div>
          <select
            value={selectedTaskId}
            onChange={(e) => setSelectedTaskId(e.target.value)}
            className="w-full bg-[#181a1c] border border-[#f6f3fa]/10 rounded px-3 py-2 text-[#f6f3fa] focus:outline-none focus:border-[#6339b5] mb-4"
          >
            <option value="">-- Choose Task --</option>
            {tasks.map(t => (
              <option key={t.id} value={t.id}>{t.title} ({t.status})</option>
            ))}
          </select>

          <div className="flex items-center gap-3">
            <label className={`flex-1 flex justify-center items-center gap-2 py-2 rounded text-sm font-medium transition-colors cursor-pointer border
              ${selectedTaskId ? (isUploading ? 'bg-[#f6f3fa]/5 text-[#f6f3fa]/30 border-transparent' : 'bg-[#181a1c] text-[#f6f3fa] border-[#f6f3fa]/20 hover:bg-[#f6f3fa]/5') : 'opacity-50 cursor-not-allowed bg-[#181a1c] text-[#f6f3fa]/30 border-[#f6f3fa]/10'}`}
            >
              <Upload size={16} />
              {isUploading ? 'Uploading...' : 'Upload from Computer'}
              <input
                type="file"
                className="hidden"
                onChange={handleDriveUpload}
                disabled={!selectedTaskId || isUploading}
              />
            </label>

            <button
              onClick={openDrivePicker}
              disabled={!selectedTaskId}
              className={`flex-1 flex justify-center items-center gap-2 py-2 rounded text-sm font-medium transition-colors border
                ${selectedTaskId ? 'bg-[#6339b5]/20 text-[#6339b5] border-[#6339b5]/30 hover:bg-[#6339b5]/30' : 'opacity-50 cursor-not-allowed bg-[#181a1c] text-[#f6f3fa]/30 border-[#f6f3fa]/10'}`}
            >
              <img src="https://upload.wikimedia.org/wikipedia/commons/1/12/Google_Drive_icon_%282020%29.svg" alt="Drive" className="w-4 h-4" />
              Select from Drive
            </button>
          </div>
        </div>
      )}

      {allFiles.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {allFiles.map((file, i) => (
            <div key={`${file.id}-${i}`} className="bg-[#202225] border border-[#f6f3fa]/10 rounded-xl overflow-hidden shadow-sm group hover:border-[#f6f3fa]/30 transition-colors flex flex-col">

              {/* File Preview Thumbnail */}
              <div className="h-32 bg-[#181a1c] border-b border-[#f6f3fa]/5 flex items-center justify-center relative overflow-hidden">
                {file.type === 'image' ? (
                  <div className="w-full h-full bg-[#6339b5]/10 flex items-center justify-center group-hover:bg-[#6339b5]/20 transition-colors">
                    <ImageIcon size={32} className="text-[#6339b5]/50" />
                  </div>
                ) : (
                  <div className="w-full h-full bg-[#f6f3fa]/5 flex items-center justify-center group-hover:bg-[#f6f3fa]/10 transition-colors">
                    <FileText size={32} className="text-[#f6f3fa]/30" />
                  </div>
                )}

                {/* Hover Action Overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <a href={file.url} target="_blank" rel="noopener noreferrer" className="p-2 bg-[#6339b5] rounded-full text-white shadow-lg hover:scale-110 transition-transform">
                    <ExternalLink size={16} />
                  </a>
                </div>
              </div>

              {/* File Meta */}
              <div className="p-4 flex flex-col gap-2 flex-1">
                <div className="flex items-start gap-2">
                  <div className="mt-0.5 shrink-0">
                    {file.type === 'image' ? (
                      <ImageIcon size={14} className="text-[#e6d46a]" />
                    ) : (
                      <FileText size={14} className="text-[#f6f3fa]/50" />
                    )}
                  </div>
                  <h3 className="text-sm font-semibold text-[#f6f3fa] truncate" title={file.fileName}>
                    {file.fileName}
                  </h3>
                </div>

                <div className="mt-auto pt-3 border-t border-[#f6f3fa]/5 flex flex-col gap-1.5">
                  <div className="flex items-center gap-1.5 text-[10px] text-[#f6f3fa]/40 truncate">
                    <span className="font-medium text-[#f6f3fa]/60">Task:</span>
                    <span className="truncate">{file.taskTitle}</span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-[#f6f3fa]/40">
                    <Calendar size={10} />
                    <span>{format(parseISO(file.uploadedAt), 'MMM d, yyyy')}</span>
                  </div>
                </div>
              </div>

            </div>
          ))}
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-[#f6f3fa]/10 rounded-xl min-h-[400px]">
          <FileText size={48} className="text-[#f6f3fa]/10 mb-4" />
          <h3 className="text-[#f6f3fa] font-semibold text-lg">No files yet</h3>
          <p className="text-[#f6f3fa]/50 text-sm mt-1">Attachments added to tasks will appear here.</p>
        </div>
      )}
    </div>
  );
}
