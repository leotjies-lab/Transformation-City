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
import { safeFetchJson } from '../utils/apiHelper';
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
  Archive,
  FileText,
  Video,
  FileDown,
  Paperclip
} from 'lucide-react';

interface WebsiteCollateralManagerProps {
  adminEmail: string;
}

const GOOGLE_DRIVE_FOLDER_ID = "1qi4li-RY2flBnRt6wLfnpXpu4JeY_yVM";
const GOOGLE_DRIVE_FOLDER_URL = `https://drive.google.com/drive/folders/${GOOGLE_DRIVE_FOLDER_ID}`;

// Helper to extract YouTube embed URL or ID
export const getYouTubeVideoId = (url?: string): string | null => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

const WebsiteCollateralManager: React.FC<WebsiteCollateralManagerProps> = ({ adminEmail }) => {
  const [sermonsList, setSermonsList] = useState<Sermon[]>([]);
  const [loadingSermons, setLoadingSermons] = useState(true);

  // Google Drive state
  const [driveFiles, setDriveFiles] = useState<DriveAudioFile[]>([]);
  const [loadingDrive, setLoadingDrive] = useState(false);
  const [driveError, setDriveError] = useState('');
  const [driveSuccess, setDriveSuccess] = useState('');
  const [driveFilter, setDriveFilter] = useState<'uncataloged' | 'all' | 'cataloged' | 'notes'>('uncataloged');

  // Separate Drive Audio Files and Notes Files
  const driveAudioFiles = useMemo(() => {
    return driveFiles.filter(f => f.isAudio || f.fileCategory === 'audio' || (!f.isNotes && f.name.match(/\.(mp3|m4a|wav|aac|ogg|wma)$/i)));
  }, [driveFiles]);

  const driveNotesFiles = useMemo(() => {
    return driveFiles.filter(f => f.isNotes || f.fileCategory === 'notes' || f.name.match(/\.(pdf|docx?|txt|pptx?|rtf)$/i));
  }, [driveFiles]);

  // Helper to determine if a Google Drive audio file is already cataloged in Firestore
  const isDriveFileCataloged = (file: DriveAudioFile, sermons: Sermon[]): boolean => {
    return sermons.some((sermon) => {
      // Ignore archived items so their Drive files become uncataloged
      if (sermon.isArchived || sermon.status === 'Archived' || sermon.title === 'Archived') return false;

      // 1. Direct ID match
      if (sermon.driveFileId && sermon.driveFileId === file.id) return true;
      if (sermon.audioUrl && sermon.audioUrl.includes(file.id)) return true;
      if (sermon.downloadUrl && sermon.downloadUrl.includes(file.id)) return true;
      if (sermon.notesDriveFileId && sermon.notesDriveFileId === file.id) return true;
      
      // 2. Exact drive filename match
      if (sermon.driveFileName && sermon.driveFileName.trim().toLowerCase() === file.name.trim().toLowerCase()) return true;
      if (sermon.notesFileName && sermon.notesFileName.trim().toLowerCase() === file.name.trim().toLowerCase()) return true;

      // 3. Normalized filename vs title exact equality comparison
      const cleanFileName = file.name
        .replace(/\.[^/.]+$/, "") // strip extension (.mp3, .pdf)
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

  // Find which active sermon is already attached to a notes file
  const getSermonAttachedToNotesFile = (file: DriveAudioFile): Sermon | undefined => {
    return sermonsList.find((s) => {
      if (s.isArchived || s.status === 'Archived' || s.title === 'Archived') return false;
      if (s.notesDriveFileId && s.notesDriveFileId === file.id) return true;
      if (s.notesFileName && s.notesFileName.trim().toLowerCase() === file.name.trim().toLowerCase()) return true;
      return false;
    });
  };

  const uncatalogedDriveFiles = useMemo(() => {
    return driveAudioFiles.filter((file) => !isDriveFileCataloged(file, sermonsList));
  }, [driveAudioFiles, sermonsList]);

  const catalogedDriveFiles = useMemo(() => {
    return driveAudioFiles.filter((file) => isDriveFileCataloged(file, sermonsList));
  }, [driveAudioFiles, sermonsList]);

  const displayedDriveFiles = useMemo(() => {
    if (driveFilter === 'uncataloged') return uncatalogedDriveFiles;
    if (driveFilter === 'cataloged') return catalogedDriveFiles;
    if (driveFilter === 'notes') return driveNotesFiles;
    return driveFiles;
  }, [driveFilter, uncatalogedDriveFiles, catalogedDriveFiles, driveNotesFiles, driveFiles]);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPublished, setFilterPublished] = useState<'all' | 'published' | 'draft'>('all');

  // Multi-select state for bulk actions
  const [selectedSermonIds, setSelectedSermonIds] = useState<string[]>([]);

  // Notes Direct Selection Modals
  const [selectNotesForSermon, setSelectNotesForSermon] = useState<Sermon | null>(null);
  const [attachNotesModalFile, setAttachNotesModalFile] = useState<DriveAudioFile | null>(null);
  const [selectedTargetSermonId, setSelectedTargetSermonId] = useState<string>('');

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
  // YouTube integration
  const [youtubeUrl, setYoutubeUrl] = useState('');
  // Sermon notes integration
  const [notesDriveFileId, setNotesDriveFileId] = useState('');
  const [notesFileName, setNotesFileName] = useState('');
  const [notesUrl, setNotesUrl] = useState('');
  const [notesFileType, setNotesFileType] = useState('pdf');
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

  // Fetch audio and notes files from Google Drive backend API
  const fetchDriveFiles = async () => {
    setLoadingDrive(true);
    setDriveError('');
    try {
      let res = await safeFetchJson(`/api/drive/files?folderId=${GOOGLE_DRIVE_FOLDER_ID}`);
      
      if (!res.ok) {
        // Try direct PHP proxy fallback if running on PHP/Hostinger environment
        res = await safeFetchJson(`/drive-proxy.php?action=files&folderId=${GOOGLE_DRIVE_FOLDER_ID}`);
      }

      if (res.ok && res.data?.success && Array.isArray(res.data.files)) {
        const files: DriveAudioFile[] = res.data.files;
        setDriveFiles(files);
        setDriveSuccess(res.data.message || `Loaded ${files.length} file(s) from Google Drive`);
        if (sermonsList.length > 0) {
          syncAndAutoHideMissingDriveFiles(files, sermonsList);
        }
      } else {
        const errMsg = res.error || res.data?.error || 'Unable to load files from Google Drive folder.';
        setDriveError(errMsg);
      }
    } catch (err: any) {
      console.warn('Drive files fetch error:', err);
      setDriveError(err.message || 'Error communicating with Google Drive server route.');
    } finally {
      setLoadingDrive(false);
    }
  };

  useEffect(() => {
    fetchDriveFiles();
  }, []);

  // Helper to find a matching notes file for an audio file (or vice versa) in Google Drive
  const findCompanionNotesFile = (audioFileName: string): DriveAudioFile | undefined => {
    if (!audioFileName) return undefined;
    const dateMatch = audioFileName.match(/(20\d{2})[-_](0[1-9]|1[0-2])[-_](0[1-9]|[12]\d|3[01])/);
    const audioClean = audioFileName.replace(/\.[^/.]+$/, '').toLowerCase().replace(/[-_]/g, ' ');

    return driveNotesFiles.find(nFile => {
      // 1. Check matching date
      if (dateMatch && nFile.name.includes(dateMatch[0])) return true;
      // 2. Check matching title words
      const notesClean = nFile.name.replace(/\.[^/.]+$/, '').toLowerCase().replace(/[-_]/g, ' ');
      if (notesClean.includes('notes') && audioClean.split(' ').some(w => w.length > 4 && notesClean.includes(w))) return true;
      return false;
    });
  };

  // Pre-fill modal form from selected Google Drive File
  const handleSelectDriveFile = (file: DriveAudioFile) => {
    setEditingSermon(null);

    if (file.isNotes || file.fileCategory === 'notes' || file.name.match(/\.(pdf|docx?|txt|pptx?)$/i)) {
      // It's a notes file!
      setNotesDriveFileId(file.id);
      setNotesFileName(file.name);
      setNotesUrl(`https://drive.google.com/file/d/${file.id}/view?usp=sharing`);
      setNotesFileType(file.name.toLowerCase().endsWith('.docx') ? 'docx' : file.name.toLowerCase().endsWith('.doc') ? 'doc' : file.name.toLowerCase().endsWith('.txt') ? 'txt' : 'pdf');

      // Check if there's a companion audio file in Drive
      const dateMatch = file.name.match(/(20\d{2})[-_](0[1-9]|1[0-2])[-_](0[1-9]|[12]\d|3[01])/);
      const companionAudio = driveAudioFiles.find(aFile => dateMatch && aFile.name.includes(dateMatch[0]));
      if (companionAudio) {
        setDriveFileId(companionAudio.id);
        setDriveFileName(companionAudio.name);
        setAudioUrl(`https://docs.google.com/uc?export=open&id=${companionAudio.id}`);
        setDownloadUrl(`https://drive.google.com/uc?export=download&id=${companionAudio.id}`);
      } else {
        setDriveFileId('');
        setDriveFileName('');
        setAudioUrl('');
        setDownloadUrl('');
      }

      const cleanDisplayTitle = file.name
        .replace(/\.[^/.]+$/, "")
        .replace(/^(20\d{2})[-_](0[1-9]|1[0-2])[-_](0[1-9]|[12]\d|3[01])[-_]?/i, "")
        .replace(/(sermon|notes|study)/gi, "")
        .replace(/[-_]/g, " ")
        .replace(/\s+/g, " ")
        .trim();

      setTitle(cleanDisplayTitle || file.name);
      setSermonDate(file.createdTime ? file.createdTime.split('T')[0] : new Date().toISOString().split('T')[0]);
    } else {
      // It's an audio file
      setDriveFileId(file.id);
      setDriveFileName(file.name);

      // Direct Google Drive playback/download links
      const streamProxyUrl = `https://docs.google.com/uc?export=open&id=${file.id}`;
      const directDlUrl = `https://drive.google.com/uc?export=download&id=${file.id}`;
      setAudioUrl(streamProxyUrl);
      setDownloadUrl(directDlUrl);

      // Check for companion notes in the same folder!
      const companionNotes = findCompanionNotesFile(file.name);
      if (companionNotes) {
        setNotesDriveFileId(companionNotes.id);
        setNotesFileName(companionNotes.name);
        setNotesUrl(`https://drive.google.com/file/d/${companionNotes.id}/view?usp=sharing`);
        setNotesFileType(companionNotes.name.toLowerCase().endsWith('.docx') ? 'docx' : 'pdf');
      } else {
        setNotesDriveFileId('');
        setNotesFileName('');
        setNotesUrl('');
      }

      // Derive clean display title from file name (stripping dates and extension)
      const cleanDisplayTitle = file.name
        .replace(/\.[^/.]+$/, "")
        .replace(/^(20\d{2})[-_](0[1-9]|1[0-2])[-_](0[1-9]|[12]\d|3[01])[-_]?/i, "")
        .replace(/[-_]/g, " ")
        .replace(/\s+/g, " ")
        .trim();

      setTitle(cleanDisplayTitle || file.name);
      setSermonDate(file.createdTime ? file.createdTime.split('T')[0] : new Date().toISOString().split('T')[0]);
    }

    setYoutubeUrl('');
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
    setYoutubeUrl('');
    setNotesDriveFileId('');
    setNotesFileName('');
    setNotesUrl('');
    setNotesFileType('pdf');
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
    setYoutubeUrl(sermon.youtubeUrl || '');
    setNotesDriveFileId(sermon.notesDriveFileId || '');
    setNotesFileName(sermon.notesFileName || '');
    setNotesUrl(sermon.notesUrl || '');
    setNotesFileType(sermon.notesFileType || 'pdf');
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
      const payload: Partial<Sermon> = {
        title: title.trim(),
        speaker: speaker.trim() || 'Pastor Leon Louw',
        sermonDate,
        theme: theme.trim() || 'Knowing God',
        series: series.trim() || '',
        audioLength: audioLength.trim() || '45:00',
        description: description.trim() || '',
        scripture: scripture.trim() || '',
        audioUrl: audioUrl.trim() || (driveFileId ? `https://docs.google.com/uc?export=open&id=${driveFileId}` : ''),
        downloadUrl: downloadUrl.trim() || (driveFileId ? `https://drive.google.com/uc?export=download&id=${driveFileId}` : ''),
        driveFileId: driveFileId.trim(),
        driveFileName: driveFileName.trim(),
        driveWebViewLink: GOOGLE_DRIVE_FOLDER_URL,
        // YouTube video URL
        youtubeUrl: youtubeUrl.trim(),
        // Sermon notes
        notesDriveFileId: notesDriveFileId.trim(),
        notesFileName: notesFileName.trim(),
        notesUrl: notesUrl.trim() || (notesDriveFileId ? `https://drive.google.com/file/d/${notesDriveFileId}/view?usp=sharing` : ''),
        notesDownloadUrl: notesDriveFileId ? `https://drive.google.com/uc?export=download&id=${notesDriveFileId}` : notesUrl.trim(),
        notesFileType: notesFileType || (notesFileName.toLowerCase().endsWith('.docx') ? 'docx' : 'pdf'),
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

  // Quick attach notes to a specific sermon directly
  const handleQuickAttachNotes = async (sermonId: string, notesFile: DriveAudioFile) => {
    setSaving(true);
    setStatusMsg('');
    try {
      const fileExt = notesFile.name.toLowerCase().endsWith('.docx') ? 'docx' : notesFile.name.toLowerCase().endsWith('.doc') ? 'doc' : notesFile.name.toLowerCase().endsWith('.txt') ? 'txt' : 'pdf';
      await updateDoc(doc(db, 'sermons', sermonId), {
        notesDriveFileId: notesFile.id,
        notesFileName: notesFile.name,
        notesUrl: `/api/drive/notes/view/${notesFile.id}?filename=${encodeURIComponent(notesFile.name)}`,
        notesDownloadUrl: `/api/drive/notes/download/${notesFile.id}?filename=${encodeURIComponent(notesFile.name)}`,
        notesFileType: fileExt,
        updatedAt: new Date().toISOString()
      });
      setStatusMsg(`Successfully attached notes "${notesFile.name}" to sermon.`);
      setSelectNotesForSermon(null);
      setAttachNotesModalFile(null);
      setSelectedTargetSermonId('');
    } catch (err: any) {
      console.error('Error attaching notes:', err);
      setStatusMsg(`Failed to attach notes: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Quick detach notes from a sermon
  const handleQuickDetachNotes = async (sermonId: string) => {
    setSaving(true);
    setStatusMsg('');
    try {
      await updateDoc(doc(db, 'sermons', sermonId), {
        notesDriveFileId: '',
        notesFileName: '',
        notesUrl: '',
        notesDownloadUrl: '',
        notesFileType: 'pdf',
        updatedAt: new Date().toISOString()
      });
      setStatusMsg('Successfully detached notes from sermon.');
    } catch (err: any) {
      console.error('Error detaching notes:', err);
      setStatusMsg(`Failed to detach notes: ${err.message}`);
    } finally {
      setSaving(false);
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
    youtubeUrl: '',
    notesDriveFileId: '',
    notesFileName: '',
    notesUrl: '',
    notesDownloadUrl: '',
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

  // Filtered Active Sermons
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

  const parsedYoutubeId = useMemo(() => getYouTubeVideoId(youtubeUrl), [youtubeUrl]);

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
                <span>Website Media, Sermons & Collateral</span>
              </div>
              <h2 className="text-2xl font-black text-white uppercase tracking-tight">
                Manage Website Collateral & Sermons
              </h2>
              <p className="text-xs text-gray-300 max-w-2xl leading-relaxed font-normal">
                Catalog audio recordings and sermon notes from Google Drive <strong className="text-white font-mono">(tccmedia123@gmail.com)</strong>, attach YouTube video links, set sermon metadata, and control front-end availability.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Create New Sermon Button */}
            <button
              onClick={openNewSermonModal}
              className="bg-[#d32f2f] hover:bg-red-700 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center space-x-2 shadow-lg cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Sermon</span>
            </button>

            {/* Direct Link to Google Drive */}
            <a
              href={GOOGLE_DRIVE_FOLDER_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center space-x-2 shadow-lg"
            >
              <HardDrive className="w-4 h-4 text-amber-400" />
              <span>Open Google Drive</span>
              <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
            </a>
          </div>
        </div>
      </div>

      {/* Google Drive Folder Files Listing (Audio & Notes) */}
      <div className="bg-gray-900 border border-white/10 rounded-3xl p-6 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 w-full">
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center space-x-2">
                <FolderKey className="w-4 h-4 text-amber-400" />
                <span>Google Drive Media & Notes Folder</span>
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
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all text-[11px] flex items-center space-x-1 ${
                    driveFilter === 'uncataloged'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Headphones className="w-3 h-3 text-amber-400" />
                  <span>Uncataloged Audio ({uncatalogedDriveFiles.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDriveFilter('notes')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all text-[11px] flex items-center space-x-1 ${
                    driveFilter === 'notes'
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <FileText className="w-3 h-3 text-blue-400" />
                  <span>Sermon Notes ({driveNotesFiles.length})</span>
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
                  Cataloged Audio ({catalogedDriveFiles.length})
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
                  ? `Showing ${uncatalogedDriveFiles.length} uncataloged audio file(s) out of ${driveAudioFiles.length}`
                  : driveFilter === 'notes'
                  ? `Found ${driveNotesFiles.length} sermon notes document(s) (PDF / Docs) in Drive`
                  : driveFilter === 'cataloged'
                  ? `Showing ${catalogedDriveFiles.length} cataloged audio file(s)`
                  : `Loaded ${driveFiles.length} total file(s) from tccmedia123 Google Drive`}
              </span>
            </div>
            {driveNotesFiles.length > 0 && (
              <span className="text-[10px] text-blue-300 font-mono bg-blue-500/20 px-2 py-0.5 rounded border border-blue-500/30">
                📄 {driveNotesFiles.length} Notes Doc(s) Available
              </span>
            )}
          </div>
        )}

        {displayedDriveFiles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
            {displayedDriveFiles.map((file) => {
              const isNotesFile = file.isNotes || file.fileCategory === 'notes' || file.name.match(/\.(pdf|docx?|txt|pptx?)$/i);
              const cataloged = isDriveFileCataloged(file, sermonsList);
              const attachedSermon = isNotesFile ? getSermonAttachedToNotesFile(file) : undefined;

              return (
                <div 
                  key={file.id} 
                  className={`bg-gray-950 border rounded-2xl p-4 space-y-2 transition-all flex flex-col justify-between ${
                    attachedSermon || (!isNotesFile && cataloged)
                      ? 'border-emerald-500/20 opacity-85 hover:opacity-100' 
                      : isNotesFile
                      ? 'border-blue-500/20 hover:border-blue-500/40'
                      : 'border-white/10 hover:border-amber-500/40'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded border flex items-center space-x-1 ${
                        attachedSermon
                          ? 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30'
                          : isNotesFile
                          ? 'text-blue-300 bg-blue-500/10 border-blue-500/20'
                          : cataloged 
                          ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' 
                          : 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                      }`}>
                        {isNotesFile ? (
                          <>
                            <FileText className="w-2.5 h-2.5" />
                            <span>{attachedSermon ? '✓ NOTES ATTACHED' : 'SERMON NOTES'}</span>
                          </>
                        ) : cataloged ? (
                          <span>✓ CATALOGED AUDIO</span>
                        ) : (
                          <span>UNCATALOGED AUDIO</span>
                        )}
                      </span>
                      <span className="text-[10px] text-gray-400 font-mono">
                        {file.createdTime ? file.createdTime.split('T')[0] : 'Drive File'}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-white truncate pt-1">{file.name}</h4>
                    {attachedSermon && (
                      <p className="text-[10px] text-emerald-400 truncate pt-0.5">
                        Linked to: <strong>"{attachedSermon.title}"</strong>
                      </p>
                    )}
                  </div>

                  <div className="pt-2">
                    {isNotesFile ? (
                      attachedSermon ? (
                        <div className="flex items-center space-x-1.5">
                          <button
                            type="button"
                            onClick={() => openEditModal(attachedSermon)}
                            className="flex-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 py-1.5 rounded-xl text-xs font-bold transition-all text-center"
                          >
                            Edit Sermon
                          </button>
                          <a
                            href={`/api/drive/notes/view/${file.id}?filename=${encodeURIComponent(file.name)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-white/5 hover:bg-white/10 text-gray-300 p-1.5 rounded-xl border border-white/10 flex items-center justify-center"
                            title="Preview Notes"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                          {attachedSermon.id && (
                            <button
                              type="button"
                              onClick={() => attachedSermon.id && handleQuickDetachNotes(attachedSermon.id)}
                              className="bg-red-500/10 hover:bg-red-500/20 text-red-300 px-2 py-1.5 rounded-xl border border-red-500/30 text-[10px] font-bold"
                              title="Detach Notes"
                            >
                              Detach
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center space-x-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setAttachNotesModalFile(file);
                              setSelectedTargetSermonId(sermonsList.find(s => !s.isArchived)?.id || '');
                            }}
                            className="flex-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/30 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center space-x-1"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Select for Sermon</span>
                          </button>
                          <a
                            href={`/api/drive/notes/view/${file.id}?filename=${encodeURIComponent(file.name)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-white/5 hover:bg-white/10 text-gray-300 p-1.5 rounded-xl border border-white/10 flex items-center justify-center"
                            title="Preview Notes Document"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      )
                    ) : cataloged ? (
                      <div className="w-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center space-x-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Cataloged</span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSelectDriveFile(file)}
                        className="w-full py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center space-x-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Catalog as Sermon</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : driveFilter === 'uncataloged' && driveAudioFiles.length > 0 ? (
          <div className="text-center py-8 text-xs text-gray-300 bg-gray-950/60 rounded-2xl border border-emerald-500/20 p-6 space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
            <p className="text-sm font-bold text-white">All Google Drive Audio Files Are Cataloged!</p>
            <p className="text-gray-400 max-w-md mx-auto">
              All {driveAudioFiles.length} audio file(s) in the tccmedia123 Google Drive folder have already been cataloged into the sermon repository.
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDriveFilter('all')}
                className="inline-flex items-center space-x-1.5 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl border border-white/10 text-xs font-bold transition-all"
              >
                <span>View All Drive Files</span>
              </button>
              <button
                type="button"
                onClick={openNewSermonModal}
                className="inline-flex items-center space-x-1.5 bg-[#d32f2f] hover:bg-red-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Sermon Manually</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-6 text-xs text-gray-400 bg-gray-950/60 rounded-2xl border border-white/5 space-y-2">
            <p>
              Direct Google Drive folder integration active for <strong className="text-white">tccmedia123@gmail.com</strong>.
            </p>
            <p className="text-gray-500">
              Click <strong className="text-amber-400">"Open Google Drive"</strong> above or use <strong className="text-red-400">"Add New Sermon"</strong> to create a sermon record with YouTube, notes, or audio.
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
                placeholder="Search sermons by title, speaker, theme..."
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
                  <th className="py-3 px-4">Collateral & Media</th>
                  <th className="py-3 px-4">Front-End Availability</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs">
                {filteredSermons.map((sermon) => {
                  const isSelected = sermon.id ? selectedSermonIds.includes(sermon.id) : false;
                  const hasAudio = Boolean(sermon.audioUrl || sermon.driveFileId || sermon.driveFileName);
                  const hasYoutube = Boolean(sermon.youtubeUrl);
                  const hasNotes = Boolean(sermon.notesUrl || sermon.notesDriveFileId || sermon.notesFileName);

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
                      <div className="text-sm flex items-center space-x-2">
                        <span>{sermon.title}</span>
                      </div>
                      <div className="text-[10px] text-gray-400 font-normal flex flex-wrap items-center gap-1.5 pt-0.5">
                        <span className="bg-red-500/10 text-red-400 px-2 py-0.5 rounded border border-red-500/20 font-bold uppercase">
                          {sermon.theme || 'Knowing God'}
                        </span>
                        {sermon.series && <span>Series: {sermon.series}</span>}
                      </div>
                    </td>

                    <td className="py-4 px-4 text-gray-300 font-medium">
                      {sermon.speaker || '—'}
                    </td>

                    <td className="py-4 px-4 font-mono text-gray-300">
                      {sermon.sermonDate || '—'}
                    </td>

                    {/* Collateral & Media Indicators */}
                    <td className="py-4 px-4">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {/* Audio Badge */}
                        {hasAudio ? (
                          <span 
                            className="inline-flex items-center space-x-1 bg-amber-500/10 text-amber-300 border border-amber-500/20 px-2 py-0.5 rounded text-[10px] font-mono"
                            title={sermon.driveFileName || 'Audio Stream'}
                          >
                            <Headphones className="w-2.5 h-2.5 text-amber-400" />
                            <span>Audio</span>
                          </span>
                        ) : (
                          <span className="text-gray-500 text-[10px]">No Audio</span>
                        )}

                        {/* YouTube Badge */}
                        {hasYoutube && (
                          <a
                            href={sermon.youtubeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center space-x-1 bg-red-600/15 hover:bg-red-600/25 text-red-300 border border-red-500/30 px-2 py-0.5 rounded text-[10px] font-mono transition-colors"
                            title="Open YouTube Video"
                          >
                            <Video className="w-3 h-3 text-red-400" />
                            <span>YouTube</span>
                          </a>
                        )}

                        {/* Sermon Notes Badge or Add Notes Button */}
                        {hasNotes ? (
                          <div 
                            className="inline-flex items-center space-x-1 bg-blue-500/15 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded text-[10px] font-mono"
                            title={sermon.notesFileName || 'Sermon Notes Document'}
                          >
                            <FileText className="w-2.5 h-2.5 text-blue-400" />
                            <span className="truncate max-w-[90px]">{sermon.notesFileName || `Notes (${sermon.notesFileType?.toUpperCase() || 'PDF'})`}</span>
                            <a
                              href={sermon.notesDriveFileId ? `/api/drive/notes/view/${sermon.notesDriveFileId}?filename=${encodeURIComponent(sermon.notesFileName || 'notes.pdf')}` : (sermon.notesFileName ? `/api/drive/notes/view-by-name?filename=${encodeURIComponent(sermon.notesFileName)}` : sermon.notesUrl)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-300 hover:text-white p-0.5 rounded hover:bg-blue-500/20"
                              title="Preview Notes Document"
                            >
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                            <button
                              type="button"
                              onClick={() => setSelectNotesForSermon(sermon)}
                              className="text-blue-400 hover:text-white underline text-[9px] cursor-pointer ml-0.5"
                              title="Change attached notes"
                            >
                              Change
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setSelectNotesForSermon(sermon)}
                            className="inline-flex items-center space-x-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded text-[10px] font-mono transition-colors cursor-pointer"
                            title="Select and attach sermon notes document from Google Drive"
                          >
                            <Plus className="w-2.5 h-2.5 text-blue-400" />
                            <span>+ Notes</span>
                          </button>
                        )}
                      </div>
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
                            <span>✓ Available</span>
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
                        title="Edit Sermon & Collateral Metadata"
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
                <span>{editingSermon ? 'Edit Sermon & Collateral' : 'Catalog New Sermon & Collateral'}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-white p-2 rounded-xl bg-white/5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSermon} className="space-y-4 text-xs">
              
              {/* 1. Website Display Title & Google Drive Audio File Name */}
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
                      Customized title shown to website visitors.
                    </p>
                  </div>

                  <div>
                    <label className="block text-amber-400 font-bold uppercase tracking-wider mb-1">
                      2. Exact Google Drive Audio File Name
                    </label>
                    <input
                      type="text"
                      value={driveFileName}
                      onChange={(e) => {
                        const newFileName = e.target.value;
                        setDriveFileName(newFileName);
                        const matched = driveAudioFiles.find(f => f.name.trim().toLowerCase() === newFileName.trim().toLowerCase());
                        if (matched) {
                          setDriveFileId(matched.id);
                          setAudioUrl(`/api/drive/stream/${matched.id}`);
                          setDownloadUrl(`/api/drive/download/${matched.id}?filename=${encodeURIComponent(matched.name)}`);
                        }
                      }}
                      placeholder="e.g. 2026_06_07_Knowing_God.mp3"
                      className="w-full bg-gray-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-white font-mono placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                    <p className="text-[10px] text-gray-400 mt-1">
                      Google Drive filename for audio stream & download.
                    </p>
                  </div>
                </div>

                {/* Optional Google Drive Audio Picker Dropdown */}
                {driveAudioFiles.length > 0 && (
                  <div>
                    <label className="block text-[11px] text-gray-400 font-bold uppercase tracking-wider mb-1">
                      Quick Pick Audio from Google Drive Folder:
                    </label>
                    <select
                      value={driveFileId}
                      onChange={(e) => {
                        const selectedFile = driveAudioFiles.find(f => f.id === e.target.value);
                        if (selectedFile) {
                          setDriveFileId(selectedFile.id);
                          setDriveFileName(selectedFile.name);
                          setAudioUrl(`/api/drive/stream/${selectedFile.id}`);
                          setDownloadUrl(`/api/drive/download/${selectedFile.id}?filename=${encodeURIComponent(selectedFile.name)}`);
                          
                          // Check companion notes
                          const compNotes = findCompanionNotesFile(selectedFile.name);
                          if (compNotes && !notesDriveFileId) {
                            setNotesDriveFileId(compNotes.id);
                            setNotesFileName(compNotes.name);
                            setNotesUrl(`/api/drive/notes/view/${compNotes.id}?filename=${encodeURIComponent(compNotes.name)}`);
                          }
                        }
                      }}
                      className="w-full bg-gray-900 border border-white/10 rounded-xl px-3 py-2 text-gray-300 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="">-- Select Audio File from Google Drive --</option>
                      {driveAudioFiles.map((file) => (
                        <option key={file.id} value={file.id}>
                          {file.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* 2. YouTube Video URL Section */}
              <div className="bg-gray-950 p-4 rounded-2xl border border-red-500/20 space-y-3">
                <div className="flex items-center space-x-2 text-red-400 font-bold uppercase tracking-wider text-xs">
                  <Video className="w-4 h-4 text-red-500" />
                  <span>3. YouTube Sermon Video URL (Optional)</span>
                </div>
                <input
                  type="text"
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  placeholder="e.g. https://www.youtube.com/watch?v=dQw4w9WgXcQ or https://youtu.be/..."
                  className="w-full bg-gray-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-white font-mono placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                <p className="text-[10px] text-gray-400">
                  Provide a YouTube URL if a video recording of this service/sermon is available on YouTube. Website visitors will be able to watch it directly!
                </p>

                {parsedYoutubeId && (
                  <div className="bg-red-950/40 border border-red-500/30 p-2.5 rounded-xl text-gray-300 flex items-center justify-between text-xs">
                    <span className="flex items-center space-x-2 text-red-300 font-mono text-[11px]">
                      <Video className="w-3.5 h-3.5 text-red-400" />
                      <span>Detected YouTube ID: <strong>{parsedYoutubeId}</strong></span>
                    </span>
                    <a
                      href={`https://www.youtube.com/watch?v=${parsedYoutubeId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-red-400 hover:text-red-300 underline font-bold text-[10px] flex items-center space-x-1"
                    >
                      <span>Preview Video</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>

              {/* 3. Sermon Notes Section (Google Drive Folder or Direct Link) */}
              <div className="bg-gray-950 p-4 rounded-2xl border border-blue-500/20 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-blue-400 font-bold uppercase tracking-wider text-xs">
                    <FileText className="w-4 h-4 text-blue-400" />
                    <span>4. Sermon Notes Document (PDF / Word / Document)</span>
                  </div>
                  {notesFileName && (
                    <button
                      type="button"
                      onClick={() => {
                        setNotesDriveFileId('');
                        setNotesFileName('');
                        setNotesUrl('');
                        setNotesFileType('pdf');
                      }}
                      className="text-xs text-red-400 hover:text-red-300 underline font-bold"
                    >
                      Clear Notes
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-gray-300 font-bold uppercase tracking-wider mb-1 text-[11px]">
                      Google Drive Notes File Name
                    </label>
                    <input
                      type="text"
                      value={notesFileName}
                      onChange={(e) => {
                        const newNotesName = e.target.value;
                        setNotesFileName(newNotesName);
                        const matchedNotes = driveNotesFiles.find(f => f.name.trim().toLowerCase() === newNotesName.trim().toLowerCase());
                        if (matchedNotes) {
                          setNotesDriveFileId(matchedNotes.id);
                          setNotesUrl(`/api/drive/notes/view/${matchedNotes.id}?filename=${encodeURIComponent(matchedNotes.name)}`);
                          setNotesFileType(matchedNotes.name.toLowerCase().endsWith('.docx') ? 'docx' : 'pdf');
                        }
                      }}
                      placeholder="e.g. 2026_06_07_Sermon_Notes.pdf"
                      className="w-full bg-gray-900 border border-white/10 rounded-xl px-3.5 py-2 text-white font-mono placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-300 font-bold uppercase tracking-wider mb-1 text-[11px]">
                      Direct Notes View / Download URL (Optional)
                    </label>
                    <input
                      type="text"
                      value={notesUrl}
                      onChange={(e) => setNotesUrl(e.target.value)}
                      placeholder="https://... or auto-filled from Drive"
                      className="w-full bg-gray-900 border border-white/10 rounded-xl px-3.5 py-2 text-white font-mono placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Quick Pick Notes from Google Drive */}
                {driveNotesFiles.length > 0 && (
                  <div>
                    <label className="block text-[11px] text-gray-400 font-bold uppercase tracking-wider mb-1">
                      Quick Pick Notes from tccmedia123 Google Drive:
                    </label>
                    <select
                      value={notesDriveFileId}
                      onChange={(e) => {
                        const selectedNotes = driveNotesFiles.find(f => f.id === e.target.value);
                        if (selectedNotes) {
                          setNotesDriveFileId(selectedNotes.id);
                          setNotesFileName(selectedNotes.name);
                          setNotesUrl(`/api/drive/notes/view/${selectedNotes.id}?filename=${encodeURIComponent(selectedNotes.name)}`);
                          setNotesFileType(selectedNotes.name.toLowerCase().endsWith('.docx') ? 'docx' : 'pdf');
                        } else {
                          setNotesDriveFileId('');
                          setNotesFileName('');
                          setNotesUrl('');
                        }
                      }}
                      className="w-full bg-gray-900 border border-white/10 rounded-xl px-3 py-2 text-gray-300 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">-- Select Notes File from Google Drive --</option>
                      {driveNotesFiles.map((file) => (
                        <option key={file.id} value={file.id}>
                          📄 {file.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Notes Preview & Action Bar */}
                {(notesDriveFileId || notesFileName || notesUrl) && (
                  <div className="bg-blue-950/40 border border-blue-500/30 p-2.5 rounded-xl text-gray-300 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="flex items-center space-x-2 text-blue-300 font-mono text-[11px]">
                      <FileText className="w-3.5 h-3.5 text-blue-400" />
                      <span className="truncate max-w-[220px]">
                        Attached: <strong>{notesFileName || 'Direct URL Document'}</strong>
                      </span>
                    </span>
                    <div className="flex items-center space-x-2">
                      <a
                        href={notesDriveFileId ? `/api/drive/notes/view/${notesDriveFileId}?filename=${encodeURIComponent(notesFileName || 'notes.pdf')}` : (notesFileName ? `/api/drive/notes/view-by-name?filename=${encodeURIComponent(notesFileName)}` : notesUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 underline font-bold text-[10px] flex items-center space-x-1"
                      >
                        <span>Preview Notes</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                      <a
                        href={notesDriveFileId ? `/api/drive/notes/download/${notesDriveFileId}?filename=${encodeURIComponent(notesFileName || 'notes.pdf')}` : (notesFileName ? `/api/drive/notes/download-by-name?filename=${encodeURIComponent(notesFileName)}` : notesUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 underline font-bold text-[10px] flex items-center space-x-1"
                      >
                        <span>Test Download</span>
                        <Download className="w-3 h-3" />
                      </a>
                    </div>
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

              {/* Category / Theme & Series */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                      : "Check this box to allow website visitors to listen, watch, and download this sermon and notes."}
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
                  className="bg-[#d32f2f] hover:bg-red-700 text-white font-black uppercase tracking-wider px-6 py-2.5 rounded-xl shadow-lg disabled:opacity-50 cursor-pointer"
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

      {/* Select Notes for Existing Sermon Modal */}
      {selectNotesForSermon && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-white/10 rounded-3xl max-w-xl w-full p-6 space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center space-x-2 text-blue-400 font-bold uppercase tracking-wider text-xs">
                <FileText className="w-5 h-5 text-blue-400" />
                <span>Select Notes Document for: <span className="text-white normal-case font-bold">{selectNotesForSermon.title}</span></span>
              </div>
              <button
                type="button"
                onClick={() => setSelectNotesForSermon(null)}
                className="text-gray-400 hover:text-white p-1.5 rounded-xl bg-white/5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs text-gray-300">
              <p>
                Choose a sermon notes document (PDF / Word) from the <strong className="text-blue-300">tccmedia123</strong> Google Drive folder to attach to this sermon:
              </p>

              {driveNotesFiles.length > 0 ? (
                <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                  {driveNotesFiles.map((notesFile) => {
                    const isAlreadyAttached = selectNotesForSermon.notesDriveFileId === notesFile.id || (selectNotesForSermon.notesFileName && selectNotesForSermon.notesFileName.trim().toLowerCase() === notesFile.name.trim().toLowerCase());
                    return (
                      <div
                        key={notesFile.id}
                        className={`p-3 rounded-2xl border flex items-center justify-between transition-all ${
                          isAlreadyAttached
                            ? 'bg-blue-500/15 border-blue-500/40 text-white'
                            : 'bg-gray-950 border-white/10 hover:border-blue-500/30'
                        }`}
                      >
                        <div className="flex items-center space-x-2 min-w-0 pr-2">
                          <FileText className="w-4 h-4 text-blue-400 flex-shrink-0" />
                          <div className="min-w-0">
                            <h5 className="font-bold text-white truncate text-xs">{notesFile.name}</h5>
                            <span className="text-[10px] text-gray-400 font-mono">
                              {notesFile.createdTime ? notesFile.createdTime.split('T')[0] : 'Drive File'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 flex-shrink-0">
                          <a
                            href={`/api/drive/notes/view/${notesFile.id}?filename=${encodeURIComponent(notesFile.name)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-white/5 hover:bg-white/10 text-gray-300 p-1.5 rounded-xl border border-white/10"
                            title="Preview Document"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>

                          {isAlreadyAttached ? (
                            <button
                              type="button"
                              onClick={() => selectNotesForSermon.id && handleQuickDetachNotes(selectNotesForSermon.id)}
                              className="bg-red-500/10 hover:bg-red-500/20 text-red-300 px-3 py-1.5 rounded-xl border border-red-500/30 font-bold"
                            >
                              Detach
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => selectNotesForSermon.id && handleQuickAttachNotes(selectNotesForSermon.id, notesFile)}
                              disabled={saving}
                              className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-xl font-bold transition-all flex items-center space-x-1"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Select Note</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-gray-950 p-4 rounded-2xl border border-white/10 text-center text-gray-400 space-y-2">
                  <FileText className="w-6 h-6 text-gray-500 mx-auto" />
                  <p>No document files (.pdf, .docx) detected in the Google Drive folder yet.</p>
                </div>
              )}
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-white/10">
              <button
                type="button"
                onClick={() => {
                  const s = selectNotesForSermon;
                  setSelectNotesForSermon(null);
                  openEditModal(s);
                }}
                className="text-xs text-gray-400 hover:text-white underline"
              >
                Open Full Sermon Editor
              </button>

              <button
                type="button"
                onClick={() => setSelectNotesForSermon(null)}
                className="bg-white/10 hover:bg-white/15 text-white font-bold px-4 py-2 rounded-xl text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Attach Notes File to an Existing Sermon Modal */}
      {attachNotesModalFile && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-white/10 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center space-x-2 text-blue-400 font-bold uppercase tracking-wider text-xs">
                <FileText className="w-5 h-5 text-blue-400" />
                <span>Attach Notes to Sermon</span>
              </div>
              <button
                type="button"
                onClick={() => setAttachNotesModalFile(null)}
                className="text-gray-400 hover:text-white p-1.5 rounded-xl bg-white/5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs text-gray-300">
              <div className="bg-gray-950 p-3.5 rounded-2xl border border-blue-500/20 space-y-1">
                <span className="text-[10px] uppercase font-bold text-blue-400">Selected Google Drive Notes Document:</span>
                <h4 className="font-bold text-white text-sm break-all">{attachNotesModalFile.name}</h4>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                  Select an Existing Sermon to Link:
                </label>
                <select
                  value={selectedTargetSermonId}
                  onChange={(e) => setSelectedTargetSermonId(e.target.value)}
                  className="w-full bg-gray-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Choose a Sermon --</option>
                  {sermonsList.filter(s => !s.isArchived && s.status !== 'Archived' && s.title !== 'Archived').map((sermon) => (
                    <option key={sermon.id} value={sermon.id}>
                      {sermon.title} ({sermon.sermonDate || 'No date'}) {sermon.notesFileName ? '— [Has Notes Attached]' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-white/10">
              <button
                type="button"
                onClick={() => {
                  const f = attachNotesModalFile;
                  setAttachNotesModalFile(null);
                  handleSelectDriveFile(f);
                }}
                className="text-xs text-amber-400 hover:text-amber-300 underline font-bold"
              >
                + Or Create New Sermon with this Note
              </button>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setAttachNotesModalFile(null)}
                  className="bg-white/5 hover:bg-white/10 text-gray-300 font-bold px-4 py-2 rounded-xl text-xs border border-white/10"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!selectedTargetSermonId || saving}
                  onClick={() => selectedTargetSermonId && handleQuickAttachNotes(selectedTargetSermonId, attachNotesModalFile)}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold uppercase tracking-wider px-5 py-2 rounded-xl text-xs shadow-lg disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {saving ? 'Attaching...' : 'Attach Notes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default WebsiteCollateralManager;
