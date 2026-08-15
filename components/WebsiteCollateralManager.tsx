import React, { useState, useEffect, useMemo } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase';
import { Sermon, DriveAudioFile } from '../types';
import { 
  FolderKey, 
  ExternalLink, 
  RefreshCw, 
  Plus, 
  Edit3, 
  Trash2, 
  Search, 
  CheckCircle2, 
  Eye, 
  EyeOff, 
  Tag, 
  Calendar, 
  Clock, 
  User, 
  Download, 
  Headphones, 
  Check, 
  X, 
  AlertCircle,
  HardDrive,
  Sparkles,
  BookOpen,
  CheckSquare,
  Lock,
  Archive
} from 'lucide-react';

interface WebsiteCollateralManagerProps {
  adminEmail: string;
}

const GOOGLE_DRIVE_FOLDER_ID = "1qi4li-RY2flBnRt6wLfnpXpu4JeY_yVM";
const GOOGLE_DRIVE_FOLDER_URL = `https://drive.google.com/drive/folders/${GOOGLE_DRIVE_FOLDER_ID}`;

const WebsiteCollateralManager: React.FC<WebsiteCollateralManagerProps> = ({ adminEmail }) => {
  const [sermonsList, setSermonsList] = useState<Sermon[]>([]);
  const [loadingSermons, setLoadingSermons] = useState(true);

  // Google Drive state
  const [driveFiles, setDriveFiles] = useState<DriveAudioFile[]>([]);
  const [loadingDrive, setLoadingDrive] = useState(false);
  const [driveError, setDriveError] = useState('');
  const [driveSuccess, setDriveSuccess] = useState('');
  const [driveFilter, setDriveFilter] = useState<'uncataloged' | 'all' | 'cataloged'>('uncataloged');

  // Helper to determine if a Google Drive audio file is already cataloged in Firestore
  const isDriveFileCataloged = (file: DriveAudioFile, sermons: Sermon[]): boolean => {
    return sermons.some((sermon) => {
      // Ignore archived items so their Drive files become uncataloged
      if (sermon.isArchived || sermon.status === 'Archived' || sermon.title === 'Archived') return false;

      // 1. Direct ID match
      if (sermon.driveFileId && sermon.driveFileId === file.id) return true;
      if (sermon.audioUrl && sermon.audioUrl.includes(file.id)) return true;
      if (sermon.downloadUrl && sermon.downloadUrl.includes(file.id)) return true;
      
      // 2. Exact drive filename match
      if (sermon.driveFileName && sermon.driveFileName.trim().toLowerCase() === file.name.trim().toLowerCase()) return true;

      // 3. Normalized filename vs title exact equality comparison
      const cleanFileName = file.name
        .replace(/\.[^/.]+$/, "") // strip extension (.mp3)
        .replace(/^(20\d{2})[-_](0[1-9]|1[0-2])[-_](0[1-9]|[12]\d|3[01])[-_]?/i, "") // strip leading date prefix
        .replace(/[-_]/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase();

      const cleanTitle = (sermon.title || "")
        .replace(/[-_]/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase();

      if (cleanFileName && cleanTitle) {
        if (cleanFileName === cleanTitle) return true;
      }

      return false;
    });
  };

  const uncatalogedDriveFiles = useMemo(() => {
    return driveFiles.filter((file) => !isDriveFileCataloged(file, sermonsList));
  }, [driveFiles, sermonsList]);

  const catalogedDriveFiles = useMemo(() => {
    return driveFiles.filter((file) => isDriveFileCataloged(file, sermonsList));
  }, [driveFiles, sermonsList]);

  const displayedDriveFiles = useMemo(() => {
    if (driveFilter === 'uncataloged') return uncatalogedDriveFiles;
    if (driveFilter === 'cataloged') return catalogedDriveFiles;
    return driveFiles;
  }, [driveFilter, uncatalogedDriveFiles, catalogedDriveFiles, driveFiles]);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPublished, setFilterPublished] = useState<'all' | 'published' | 'draft'>('all');

  // Multi-select state for bulk actions
  const [selectedSermonIds, setSelectedSermonIds] = useState<string[]>([]);

  // Custom Confirmation Modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: 'delete_single' | 'bulk_set_archived' | 'bulk_archive_hidden' | 'bulk_delete' | 'purge_db';
    targetId?: string;
    targetTitle?: string;
    count?: number;
  }>({
    isOpen: false,
    type: 'delete_single',
  });
  const [purgeInputText, setPurgeInputText] = useState('');

  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSermon, setEditingSermon] = useState<Sermon | null>(null);

  // Form Fields
  const [title, setTitle] = useState('');
  const [speaker, setSpeaker] = useState('Pastor Leon Louw');
  const [sermonDate, setSermonDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [theme, setTheme] = useState('Knowing God');
  const [series, setSeries] = useState('');
  const [audioLength, setAudioLength] = useState('45:00');
  const [description, setDescription] = useState('');
  const [scripture, setScripture] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [downloadUrl, setDownloadUrl] = useState('');
  const [driveFileId, setDriveFileId] = useState('');
  const [driveFileName, setDriveFileName] = useState('');
  const [isPublished, setIsPublished] = useState(true);

  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  // Auto-hide sermons in Firestore if their linked audio file was removed from Google Drive
  const syncAndAutoHideMissingDriveFiles = async (filesInDrive: DriveAudioFile[], currentSermons: Sermon[]) => {
    if (!filesInDrive || filesInDrive.length === 0 || !currentSermons || currentSermons.length === 0) return;

    const driveIdsSet = new Set(filesInDrive.map((f) => f.id));
    const driveNamesSet = new Set(filesInDrive.map((f) => f.name.trim().toLowerCase()));

    const missingPublishedSermons = currentSermons.filter((sermon) => {
      if (!sermon.id || !sermon.isPublished) return false;
      const hasDriveMeta = Boolean(sermon.driveFileId || sermon.driveFileName);
      if (!hasDriveMeta) return false;

      const idFound = sermon.driveFileId ? driveIdsSet.has(sermon.driveFileId) : false;
      const nameFound = sermon.driveFileName ? driveNamesSet.has(sermon.driveFileName.trim().toLowerCase()) : false;

      return !idFound && !nameFound;
    });

    if (missingPublishedSermons.length > 0) {
      let hiddenCount = 0;
      for (const sermon of missingPublishedSermons) {
        if (!sermon.id) continue;
        try {
          await updateDoc(doc(db, 'sermons', sermon.id), {
            isPublished: false,
            isDriveMissing: true,
            updatedAt: new Date().toISOString()
          });
          hiddenCount++;
        } catch (e) {
          console.warn('Failed to auto-hide missing sermon:', sermon.id, e);
        }
      }
      if (hiddenCount > 0) {
        setStatusMsg(`Automatically hid ${hiddenCount} sermon(s) because their audio files were removed from Google Drive.`);
      }
    }
  };

  // Subscribe to Firestore 'sermons' collection
  useEffect(() => {
    setLoadingSermons(true);
    try {
      const q = query(collection(db, 'sermons'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const fetched: Sermon[] = [];
        snapshot.forEach((d) => {
          fetched.push({ ...d.data(), id: d.id } as Sermon);
        });

        // Sort by sermonDate descending
        fetched.sort((a, b) => new Date(b.sermonDate || 0).getTime() - new Date(a.sermonDate || 0).getTime());
        setSermonsList(fetched);
        setLoadingSermons(false);

        // Auto-hide any sermons whose drive files were deleted
        if (driveFiles.length > 0) {
          syncAndAutoHideMissingDriveFiles(driveFiles, fetched);
        }
      }, (err) => {
        console.warn('Sermons listener error:', err);
        setLoadingSermons(false);
      });

      return () => unsubscribe();
    } catch (err) {
      console.warn('Firestore sermons query error:', err);
      setLoadingSermons(false);
    }
  }, [driveFiles]);

  // Fetch audio files from Google Drive backend API
  const fetchDriveFiles = async () => {
    setLoadingDrive(true);
    setDriveError('');
    try {
      const res = await fetch(`/api/drive/files?folderId=${GOOGLE_DRIVE_FOLDER_ID}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.files)) {
        setDriveFiles(data.files);
        setDriveSuccess(`Loaded ${data.files.length} file(s) from tccmedia123 Google Drive`);
        if (sermonsList.length > 0) {
          syncAndAutoHideMissingDriveFiles(data.files, sermonsList);
        }
      } else {
        setDriveError(data.error || 'Connected to Google Drive folder.');
      }
    } catch (err: any) {
      setDriveError(err.message || 'Error communicating with Google Drive server route.');
    } finally {
      setLoadingDrive(false);
    }
  };

  useEffect(() => {
    fetchDriveFiles();
  }, []);

  // Pre-fill modal form from selected Google Drive File
  const handleSelectDriveFile = (file: DriveAudioFile) => {
    setEditingSermon(null);
    setDriveFileId(file.id);
    setDriveFileName(file.name);

    // Derive clean display title from file name (stripping dates and extension)
    const cleanDisplayTitle = file.name
      .replace(/\.[^/.]+$/, "")
      .replace(/^(20\d{2})[-_](0[1-9]|1[0-2])[-_](0[1-9]|[12]\d|3[01])[-_]?/i, "")
      .replace(/[-_]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    setTitle(cleanDisplayTitle || file.name);

    // Direct Google Drive playback/download links
    const streamProxyUrl = `/api/drive/stream/${file.id}`;
    const directDlUrl = `/api/drive/download/${file.id}?filename=${encodeURIComponent(file.name)}`;

    setAudioUrl(streamProxyUrl);
    setDownloadUrl(directDlUrl);
    setSermonDate(file.createdTime ? file.createdTime.split('T')[0] : new Date().toISOString().split('T')[0]);
    setIsPublished(true);
    setIsModalOpen(true);
  };

  // Open modal for Creating or Editing
  const openNewSermonModal = () => {
    setEditingSermon(null);
    setTitle('');
    setSpeaker('Pastor Leon Louw');
    setSermonDate(new Date().toISOString().split('T')[0]);
    setTheme('Knowing God');
    setSeries('');
    setAudioLength('45:00');
    setDescription('');
    setScripture('');
    setAudioUrl('');
    setDownloadUrl('');
    setDriveFileId('');
    setDriveFileName('');
    setIsPublished(true);
    setIsModalOpen(true);
  };

  const openEditModal = (sermon: Sermon) => {
    setEditingSermon(sermon);
    setTitle(sermon.title || '');
    setSpeaker(sermon.speaker || 'Pastor Leon Louw');
    setSermonDate(sermon.sermonDate || new Date().toISOString().split('T')[0]);
    setTheme(sermon.theme || 'Knowing God');
    setSeries(sermon.series || '');
    setAudioLength(sermon.audioLength || '45:00');
    setDescription(sermon.description || '');
    setScripture(sermon.scripture || '');
    setAudioUrl(sermon.audioUrl || '');
    setDownloadUrl(sermon.downloadUrl || '');
    setDriveFileId(sermon.driveFileId || '');
    setDriveFileName(sermon.driveFileName || '');
    setIsPublished(sermon.isPublished ?? true);
    setIsModalOpen(true);
  };

  // Save Sermon Record to Firestore
  const handleSaveSermon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setSaving(true);
    setStatusMsg('');

    try {
      const payload = {
        title: title.trim(),
        speaker: speaker.trim() || 'Pastor Leon Louw',
        sermonDate,
        theme: theme.trim() || 'Knowing God',
        series: series.trim() || '',
        audioLength: audioLength.trim() || '45:00',
        description: description.trim() || '',
        scripture: scripture.trim() || '',
        audioUrl: audioUrl.trim() || (driveFileId ? `/api/drive/stream/${driveFileId}` : ''),
        downloadUrl: downloadUrl.trim() || (driveFileId ? `https://docs.google.com/uc?export=download&id=${driveFileId}` : ''),
        driveFileId,
        driveFileName,
        driveWebViewLink: GOOGLE_DRIVE_FOLDER_URL,
        isPublished,
        updatedAt: new Date().toISOString(),
      };

      if (editingSermon?.id) {
        await updateDoc(doc(db, 'sermons', editingSermon.id), payload);
        setStatusMsg('Sermon collateral successfully updated!');
      } else {
        await addDoc(collection(db, 'sermons'), {
          ...payload,
          createdAt: new Date().toISOString(),
        });
        setStatusMsg('New sermon collateral successfully cataloged!');
      }

      setIsModalOpen(false);
    } catch (err: any) {
      console.error('Error saving sermon collateral:', err);
      setStatusMsg(`Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Quick Toggle Published Checkbox
  const handleTogglePublished = async (sermon: Sermon) => {
    if (!sermon.id) return;
    if (sermon.isArchived || sermon.title === 'Archived' || sermon.status === 'Archived') {
      alert('Archived items cannot be enabled on the front-end.');
      return;
    }
    try {
      await updateDoc(doc(db, 'sermons', sermon.id), {
        isPublished: !sermon.isPublished,
        updatedAt: new Date().toISOString(),
      });
    } catch (err: any) {
      console.error('Error toggling publish state:', err);
    }
  };

  // Helper archive payload to strip all file metadata & lock status
  const archiveSermonPayload = {
    title: 'Archived',
    speaker: '',
    sermonDate: '',
    theme: '',
    series: '',
    audioLength: '',
    description: '',
    scripture: '',
    driveFileId: '',
    driveFileName: '',
    audioUrl: '',
    downloadUrl: '',
    driveWebViewLink: '',
    fileSize: '',
    isPublished: false,
    isArchived: true,
    status: 'Archived',
    updatedAt: new Date().toISOString(),
  };

  // Open confirmation modal helper
  const triggerConfirmModal = (
    type: 'delete_single' | 'bulk_set_archived' | 'bulk_archive_hidden' | 'bulk_delete' | 'purge_db',
    targetId?: string,
    targetTitle?: string,
    count?: number
  ) => {
    setPurgeInputText('');
    setConfirmModal({
      isOpen: true,
      type,
      targetId,
      targetTitle,
      count,
    });
  };

  // Execute confirmed modal action
  const handleExecuteConfirmedAction = async () => {
    const { type, targetId, targetTitle } = confirmModal;
    setConfirmModal((prev) => ({ ...prev, isOpen: false }));
    setSaving(true);

    try {
      if (type === 'delete_single' && targetId) {
        await deleteDoc(doc(db, 'sermons', targetId));
        setSelectedSermonIds((prev) => prev.filter((i) => i !== targetId));
        await fetchDriveFiles();
        setStatusMsg(`Permanently deleted sermon "${targetTitle || targetId}".`);
      } else if (type === 'bulk_delete') {
        let count = 0;
        for (const id of selectedSermonIds) {
          await deleteDoc(doc(db, 'sermons', id));
          count++;
        }
        setSelectedSermonIds([]);
        await fetchDriveFiles();
        setStatusMsg(`Successfully permanently deleted ${count} selected sermon(s).`);
      } else if (type === 'bulk_set_archived') {
        let count = 0;
        for (const id of selectedSermonIds) {
          await updateDoc(doc(db, 'sermons', id), archiveSermonPayload);
          count++;
        }
        setSelectedSermonIds([]);
        await fetchDriveFiles();
        setStatusMsg(`Successfully archived ${count} selected sermon(s).`);
      } else if (type === 'bulk_archive_hidden') {
        const hiddenIds = hiddenSermons.map((s) => s.id).filter(Boolean) as string[];
        let count = 0;
        for (const id of hiddenIds) {
          await updateDoc(doc(db, 'sermons', id), archiveSermonPayload);
          count++;
        }
        setSelectedSermonIds([]);
        await fetchDriveFiles();
        setStatusMsg(`Successfully set ${count} hidden sermon(s) to Archived.`);
      } else if (type === 'purge_db') {
        let count = 0;
        for (const sermon of sermonsList) {
          if (sermon.id) {
            await deleteDoc(doc(db, 'sermons', sermon.id));
            count++;
          }
        }
        setSelectedSermonIds([]);
        await fetchDriveFiles();
        setStatusMsg(`Successfully purged ALL ${count} record(s) from the database.`);
      }
    } catch (err: any) {
      console.error('Error executing action:', err);
      setStatusMsg(`Action failed: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Active Non-Archived Sermons list (Archived items are hidden from Manage Collateral page)
  const activeSermons = useMemo(() => {
    return sermonsList.filter((s) => !s.isArchived && s.status !== 'Archived' && s.title !== 'Archived');
  }, [sermonsList]);

  const hiddenSermons = useMemo(() => {
    return activeSermons.filter((s) => !s.isPublished);
  }, [activeSermons]);

  const publishedSermons = useMemo(() => {
    return activeSermons.filter((s) => s.isPublished);
  }, [activeSermons]);

  const handleToggleSelectSermon = (id: string) => {
    setSelectedSermonIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAllHidden = () => {
    const hiddenIds = hiddenSermons.map((s) => s.id).filter(Boolean) as string[];
    const allSelected = hiddenIds.length > 0 && hiddenIds.every((id) => selectedSermonIds.includes(id));
    if (allSelected) {
      setSelectedSermonIds((prev) => prev.filter((id) => !hiddenIds.includes(id)));
    } else {
      setSelectedSermonIds((prev) => Array.from(new Set([...prev, ...hiddenIds])));
    }
  };

  // Filtered Active Sermons (Archived items are completely excluded)
  const filteredSermons = activeSermons.filter((s) => {
    const matchesQuery = 
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.speaker.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.theme && s.theme.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = 
      filterPublished === 'all' ||
      (filterPublished === 'published' && s.isPublished) ||
      (filterPublished === 'draft' && !s.isPublished);

    return matchesQuery && matchesStatus;
  });

  return (
    <div className="space-y-8">
      
      {/* Feature Header Card */}
      <div className="bg-gradient-to-r from-red-950/60 via-gray-900 to-gray-900 border border-red-500/30 rounded-3xl p-6 sm:p-8 space-y-4 shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-[#d32f2f]/20 text-[#d32f2f] rounded-2xl flex items-center justify-center border border-red-500/30 flex-shrink-0">
              <Headphones className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center space-x-2 text-xs font-bold text-red-400 uppercase tracking-widest">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Website Media & Audio Collateral</span>
              </div>
              <h2 className="text-2xl font-black text-white uppercase tracking-tight">
                Manage Website Collateral & Sermons
              </h2>
              <p className="text-xs text-gray-300 max-w-2xl leading-relaxed font-normal">
                Manage audio recordings from Google Drive <strong className="text-white font-mono">(tccmedia123@gmail.com)</strong>, set sermon metadata (title, date, speaker, theme), and control front-end visibility for church members.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Direct Link to Google Drive */}
            <a
              href={GOOGLE_DRIVE_FOLDER_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center space-x-2 shadow-lg"
            >
              <HardDrive className="w-4 h-4 text-amber-400" />
              <span>Open tccmedia123 Google Drive</span>
              <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
            </a>
          </div>
        </div>
      </div>

      {/* Google Drive Folder Files Listing */}
      <div className="bg-gray-900 border border-white/10 rounded-3xl p-6 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 w-full">
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center space-x-2">
                <FolderKey className="w-4 h-4 text-amber-400" />
                <span>Google Drive Audio Files Folder</span>
              </h3>
              <p className="text-xs text-gray-400 font-mono">
                Folder ID: {GOOGLE_DRIVE_FOLDER_ID} • Account: tccmedia123@gmail.com
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Filter Tabs */}
              <div className="flex items-center space-x-1 bg-gray-950 p-1 rounded-xl border border-white/10 text-xs">
                <button
                  type="button"
                  onClick={() => setDriveFilter('uncataloged')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all text-[11px] ${
                    driveFilter === 'uncataloged'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Uncataloged ({uncatalogedDriveFiles.length})
                </button>

                <button
                  type="button"
                  onClick={() => setDriveFilter('all')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all text-[11px] ${
                    driveFilter === 'all'
                      ? 'bg-white/15 text-white border border-white/20'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  All ({driveFiles.length})
                </button>

                <button
                  type="button"
                  onClick={() => setDriveFilter('cataloged')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all text-[11px] ${
                    driveFilter === 'cataloged'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Cataloged ({catalogedDriveFiles.length})
                </button>
              </div>

              <button
                onClick={fetchDriveFiles}
                disabled={loadingDrive}
                className="bg-gray-950 hover:bg-gray-800 text-gray-300 border border-white/10 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-red-400 ${loadingDrive ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>

        {driveSuccess && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>
                {driveFilter === 'uncataloged'
                  ? `Showing ${uncatalogedDriveFiles.length} uncataloged file(s) out of ${driveFiles.length} in Google Drive`
                  : driveFilter === 'cataloged'
                  ? `Showing ${catalogedDriveFiles.length} cataloged file(s) from Google Drive`
                  : `Loaded ${driveFiles.length} file(s) from tccmedia123 Google Drive`}
              </span>
            </div>
            {driveFilter === 'uncataloged' && catalogedDriveFiles.length > 0 && (
              <span className="text-[10px] text-emerald-400 font-mono bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/30">
                {catalogedDriveFiles.length} item(s) already cataloged
              </span>
            )}
          </div>
        )}

        {displayedDriveFiles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
            {displayedDriveFiles.map((file) => {
              const cataloged = isDriveFileCataloged(file, sermonsList);
              return (
                <div 
                  key={file.id} 
                  className={`bg-gray-950 border rounded-2xl p-4 space-y-2 transition-all flex flex-col justify-between ${
                    cataloged 
                      ? 'border-emerald-500/20 opacity-85 hover:opacity-100' 
                      : 'border-white/10 hover:border-amber-500/40'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${
                        cataloged 
                          ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' 
                          : 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                      }`}>
                        {cataloged ? '✓ CATALOGED' : 'UNCATALOGED'}
                      </span>
                      <span className="text-[10px] text-gray-400 font-mono">
                        {file.createdTime ? file.createdTime.split('T')[0] : 'Drive File'}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-white truncate pt-1">{file.name}</h4>
                  </div>

                  {cataloged ? (
                    <div className="w-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center space-x-1.5 mt-2">
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Already Cataloged</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSelectDriveFile(file)}
                      className="w-full bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center space-x-1.5 mt-2"
                    >
                      <Plus className="w-3.5 h-3.5 text-amber-400" />
                      <span>Catalog as Sermon</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        ) : driveFilter === 'uncataloged' && driveFiles.length > 0 ? (
          <div className="text-center py-8 text-xs text-gray-300 bg-gray-950/60 rounded-2xl border border-emerald-500/20 p-6 space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
            <p className="text-sm font-bold text-white">All Google Drive Audio Files Are Cataloged!</p>
            <p className="text-gray-400 max-w-md mx-auto">
              All {driveFiles.length} file(s) in the tccmedia123 Google Drive folder have already been cataloged into the sermon repository.
            </p>
            <button
              type="button"
              onClick={() => setDriveFilter('all')}
              className="inline-flex items-center space-x-1.5 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl border border-white/10 text-xs font-bold mt-2 transition-all"
            >
              <span>View All Drive Files</span>
            </button>
          </div>
        ) : (
          <div className="text-center py-6 text-xs text-gray-400 bg-gray-950/60 rounded-2xl border border-white/5 space-y-2">
            <p>
              Direct Google Drive folder integration active for <strong className="text-white">tccmedia123@gmail.com</strong>.
            </p>
            <p className="text-gray-500">
              Click <strong className="text-amber-400">"Open tccmedia123 Google Drive"</strong> above to view files directly in Google Drive or add custom sermon metadata records below.
            </p>
          </div>
        )}
      </div>

      {/* Sermons List & Metadata Table */}
      <div className="bg-gray-900 border border-white/10 rounded-3xl p-6 space-y-6 shadow-xl">
        
        {/* Toolbar & Bulk Actions */}
        <div className="flex flex-col space-y-4 border-b border-white/10 pb-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative flex-grow max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-gray-400" />
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search sermons..."
                className="w-full bg-gray-950 border border-white/10 rounded-2xl pl-10 pr-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#d32f2f]"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleSelectAllHidden}
                className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5"
              >
                <CheckSquare className="w-3.5 h-3.5 text-amber-400" />
                <span>Select All Hidden ({hiddenSermons.length})</span>
              </button>

              {hiddenSermons.length > 0 && (
                <button
                  type="button"
                  onClick={() => triggerConfirmModal('bulk_archive_hidden', undefined, undefined, hiddenSermons.length)}
                  disabled={saving}
                  className="bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5"
                  title="Bulk set all hidden sermons to Archived state"
                >
                  <Archive className="w-3.5 h-3.5 text-amber-400" />
                  <span>Archive All Hidden ({hiddenSermons.length})</span>
                </button>
              )}

              <div className="flex items-center space-x-2 bg-gray-950 p-1 rounded-xl border border-white/10 text-xs">
                <button
                  type="button"
                  onClick={() => setFilterPublished('all')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all ${filterPublished === 'all' ? 'bg-white/15 text-white' : 'text-gray-400'}`}
                >
                  All ({activeSermons.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterPublished('published')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all ${filterPublished === 'published' ? 'bg-emerald-500/20 text-emerald-300' : 'text-gray-400'}`}
                >
                  Published ({publishedSermons.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterPublished('draft')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all ${filterPublished === 'draft' ? 'bg-amber-500/20 text-amber-300' : 'text-gray-400'}`}
                >
                  Hidden ({hiddenSermons.length})
                </button>
              </div>
            </div>
          </div>

          {/* Active Bulk Selection Bar */}
          {selectedSermonIds.length > 0 && (
            <div className="bg-red-950/40 border border-red-500/30 p-3.5 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center space-x-2 font-bold text-red-200">
                <span className="bg-red-500/20 text-red-300 px-2.5 py-0.5 rounded-full border border-red-500/40 font-mono">
                  {selectedSermonIds.length} Selected
                </span>
                <span>Perform bulk actions on selected items</span>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setSelectedSermonIds([])}
                  className="bg-white/5 hover:bg-white/10 text-gray-300 px-3 py-1.5 rounded-xl border border-white/10 font-medium"
                >
                  Clear Selection
                </button>
                <button
                  type="button"
                  onClick={() => triggerConfirmModal('bulk_set_archived', undefined, undefined, selectedSermonIds.length)}
                  disabled={saving}
                  className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 px-3.5 py-1.5 rounded-xl font-bold transition-all flex items-center space-x-1.5"
                >
                  <Archive className="w-3.5 h-3.5 text-amber-400" />
                  <span>Archive Selected ({selectedSermonIds.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => triggerConfirmModal('bulk_delete', undefined, undefined, selectedSermonIds.length)}
                  disabled={saving}
                  className="bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 px-3.5 py-1.5 rounded-xl font-bold transition-all flex items-center space-x-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-400" />
                  <span>Delete Selected ({selectedSermonIds.length})</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Table */}
        {loadingSermons ? (
          <div className="text-center py-12 text-gray-400 space-y-2">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#d32f2f]" />
            <p className="text-xs font-bold uppercase tracking-wider">Loading sermon collateral...</p>
          </div>
        ) : filteredSermons.length === 0 ? (
          <div className="text-center py-12 text-gray-400 bg-gray-950/50 rounded-2xl border border-white/5 space-y-3">
            <Headphones className="w-10 h-10 text-gray-600 mx-auto" />
            <p className="text-xs font-bold uppercase text-gray-300">No cataloged sermons found</p>
            <button
              onClick={openNewSermonModal}
              className="bg-[#d32f2f] hover:bg-red-700 text-white text-xs font-bold px-4 py-2 rounded-xl"
            >
              Create First Sermon Record
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-[11px] font-black uppercase tracking-wider text-gray-400 bg-gray-950/60">
                  <th className="py-3 px-3 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={
                        filteredSermons.length > 0 &&
                        filteredSermons.every((s) => s.id && selectedSermonIds.includes(s.id))
                      }
                      onChange={() => {
                        const visibleIds = filteredSermons.map((s) => s.id).filter(Boolean) as string[];
                        const allSelected = visibleIds.every((id) => selectedSermonIds.includes(id));
                        if (allSelected) {
                          setSelectedSermonIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
                        } else {
                          setSelectedSermonIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
                        }
                      }}
                      className="rounded bg-gray-900 border-white/20 text-[#d32f2f] focus:ring-[#d32f2f] w-4 h-4 cursor-pointer"
                      title="Select / Deselect Visible Rows"
                    />
                  </th>
                  <th className="py-3 px-4">Sermon Title & Theme</th>
                  <th className="py-3 px-4">Speaker</th>
                  <th className="py-3 px-4">Sermon Date</th>
                  <th className="py-3 px-4">Front-End Availability</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs">
                {filteredSermons.map((sermon) => {
                  const isSelected = sermon.id ? selectedSermonIds.includes(sermon.id) : false;

                  return (
                    <tr 
                      key={sermon.id} 
                      className={`transition-colors ${isSelected ? 'bg-red-950/30' : 'hover:bg-white/[0.02]'}`}
                    >
                      <td className="py-4 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => sermon.id && handleToggleSelectSermon(sermon.id)}
                          className="rounded bg-gray-900 border-white/20 text-[#d32f2f] focus:ring-[#d32f2f] w-4 h-4 cursor-pointer"
                        />
                      </td>
                    
                    <td className="py-4 px-4 font-bold text-white">
                      <div className="text-sm">
                        <span>{sermon.title}</span>
                      </div>
                      <div className="text-[10px] text-gray-400 font-normal flex flex-wrap items-center gap-1.5 pt-0.5">
                        <span className="bg-red-500/10 text-red-400 px-2 py-0.5 rounded border border-red-500/20 font-bold uppercase">
                          {sermon.theme || 'Knowing God'}
                        </span>
                        {sermon.driveFileName && (
                          <span className="bg-amber-500/10 text-amber-300 px-2 py-0.5 rounded border border-amber-500/20 font-mono" title="Linked Google Drive File Name">
                            📁 {sermon.driveFileName}
                          </span>
                        )}
                        {sermon.series && <span>Series: {sermon.series}</span>}
                      </div>
                    </td>

                    <td className="py-4 px-4 text-gray-300 font-medium">
                      {sermon.speaker || '—'}
                    </td>

                    <td className="py-4 px-4 font-mono text-gray-300">
                      {sermon.sermonDate || '—'}
                    </td>

                    {/* Quick Toggle Checkbox for Front-End Availability */}
                    <td className="py-4 px-4">
                      <button
                        type="button"
                        onClick={() => handleTogglePublished(sermon)}
                        className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border transition-all ${
                          sermon.isPublished 
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' 
                            : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                        }`}
                      >
                        {sermon.isPublished ? (
                          <>
                            <Eye className="w-3 h-3 text-emerald-400" />
                            <span>✓ Available on Front End</span>
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-3 h-3 text-amber-400" />
                            <span>Hidden / Draft</span>
                          </>
                        )}
                      </button>
                    </td>

                    <td className="py-4 px-4 text-right space-x-2">
                      <button
                        onClick={() => openEditModal(sermon)}
                        className="bg-white/5 hover:bg-white/10 text-gray-200 p-2 rounded-xl border border-white/10 transition-all"
                        title="Edit Sermon Metadata"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => triggerConfirmModal('delete_single', sermon.id, sermon.title)}
                        className="bg-red-500/10 hover:bg-red-500/20 text-red-400 p-2 rounded-xl border border-red-500/20 transition-all cursor-pointer"
                        title="Delete Record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>

                  </tr>
                );
              })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Form for Add/Edit Sermon Metadata */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-gray-900 border border-white/10 rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative my-8">
            
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h3 className="text-xl font-black text-white uppercase tracking-tight flex items-center space-x-2">
                <Headphones className="w-5 h-5 text-red-400" />
                <span>{editingSermon ? 'Edit Sermon Metadata' : 'Associate Sermon Metadata'}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-white p-2 rounded-xl bg-white/5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSermon} className="space-y-4 text-xs">
              
              {/* 1. Website Display Title & Google Drive Exact File Name */}
              <div className="bg-gray-950 p-4 rounded-2xl border border-white/10 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-red-400 font-bold uppercase tracking-wider mb-1">
                      1. Website Display Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Knowing God Intimately"
                      className="w-full bg-gray-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#d32f2f]"
                    />
                    <p className="text-[10px] text-gray-400 mt-1">
                      The customized title shown to visitors on the website. You can change this anytime without breaking playback!
                    </p>
                  </div>

                  <div>
                    <label className="block text-amber-400 font-bold uppercase tracking-wider mb-1">
                      2. Exact Google Drive File Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={driveFileName}
                      onChange={(e) => {
                        const newFileName = e.target.value;
                        setDriveFileName(newFileName);
                        const matched = driveFiles.find(f => f.name.trim().toLowerCase() === newFileName.trim().toLowerCase());
                        if (matched) {
                          setDriveFileId(matched.id);
                          setAudioUrl(`/api/drive/stream/${matched.id}`);
                        }
                      }}
                      placeholder="e.g. 2026_06_07_Knowing_God.mp3"
                      className="w-full bg-gray-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-white font-mono placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                    <p className="text-[10px] text-gray-400 mt-1">
                      Exact filename on Google Drive used to create the audio stream & download relationship.
                    </p>
                  </div>
                </div>

                {/* Optional Google Drive Picker Dropdown */}
                {driveFiles.length > 0 && (
                  <div>
                    <label className="block text-[11px] text-gray-400 font-bold uppercase tracking-wider mb-1">
                      Quick Pick from tccmedia123 Google Drive Folder:
                    </label>
                    <select
                      value={driveFileId}
                      onChange={(e) => {
                        const selectedFile = driveFiles.find(f => f.id === e.target.value);
                        if (selectedFile) {
                          setDriveFileId(selectedFile.id);
                          setDriveFileName(selectedFile.name);
                          setAudioUrl(`/api/drive/stream/${selectedFile.id}`);
                        }
                      }}
                      className="w-full bg-gray-900 border border-white/10 rounded-xl px-3 py-2 text-gray-300 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="">-- Select File from Google Drive --</option>
                      {driveFiles.map((file) => (
                        <option key={file.id} value={file.id}>
                          {file.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Speaker Name & Sermon Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-300 font-bold uppercase tracking-wider mb-1">
                    Speaker Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={speaker}
                    onChange={(e) => setSpeaker(e.target.value)}
                    placeholder="e.g. Pastor Leon Louw"
                    className="w-full bg-gray-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#d32f2f]"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 font-bold uppercase tracking-wider mb-1">
                    Sermon Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={sermonDate}
                    onChange={(e) => setSermonDate(e.target.value)}
                    className="w-full bg-gray-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-[#d32f2f]"
                  />
                </div>
              </div>

              {/* Category / Theme */}
              <div>
                <label className="block text-gray-300 font-bold uppercase tracking-wider mb-1">
                  Theme / Category
                </label>
                <input
                  type="text"
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  placeholder="e.g. Knowing God, Faith, Grace"
                  className="w-full bg-gray-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#d32f2f]"
                />
              </div>

              {/* Series Name */}
              <div>
                <label className="block text-gray-300 font-bold uppercase tracking-wider mb-1">
                  Series Name (Optional)
                </label>
                <input
                  type="text"
                  value={series}
                  onChange={(e) => setSeries(e.target.value)}
                  placeholder="e.g. Kingdom Foundations"
                  className="w-full bg-gray-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#d32f2f]"
                />
              </div>

              {/* Audio URL & Download Link */}
              <div className="space-y-3 pt-2 border-t border-white/10">
                <div>
                  <label className="block text-gray-300 font-bold uppercase tracking-wider mb-1">
                    Audio Playable Stream URL / Google Drive Link
                  </label>
                  <input
                    type="text"
                    value={audioUrl}
                    onChange={(e) => setAudioUrl(e.target.value)}
                    placeholder="https://docs.google.com/uc?export=open&id=..."
                    className="w-full bg-gray-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-white font-mono placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#d32f2f]"
                  />
                </div>

                {driveFileId && (
                  <div className="bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-xl text-gray-300 text-[11px] font-mono">
                    Linked Google Drive File ID: <strong className="text-amber-400">{driveFileId}</strong>
                  </div>
                )}
              </div>

              {/* Description & Scripture */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-300 font-bold uppercase tracking-wider mb-1">
                    Scripture Reference
                  </label>
                  <input
                    type="text"
                    value={scripture}
                    onChange={(e) => setScripture(e.target.value)}
                    placeholder="e.g. John 17:3, Jeremiah 29:13"
                    className="w-full bg-gray-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#d32f2f]"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 font-bold uppercase tracking-wider mb-1">
                    Description / Summary
                  </label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief summary of the sermon message..."
                    className="w-full bg-gray-950 border border-white/10 rounded-xl px-3.5 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#d32f2f]"
                  />
                </div>
              </div>

              {/* Checkbox: Front-End Availability */}
              <div className={`border p-4 rounded-2xl flex items-center justify-between ${editingSermon?.isArchived || editingSermon?.title === 'Archived' || editingSermon?.status === 'Archived' ? 'bg-gray-900 border-gray-800 opacity-70' : 'bg-gray-950 border-white/10'}`}>
                <div>
                  <span className="font-black uppercase tracking-wider text-white flex items-center space-x-2">
                    <span>Make Available on Front End</span>
                    {(editingSermon?.isArchived || editingSermon?.title === 'Archived' || editingSermon?.status === 'Archived') && (
                      <span className="text-[10px] bg-red-500/20 text-red-300 px-2 py-0.5 rounded border border-red-500/30">
                        Locked (Archived)
                      </span>
                    )}
                  </span>
                  <span className="text-gray-400 text-[11px] block">
                    {(editingSermon?.isArchived || editingSermon?.title === 'Archived' || editingSermon?.status === 'Archived')
                      ? "🔒 Archived items cannot be enabled on the front end. All metadata has been removed."
                      : "Check this box to allow website visitors to listen and download this sermon."}
                  </span>
                </div>

                <label className={`relative inline-flex items-center ${(editingSermon?.isArchived || editingSermon?.title === 'Archived' || editingSermon?.status === 'Archived') ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
                  <input
                    type="checkbox"
                    checked={(editingSermon?.isArchived || editingSermon?.title === 'Archived' || editingSermon?.status === 'Archived') ? false : isPublished}
                    disabled={Boolean(editingSermon?.isArchived || editingSermon?.title === 'Archived' || editingSermon?.status === 'Archived')}
                    onChange={(e) => setIsPublished(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              {/* Status Message */}
              {statusMsg && (
                <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
                  {statusMsg}
                </div>
              )}

              {/* Submit Buttons */}
              <div className="pt-2 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="bg-white/5 hover:bg-white/10 text-gray-300 font-bold px-4 py-2.5 rounded-xl border border-white/10"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="bg-[#d32f2f] hover:bg-red-700 text-white font-black uppercase tracking-wider px-6 py-2.5 rounded-xl shadow-lg disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingSermon ? 'Update Sermon' : 'Save & Publish'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-white/10 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl relative">
            
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-black text-white uppercase tracking-tight flex items-center space-x-2">
                <AlertCircle className={`w-5 h-5 ${confirmModal.type === 'purge_db' || confirmModal.type === 'delete_single' || confirmModal.type === 'bulk_delete' ? 'text-red-400' : 'text-amber-400'}`} />
                <span>
                  {confirmModal.type === 'delete_single' && 'Delete Sermon Record'}
                  {confirmModal.type === 'bulk_delete' && 'Delete Selected Sermons'}
                  {confirmModal.type === 'bulk_set_archived' && 'Archive Selected Sermons'}
                  {confirmModal.type === 'bulk_archive_hidden' && 'Archive All Hidden Sermons'}
                  {confirmModal.type === 'purge_db' && '⚠️ Permanent Database Purge'}
                </span>
              </h3>
              <button
                type="button"
                onClick={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
                className="text-gray-400 hover:text-white p-1.5 rounded-xl bg-white/5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-gray-300 leading-relaxed">
              {confirmModal.type === 'delete_single' && (
                <p>
                  Are you sure you want to permanently delete <strong className="text-white">"{confirmModal.targetTitle}"</strong> from the Firestore database?
                </p>
              )}

              {confirmModal.type === 'bulk_delete' && (
                <p>
                  Are you sure you want to permanently delete all <strong className="text-white">{selectedSermonIds.length}</strong> selected sermon record(s) from Firestore?
                </p>
              )}

              {confirmModal.type === 'bulk_set_archived' && (
                <p>
                  Are you sure you want to set the <strong className="text-white">{selectedSermonIds.length}</strong> selected sermon(s) to Archived state? Metadata will be cleared and the items removed from the collateral list.
                </p>
              )}

              {confirmModal.type === 'bulk_archive_hidden' && (
                <p>
                  Are you sure you want to archive all <strong className="text-white">{hiddenSermons.length}</strong> hidden sermon(s)?
                </p>
              )}

              {confirmModal.type === 'purge_db' && (
                <div className="space-y-3">
                  <p className="bg-red-500/10 text-red-300 border border-red-500/30 p-3 rounded-xl font-medium">
                    ⚠️ <strong>WARNING:</strong> This will PERMANENTLY DELETE ALL <strong className="text-white font-mono">{sermonsList.length}</strong> sermon document(s) in your Firestore database!
                  </p>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-300 mb-1">
                      Type <strong className="text-red-400">PURGE</strong> in all caps to confirm:
                    </label>
                    <input
                      type="text"
                      value={purgeInputText}
                      onChange={(e) => setPurgeInputText(e.target.value)}
                      placeholder="Type PURGE"
                      className="w-full bg-gray-950 border border-white/10 rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="pt-2 flex items-center justify-end space-x-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
                className="bg-white/5 hover:bg-white/10 text-gray-300 font-bold px-4 py-2 rounded-xl text-xs border border-white/10"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={saving || (confirmModal.type === 'purge_db' && purgeInputText !== 'PURGE')}
                onClick={handleExecuteConfirmedAction}
                className={`font-black uppercase tracking-wider px-5 py-2 rounded-xl text-xs shadow-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                  confirmModal.type === 'bulk_set_archived' || confirmModal.type === 'bulk_archive_hidden'
                    ? 'bg-amber-500 hover:bg-amber-600 text-black'
                    : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
              >
                {saving ? 'Processing...' : confirmModal.type === 'purge_db' ? 'PURGE DATABASE' : 'Confirm Action'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default WebsiteCollateralManager;
