import React, { useState, useEffect, useRef, useCallback } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { Sermon } from '../types';
import { 
  Play, 
  Pause, 
  Download, 
  Search, 
  Calendar, 
  Clock, 
  User, 
  Tag, 
  Volume2, 
  VolumeX, 
  ExternalLink,
  BookOpen,
  Filter,
  Headphones,
  ArrowUpDown,
  RefreshCw,
  Sparkles,
  FileText,
  Video,
  FileDown,
  X,
  Eye,
  Tv,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';

// Default sample sermons to display if Firestore collection is empty initially
const INITIAL_SAMPLE_SERMONS: Sermon[] = [
  {
    id: 'sermon-drive-1',
    title: 'Biblical Perspective on Money',
    speaker: 'Pastor Leon Louw',
    sermonDate: '2026-07-19',
    theme: 'Kingdom Finances',
    series: 'Kingdom Foundations',
    audioLength: '48:15',
    description: 'An empowering message on managing resources God\'s way, breaking greed, and walking in biblical stewardship.',
    scripture: '1 Timothy 6:10, Matthew 6:24',
    audioUrl: 'https://docs.google.com/uc?export=open&id=16YLr7CLZmgTyFdxZSsOgbwjl8QvL1W8o',
    downloadUrl: 'https://drive.google.com/uc?export=download&id=16YLr7CLZmgTyFdxZSsOgbwjl8QvL1W8o',
    driveFileId: '16YLr7CLZmgTyFdxZSsOgbwjl8QvL1W8o',
    driveFileName: '2026_07_19_Biblical perspective on money.mp3',
    driveWebViewLink: 'https://drive.google.com/drive/folders/1qi4li-RY2flBnRt6wLfnpXpu4JeY_yVM',
    isPublished: true,
  },
  {
    id: 'sermon-drive-2',
    title: 'The Ancient Path (Part 4)',
    speaker: 'Pastor Leon Louw',
    sermonDate: '2026-06-28',
    theme: 'Kingdom Foundations',
    series: 'The Ancient Path',
    audioLength: '52:10',
    description: 'Part 4 of the foundational teaching on walking in the ancient paths of righteousness and covenant faith.',
    scripture: 'Jeremiah 6:16, Psalm 25:4-5',
    audioUrl: 'https://docs.google.com/uc?export=open&id=18tH_SH0kTCwTp7Ma49rW6k0s1RMeqGqm',
    downloadUrl: 'https://drive.google.com/uc?export=download&id=18tH_SH0kTCwTp7Ma49rW6k0s1RMeqGqm',
    driveFileId: '18tH_SH0kTCwTp7Ma49rW6k0s1RMeqGqm',
    driveFileName: '2026_06_28_The ancient path part 4.mp3',
    driveWebViewLink: 'https://drive.google.com/drive/folders/1qi4li-RY2flBnRt6wLfnpXpu4JeY_yVM',
    isPublished: true,
  },
  {
    id: 'sermon-drive-3',
    title: 'The Ancient Path (Part 3)',
    speaker: 'Pastor Leon Louw',
    sermonDate: '2026-06-14',
    theme: 'Kingdom Foundations',
    series: 'The Ancient Path',
    audioLength: '46:30',
    description: 'Exploring spiritual intimacy, covenant alignment, and standing firm in God\'s promises.',
    scripture: 'Hebrews 10:23, Psalm 119:105',
    audioUrl: 'https://docs.google.com/uc?export=open&id=12PYuGlFdS3KLWto8S18LeMtupkdNJGjv',
    downloadUrl: 'https://drive.google.com/uc?export=download&id=12PYuGlFdS3KLWto8S18LeMtupkdNJGjv',
    driveFileId: '12PYuGlFdS3KLWto8S18LeMtupkdNJGjv',
    driveFileName: '2026_06_14_The ancient path part 3.mp3',
    driveWebViewLink: 'https://drive.google.com/drive/folders/1qi4li-RY2flBnRt6wLfnpXpu4JeY_yVM',
    isPublished: true,
  },
  {
    id: 'sermon-drive-4',
    title: 'The Ancient Path (Part 2)',
    speaker: 'Pastor Leon Louw',
    sermonDate: '2026-06-14',
    theme: 'Kingdom Foundations',
    series: 'The Ancient Path',
    audioLength: '44:00',
    description: 'Understanding God\'s blueprint for life, worship, and spiritual maturity in daily living.',
    scripture: 'Proverbs 3:5-6, Isaiah 30:21',
    audioUrl: 'https://docs.google.com/uc?export=open&id=1ReJxmN-zXchGunyr_6v0SqZrk_ZhA1nz',
    downloadUrl: 'https://drive.google.com/uc?export=download&id=1ReJxmN-zXchGunyr_6v0SqZrk_ZhA1nz',
    driveFileId: '1ReJxmN-zXchGunyr_6v0SqZrk_ZhA1nz',
    driveFileName: '2026_06_14_The ancient path part 2.mp3',
    driveWebViewLink: 'https://drive.google.com/drive/folders/1qi4li-RY2flBnRt6wLfnpXpu4JeY_yVM',
    isPublished: true,
  },
  {
    id: 'sermon-drive-5',
    title: 'The Ancient Path (Part 1)',
    speaker: 'Pastor Leon Louw',
    sermonDate: '2026-06-07',
    theme: 'Kingdom Foundations',
    series: 'The Ancient Path',
    audioLength: '41:20',
    description: 'The series premiere introducing the ancient paths of devotion, prayer, and kingdom authority.',
    scripture: 'Jeremiah 6:16, Matthew 7:24-27',
    audioUrl: 'https://docs.google.com/uc?export=open&id=1a-2WVQXSWHL1oOx0b2GTUwKnXG4oPhT7',
    downloadUrl: 'https://drive.google.com/uc?export=download&id=1a-2WVQXSWHL1oOx0b2GTUwKnXG4oPhT7',
    driveFileId: '1a-2WVQXSWHL1oOx0b2GTUwKnXG4oPhT7',
    driveFileName: '2026_06_07_The ancient path.mp3',
    driveWebViewLink: 'https://drive.google.com/drive/folders/1qi4li-RY2flBnRt6wLfnpXpu4JeY_yVM',
    isPublished: true,
  }
];

// Helper to extract YouTube video ID from various URL formats
const getYouTubeVideoId = (url?: string): string | null => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

// Helper to extract Google Drive File ID from string/URL
const extractGoogleDriveFileId = (sermon: Sermon): string | null => {
  if (sermon.driveFileId && sermon.driveFileId.trim().length >= 20) {
    return sermon.driveFileId.trim();
  }
  const rawCandidate = sermon.audioUrl || sermon.downloadUrl || '';
  if (!rawCandidate) return null;

  const driveMatch = rawCandidate.match(/(?:id=|\/d\/|file\/d\/)([a-zA-Z0-9_-]{25,})/);
  if (driveMatch && driveMatch[1]) {
    return driveMatch[1];
  }
  return null;
};

// Helper to get an ordered list of candidate streaming URLs for resilient playback
const getAudioCandidateSources = (sermon: Sermon): string[] => {
  const sources: string[] = [];
  const driveId = extractGoogleDriveFileId(sermon);

  if (driveId) {
    // 1. Direct PHP stream proxy for Hostinger shared hosting
    sources.push(`/drive-proxy.php?action=stream&id=${driveId}`);
    // 2. Proxied API stream (Express/Node or Apache rewritten)
    sources.push(`/api/drive/stream/${driveId}`);
    // 3. Direct Google usercontent stream
    sources.push(`https://drive.usercontent.google.com/download?id=${driveId}&export=download&authuser=0&confirm=t`);
    // 4. Google docs uc open
    sources.push(`https://docs.google.com/uc?export=open&id=${driveId}`);
    // 5. Google drive uc download
    sources.push(`https://drive.google.com/uc?export=download&id=${driveId}&confirm=t`);
  }

  // 6. Raw audioUrl if specified and not already added
  if (sermon.audioUrl && !sources.includes(sermon.audioUrl)) {
    if (sermon.audioUrl.startsWith('http')) {
      sources.push(`/drive-proxy.php?action=proxy&url=${encodeURIComponent(sermon.audioUrl)}`);
      sources.push(sermon.audioUrl);
      sources.push(`/api/audio-proxy?url=${encodeURIComponent(sermon.audioUrl)}`);
    } else {
      sources.push(sermon.audioUrl);
    }
  }

  // 7. Raw downloadUrl as fallback stream
  if (sermon.downloadUrl && !sources.includes(sermon.downloadUrl)) {
    sources.push(sermon.downloadUrl);
  }

  return sources.filter(Boolean);
};

interface SermonsPageProps {
  onNavigate?: (path: string) => void;
}

const SermonsPage: React.FC<SermonsPageProps> = () => {
  const [sermons, setSermons] = useState<Sermon[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Sorting state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTheme, setSelectedTheme] = useState('All');
  const [mediaFilter, setMediaFilter] = useState<'all' | 'video' | 'notes' | 'audio'>('all');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'title_asc' | 'length_desc'>('date_desc');

  // Active Video Modal State
  const [activeVideoSermon, setActiveVideoSermon] = useState<Sermon | null>(null);

  // Currently playing audio state
  const [activeSermonId, setActiveSermonId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [currentCandidateIndex, setCurrentCandidateIndex] = useState(0);
  const [playbackError, setPlaybackError] = useState<string | null>(null);
  const [playbackErrorSermonId, setPlaybackErrorSermonId] = useState<string | null>(null);

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const bufferingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Clear watchdog on unmount
  useEffect(() => {
    return () => {
      if (bufferingTimeoutRef.current) {
        clearTimeout(bufferingTimeoutRef.current);
      }
    };
  }, []);

  // Fetch published sermons from Firestore
  useEffect(() => {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'sermons'),
        where('isPublished', '==', true)
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const fetchedList: Sermon[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data() as Sermon;
          if (!data.isArchived && data.title !== 'Archived' && data.status !== 'Archived') {
            fetchedList.push({ ...data, id: doc.id });
          }
        });

        // Set fetched list directly so deleted items remain deleted
        setSermons(fetchedList);
        setLoading(false);
      }, (error) => {
        console.warn('Error listening to sermons collection:', error);
        setSermons(INITIAL_SAMPLE_SERMONS);
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (err) {
      console.warn('Firestore sermons query error:', err);
      setSermons(INITIAL_SAMPLE_SERMONS);
      setLoading(false);
    }
  }, []);

  // Helper to resolve direct attachment download URL (forces immediate file download)
  const resolveDirectDownloadUrl = (sermon: Sermon): string => {
    const driveId = extractGoogleDriveFileId(sermon);
    if (driveId) {
      return `/drive-proxy.php?action=download&id=${driveId}&filename=${encodeURIComponent(sermon.driveFileName || `${sermon.title || 'sermon'}.mp3`)}`;
    }

    const rawUrl = sermon.downloadUrl || sermon.audioUrl || '';
    if (!rawUrl) return '#';
    return rawUrl;
  };

  // Helper to resolve Notes View URL
  const resolveNotesViewUrl = (sermon: Sermon): string => {
    if (sermon.notesDriveFileId) {
      return `/drive-proxy.php?action=notes_view&id=${sermon.notesDriveFileId}&filename=${encodeURIComponent(sermon.notesFileName || 'notes.pdf')}`;
    }
    const raw = sermon.notesUrl || '';
    const driveMatch = raw.match(/(?:id=|\/d\/|file\/d\/)([a-zA-Z0-9_-]{25,})/);
    if (driveMatch && driveMatch[1]) {
      return `/drive-proxy.php?action=notes_view&id=${driveMatch[1]}&filename=${encodeURIComponent(sermon.notesFileName || 'notes.pdf')}`;
    }
    return raw;
  };

  // Helper to resolve Notes Download URL
  const resolveNotesDownloadUrl = (sermon: Sermon): string => {
    if (sermon.notesDriveFileId) {
      return `/drive-proxy.php?action=notes_download&id=${sermon.notesDriveFileId}&filename=${encodeURIComponent(sermon.notesFileName || 'notes.pdf')}`;
    }
    const raw = sermon.notesDownloadUrl || sermon.notesUrl || '';
    const driveMatch = raw.match(/(?:id=|\/d\/|file\/d\/)([a-zA-Z0-9_-]{25,})/);
    if (driveMatch && driveMatch[1]) {
      return `/drive-proxy.php?action=notes_download&id=${driveMatch[1]}&filename=${encodeURIComponent(sermon.notesFileName || 'notes.pdf')}`;
    }
    return raw;
  };

  // Safe playback execution helper with promise handling
  const playAudioElement = useCallback(async () => {
    if (!audioRef.current) return;
    setIsLoadingAudio(true);

    // Set 6-second buffering watchdog
    if (bufferingTimeoutRef.current) clearTimeout(bufferingTimeoutRef.current);
    bufferingTimeoutRef.current = setTimeout(() => {
      if (audioRef.current && (audioRef.current.readyState < 2 || audioRef.current.paused)) {
        console.warn('[Audio Player] Buffering timeout reached (6s). Advancing to next stream candidate...');
        triggerNextFallbackOrError();
      }
    }, 6000);

    try {
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        await playPromise;
        if (bufferingTimeoutRef.current) clearTimeout(bufferingTimeoutRef.current);
        setIsPlaying(true);
        setIsLoadingAudio(false);
        setPlaybackError(null);
        setPlaybackErrorSermonId(null);
      }
    } catch (err: any) {
      console.warn("Audio play() promise caught rejection:", err?.name, err?.message);
      if (bufferingTimeoutRef.current) clearTimeout(bufferingTimeoutRef.current);
      if (err?.name === 'NotAllowedError') {
        setIsPlaying(false);
        setIsLoadingAudio(false);
        setPlaybackError("Audio playback was blocked by browser policy. Click 'Listen to Audio' again to resume.");
        setPlaybackErrorSermonId(activeSermonId);
      } else if (err?.name === 'AbortError') {
        // Play was interrupted by load or pause; do not treat as fatal
        setIsLoadingAudio(false);
      } else {
        // Other errors trigger candidate fallback
        triggerNextFallbackOrError();
      }
    }
  }, [activeSermonId]);

  // Handle source errors by cycling through candidate sources or showing an actionable message
  const triggerNextFallbackOrError = useCallback(() => {
    if (bufferingTimeoutRef.current) clearTimeout(bufferingTimeoutRef.current);

    const currentSermon = sermons.find(s => (s.id || s.title) === activeSermonId);
    if (!currentSermon) {
      setIsPlaying(false);
      setIsLoadingAudio(false);
      return;
    }

    const sources = getAudioCandidateSources(currentSermon);
    const nextIdx = currentCandidateIndex + 1;

    if (nextIdx < sources.length && audioRef.current) {
      console.info(`[Audio Player] Source ${currentCandidateIndex + 1} failed. Trying fallback ${nextIdx + 1}/${sources.length}:`, sources[nextIdx]);
      setCurrentCandidateIndex(nextIdx);
      setIsLoadingAudio(true);
      audioRef.current.src = sources[nextIdx];
      audioRef.current.load();
      playAudioElement();
    } else {
      console.warn(`[Audio Player] All ${sources.length} audio stream candidates failed for:`, currentSermon.title);
      setIsPlaying(false);
      setIsLoadingAudio(false);
      setPlaybackError(
        `Unable to stream audio recording for "${currentSermon.title}". Please download the MP3 directly or open the recording in Google Drive.`
      );
      setPlaybackErrorSermonId(currentSermon.id || currentSermon.title);
    }
  }, [activeSermonId, currentCandidateIndex, sermons, playAudioElement]);

  // Handle Play/Pause Toggle
  const handleTogglePlay = async (sermon: Sermon) => {
    const sermonId = sermon.id || sermon.title;

    if ('mediaSession' in navigator) {
      try {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: sermon.title || 'Sermon Audio',
          artist: sermon.speaker || 'Pastor Leon Louw',
          album: sermon.driveFileName || sermon.series || 'Kingdom Foundations',
        });
      } catch (_) {}
    }

    if (activeSermonId === sermonId) {
      if (isPlaying) {
        audioRef.current?.pause();
        setIsPlaying(false);
        setIsLoadingAudio(false);
      } else {
        await playAudioElement();
      }
    } else {
      // Starting new sermon playback
      setPlaybackError(null);
      setPlaybackErrorSermonId(null);
      setActiveSermonId(sermonId);
      setCurrentCandidateIndex(0);
      setCurrentTime(0);
      setDuration(0);
      setIsLoadingAudio(true);

      const sources = getAudioCandidateSources(sermon);
      if (sources.length === 0) {
        setIsLoadingAudio(false);
        setIsPlaying(false);
        setPlaybackError(`No audio recording URL configured for "${sermon.title}".`);
        setPlaybackErrorSermonId(sermonId);
        return;
      }

      if (audioRef.current) {
        audioRef.current.src = sources[0];
        audioRef.current.load();
        await playAudioElement();
      }
    }
  };

  // Direct File Download Handler (streams MP3 audio directly via backend proxy)
  const handleDownloadSermon = (e: React.MouseEvent, sermon: Sermon) => {
    e.preventDefault();
    e.stopPropagation();

    const sermonKey = sermon.id || sermon.title;
    const downloadUrl = resolveDirectDownloadUrl(sermon);
    const downloadName = sermon.driveFileName || (sermon.title ? `${sermon.title}.mp3` : 'sermon.mp3');

    setDownloadingId(sermonKey);

    try {
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = downloadName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: any) {
      console.warn("Direct download error, opening link:", err);
      window.open(downloadUrl, '_blank');
    } finally {
      setTimeout(() => setDownloadingId(null), 1500);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      if (audioRef.current.duration && !isNaN(audioRef.current.duration)) {
        setDuration(audioRef.current.duration);
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = Number(e.target.value);
    setVolume(newVol);
    if (audioRef.current) {
      audioRef.current.volume = newVol;
      if (newVol === 0) {
        setIsMuted(true);
      } else if (isMuted) {
        setIsMuted(false);
        audioRef.current.muted = false;
      }
    }
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds === 0) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Available Themes list
  const availableThemes = Array.from(
    new Set(sermons.map((s) => s.theme).filter(Boolean))
  ) as string[];

  // Filter & Sort Logic
  const filteredSermons = sermons.filter((sermon) => {
    const matchesSearch = 
      sermon.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sermon.speaker.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (sermon.theme && sermon.theme.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (sermon.description && sermon.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesTheme = selectedTheme === 'All' || sermon.theme === selectedTheme;

    let matchesMedia = true;
    if (mediaFilter === 'video') {
      matchesMedia = Boolean(sermon.youtubeUrl);
    } else if (mediaFilter === 'notes') {
      matchesMedia = Boolean(sermon.notesUrl || sermon.notesDriveFileId || sermon.notesFileName);
    } else if (mediaFilter === 'audio') {
      matchesMedia = Boolean(sermon.audioUrl || sermon.driveFileId || sermon.driveFileName);
    }

    return matchesSearch && matchesTheme && matchesMedia;
  }).sort((a, b) => {
    if (sortBy === 'date_desc') {
      return new Date(b.sermonDate).getTime() - new Date(a.sermonDate).getTime();
    }
    if (sortBy === 'date_asc') {
      return new Date(a.sermonDate).getTime() - new Date(b.sermonDate).getTime();
    }
    if (sortBy === 'title_asc') {
      return a.title.localeCompare(b.title);
    }
    if (sortBy === 'length_desc') {
      return (b.audioLength || '').localeCompare(a.audioLength || '');
    }
    return 0;
  });

  const activeSermon = sermons.find(s => (s.id || s.title) === activeSermonId);

  return (
    <div className="bg-gray-950 text-white min-h-screen pt-24 pb-20">
      {/* Audio Element with complete event handling */}
      <audio 
        ref={audioRef} 
        preload="metadata"
        onTimeUpdate={handleTimeUpdate} 
        onLoadedMetadata={() => {
          if (audioRef.current) {
            setDuration(audioRef.current.duration || 0);
            setIsLoadingAudio(false);
          }
        }}
        onPlaying={() => {
          setIsPlaying(true);
          setIsLoadingAudio(false);
          setPlaybackError(null);
        }}
        onPause={() => {
          setIsPlaying(false);
        }}
        onWaiting={() => {
          setIsLoadingAudio(true);
        }}
        onCanPlay={() => {
          setIsLoadingAudio(false);
        }}
        onEnded={() => {
          setIsPlaying(false);
          setIsLoadingAudio(false);
          setCurrentTime(0);
        }}
        onError={() => {
          const errCode = audioRef.current?.error?.code;
          const errMsg = audioRef.current?.error?.message;
          console.warn("[Audio Player] HTMLAudioElement onError fired:", errCode, errMsg || "");
          triggerNextFallbackOrError();
        }}
      />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-red-950/60 via-gray-900 to-gray-950 border-b border-white/10 py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-6">
          <h1 className="text-4xl sm:text-6xl font-black uppercase tracking-tight text-white leading-none">
            Sermon <span className="text-[#d32f2f]">Recordings & Media</span>
          </h1>

          <p className="text-base sm:text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed font-normal">
            Listen to life-transforming audio messages, watch video sermons, and download sermon notes and study materials from Transformation City Church.
          </p>
        </div>
      </section>

      {/* Controls & Filter Bar */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-20">
        <div className="bg-gray-900 border border-white/10 p-5 rounded-3xl shadow-2xl space-y-4 lg:space-y-0 lg:flex lg:items-center lg:justify-between lg:space-x-4">
          
          {/* Search Box */}
          <div className="relative flex-grow max-w-md">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search sermons by title, speaker, theme..."
              className="w-full bg-gray-950 border border-white/10 rounded-2xl pl-11 pr-4 py-3 text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#d32f2f]"
            />
          </div>

          {/* Media Format Filter Tabs */}
          <div className="flex items-center space-x-1.5 bg-gray-950 p-1.5 rounded-2xl border border-white/10 text-xs">
            <button
              onClick={() => setMediaFilter('all')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                mediaFilter === 'all' ? 'bg-white/15 text-white shadow-sm' : 'text-gray-400 hover:text-white'
              }`}
            >
              All Formats
            </button>
            <button
              onClick={() => setMediaFilter('video')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center space-x-1.5 ${
                mediaFilter === 'video' ? 'bg-red-600/30 text-red-300 border border-red-500/40' : 'text-gray-400 hover:text-white'
              }`}
            >
              <Video className="w-3.5 h-3.5 text-red-400" />
              <span>Video</span>
            </button>
            <button
              onClick={() => setMediaFilter('notes')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center space-x-1.5 ${
                mediaFilter === 'notes' ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40' : 'text-gray-400 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-blue-400" />
              <span>Notes</span>
            </button>
            <button
              onClick={() => setMediaFilter('audio')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center space-x-1.5 ${
                mediaFilter === 'audio' ? 'bg-amber-600/30 text-amber-300 border border-amber-500/40' : 'text-gray-400 hover:text-white'
              }`}
            >
              <Headphones className="w-3.5 h-3.5 text-amber-400" />
              <span>Audio</span>
            </button>
          </div>

          {/* Theme Category Filter & Sort */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center space-x-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center space-x-1">
                <Filter className="w-3.5 h-3.5 text-red-400" />
                <span>Theme:</span>
              </span>
              <select
                value={selectedTheme}
                onChange={(e) => setSelectedTheme(e.target.value)}
                className="bg-gray-950 border border-white/10 text-white text-xs font-bold px-3 py-2.5 rounded-xl outline-none cursor-pointer focus:ring-2 focus:ring-[#d32f2f]"
              >
                <option value="All">All Themes ({sermons.length})</option>
                {availableThemes.map((theme) => (
                  <option key={theme} value={theme}>{theme}</option>
                ))}
              </select>
            </div>

            {/* Sort By Metadata */}
            <div className="flex items-center space-x-2 bg-gray-950 border border-white/10 px-3 py-2 rounded-xl">
              <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent text-xs font-bold text-white outline-none cursor-pointer"
              >
                <option value="date_desc" className="bg-gray-900 text-white">Newest First</option>
                <option value="date_asc" className="bg-gray-900 text-white">Oldest First</option>
                <option value="title_asc" className="bg-gray-900 text-white">Title: A-Z</option>
              </select>
            </div>
          </div>

        </div>
      </section>

      {/* Persistent Audio Sticky Player Bar (When Active or Playing) */}
      {activeSermon && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900/95 backdrop-blur-xl border-t border-red-500/30 p-4 shadow-2xl transition-all animate-in slide-in-from-bottom">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            
            {/* Info & Play/Pause Button */}
            <div className="flex items-center space-x-3 w-full md:w-1/3">
              <button 
                onClick={() => handleTogglePlay(activeSermon)}
                disabled={isLoadingAudio}
                className="w-11 h-11 bg-[#d32f2f] hover:bg-red-700 disabled:opacity-75 text-white rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95 flex-shrink-0 cursor-pointer"
                title={isPlaying ? "Pause" : "Play Audio"}
              >
                {isLoadingAudio ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : isPlaying ? (
                  <Pause className="w-5 h-5 fill-current" />
                ) : (
                  <Play className="w-5 h-5 fill-current ml-0.5" />
                )}
              </button>
              <div className="min-w-0">
                <div className="flex items-center space-x-2">
                  <h4 className="text-sm font-black text-white truncate">{activeSermon.title}</h4>
                  {isLoadingAudio && (
                    <span className="text-[10px] text-amber-400 font-mono animate-pulse">Buffering...</span>
                  )}
                </div>
                <p className="text-xs text-gray-400 truncate">{activeSermon.speaker} • {activeSermon.sermonDate}</p>
              </div>
            </div>

            {/* Scrubber & Controls */}
            <div className="flex items-center space-x-3 w-full md:w-5/12">
              <span className="text-xs font-mono text-gray-400 w-10 text-right">{formatTime(currentTime)}</span>
              <input 
                type="range" 
                min={0} 
                max={duration || 100} 
                value={currentTime} 
                onChange={handleSeek}
                className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-[#d32f2f]"
              />
              <span className="text-xs font-mono text-gray-400 w-10">{formatTime(duration)}</span>
            </div>

            {/* Volume, Download & Actions */}
            <div className="flex items-center space-x-2 w-full md:w-auto justify-end">
              {/* Volume Slider */}
              <div className="hidden sm:flex items-center space-x-1.5 mr-2">
                <button
                  onClick={toggleMute}
                  className="text-gray-400 hover:text-white p-1 rounded-lg"
                  title={isMuted ? "Unmute" : "Mute"}
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="w-4 h-4 text-red-400" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-16 h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-[#d32f2f]"
                  title="Volume"
                />
              </div>

              {/* If Notes are attached */}
              {(activeSermon.notesUrl || activeSermon.notesDriveFileId) && (
                <a
                  href={resolveNotesViewUrl(activeSermon)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 text-xs font-bold px-3 py-2 rounded-xl border border-blue-500/30 flex items-center space-x-1.5 transition-all"
                  title="View Sermon Notes"
                >
                  <FileText className="w-3.5 h-3.5 text-blue-400" />
                  <span>Notes</span>
                </a>
              )}

              {/* If Video/YouTube is attached */}
              {activeSermon.youtubeUrl && (
                <button
                  onClick={() => setActiveVideoSermon(activeSermon)}
                  className="bg-red-500/10 hover:bg-red-500/20 text-red-300 text-xs font-bold px-3 py-2 rounded-xl border border-red-500/30 flex items-center space-x-1.5 transition-all cursor-pointer"
                  title="Watch Video"
                >
                  <Video className="w-3.5 h-3.5 text-red-400" />
                  <span>Video</span>
                </button>
              )}

              {/* Download Audio */}
              <button
                onClick={(e) => handleDownloadSermon(e, activeSermon)}
                disabled={downloadingId === (activeSermon.id || activeSermon.title)}
                className="bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-3 py-2 rounded-xl border border-white/10 flex items-center space-x-1.5 transition-all disabled:opacity-50 cursor-pointer"
                title="Download MP3 Audio File"
              >
                <Download className={`w-3.5 h-3.5 text-red-400 ${downloadingId === (activeSermon.id || activeSermon.title) ? 'animate-bounce' : ''}`} />
                <span>{downloadingId === (activeSermon.id || activeSermon.title) ? 'Downloading...' : 'Download'}</span>
              </button>

              {/* Close Active Player Bar */}
              <button
                onClick={() => {
                  audioRef.current?.pause();
                  setIsPlaying(false);
                  setActiveSermonId(null);
                  setPlaybackError(null);
                }}
                className="text-gray-400 hover:text-white p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors ml-1 cursor-pointer"
                title="Close player"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Video Modal Viewer */}
      {activeVideoSermon && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-white/10 rounded-3xl max-w-4xl w-full p-6 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-red-400 font-bold flex items-center space-x-1.5">
                  <Video className="w-3.5 h-3.5 text-red-500" />
                  <span>Sermon Video Stream</span>
                </span>
                <h3 className="text-lg font-black text-white">{activeVideoSermon.title}</h3>
                <p className="text-xs text-gray-400">{activeVideoSermon.speaker} • {activeVideoSermon.sermonDate}</p>
              </div>

              <button
                onClick={() => setActiveVideoSermon(null)}
                className="text-gray-400 hover:text-white p-2 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Embedded YouTube Iframe */}
            {(() => {
              const videoId = getYouTubeVideoId(activeVideoSermon.youtubeUrl);
              if (videoId) {
                return (
                  <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black shadow-inner border border-white/5">
                    <iframe
                      src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`}
                      title={activeVideoSermon.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                      className="w-full h-full border-0"
                    />
                  </div>
                );
              }
              return (
                <div className="text-center py-12 text-gray-400 space-y-2">
                  <p>Unable to embed this video link.</p>
                  <a
                    href={activeVideoSermon.youtubeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-red-400 hover:underline text-xs font-bold inline-flex items-center space-x-1"
                  >
                    <span>Open video in new tab</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              );
            })()}

            {/* Companion Audio & Notes Actions inside Modal */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex items-center space-x-2">
                {(activeVideoSermon.notesUrl || activeVideoSermon.notesDriveFileId) && (
                  <a
                    href={resolveNotesViewUrl(activeVideoSermon)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-blue-500/15 hover:bg-blue-500/25 text-blue-300 border border-blue-500/30 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5 text-blue-400" />
                    <span>View Sermon Notes</span>
                    <ExternalLink className="w-3 h-3 text-blue-400" />
                  </a>
                )}
                {(activeVideoSermon.notesDriveFileId || activeVideoSermon.notesDownloadUrl) && (
                  <a
                    href={resolveNotesDownloadUrl(activeVideoSermon)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-gray-800 hover:bg-gray-700 text-gray-300 border border-white/10 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors"
                  >
                    <FileDown className="w-3.5 h-3.5 text-blue-400" />
                    <span>Download Notes</span>
                  </a>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <a
                  href={activeVideoSermon.youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/30 px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors"
                >
                  <Video className="w-3.5 h-3.5 text-red-400" />
                  <span>Open Video in New Window</span>
                  <ExternalLink className="w-3 h-3 text-red-400" />
                </a>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Sermons Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        {loading ? (
          <div className="text-center py-20 space-y-3">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-[#d32f2f]" />
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Loading sermon catalog...</p>
          </div>
        ) : filteredSermons.length === 0 ? (
          <div className="text-center py-20 bg-gray-900/50 rounded-3xl border border-white/5 space-y-4">
            <Headphones className="w-12 h-12 text-gray-600 mx-auto" />
            <h3 className="text-lg font-bold text-white">No Sermons Found</h3>
            <p className="text-xs text-gray-400 max-w-md mx-auto">
              No published sermon recordings matched your criteria. Try adjusting your search query or media filter.
            </p>
            <button
              onClick={() => { setSearchQuery(''); setSelectedTheme('All'); setMediaFilter('all'); }}
              className="bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-4 py-2 rounded-xl border border-white/10 cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSermons.map((sermon) => {
              const sermonKey = sermon.id || sermon.title;
              const isCurrentActive = activeSermonId === sermonKey;
              const isCurrentPlaying = isCurrentActive && isPlaying;
              const isCurrentBuffering = isCurrentActive && isLoadingAudio;
              const hasAudio = Boolean(sermon.audioUrl || sermon.driveFileId || sermon.driveFileName);
              const hasYoutube = Boolean(sermon.youtubeUrl);
              const hasNotes = Boolean(sermon.notesUrl || sermon.notesDriveFileId || sermon.notesFileName);
              const hasError = Boolean(playbackError && playbackErrorSermonId === sermonKey);

              return (
                <div 
                  key={sermonKey}
                  className={`bg-gray-900 border rounded-3xl p-6 transition-all duration-300 flex flex-col justify-between space-y-5 hover:border-red-500/40 hover:shadow-2xl group ${
                    isCurrentActive ? 'border-red-500/50 bg-gray-900/90 ring-1 ring-red-500/30' : 'border-white/10'
                  }`}
                >
                  <div className="space-y-4">
                    {/* Top Badges */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center space-x-1.5 bg-red-500/10 text-red-400 border border-red-500/20 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider">
                        <Tag className="w-3 h-3" />
                        <span>{sermon.theme || 'Sunday Teaching'}</span>
                      </span>

                      <span className="text-xs text-gray-400 font-mono font-bold flex items-center space-x-1">
                        <Calendar className="w-3.5 h-3.5 text-gray-500" />
                        <span>{sermon.sermonDate}</span>
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="text-xl font-black text-white group-hover:text-red-400 transition-colors leading-tight">
                      {sermon.title}
                    </h3>

                    {/* Speaker */}
                    <div className="flex items-center justify-between text-xs text-gray-400 pt-1 font-medium border-t border-white/5">
                      <span className="flex items-center space-x-1.5 text-gray-300 font-bold">
                        <User className="w-3.5 h-3.5 text-red-400" />
                        <span>{sermon.speaker}</span>
                      </span>
                    </div>

                    {/* Media Type Availability Badges */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {hasAudio && (
                        <span className="inline-flex items-center space-x-1 text-[10px] font-mono bg-amber-500/10 text-amber-300 border border-amber-500/20 px-2 py-0.5 rounded">
                          <Headphones className="w-3 h-3 text-amber-400" />
                          <span>Audio</span>
                        </span>
                      )}
                      {hasYoutube && (
                        <span className="inline-flex items-center space-x-1 text-[10px] font-mono bg-red-600/15 text-red-300 border border-red-500/30 px-2 py-0.5 rounded">
                          <Video className="w-3 h-3 text-red-400" />
                          <span>Video Available</span>
                        </span>
                      )}
                      {hasNotes && (
                        <span className="inline-flex items-center space-x-1 text-[10px] font-mono bg-blue-500/15 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded">
                          <FileText className="w-3 h-3 text-blue-400" />
                          <span>Notes ({sermon.notesFileType?.toUpperCase() || 'PDF'})</span>
                        </span>
                      )}
                    </div>

                    {/* Description */}
                    {sermon.description && (
                      <p className="text-xs text-gray-400 leading-relaxed line-clamp-3">
                        {sermon.description}
                      </p>
                    )}

                    {/* Scripture Reference */}
                    {sermon.scripture && (
                      <div className="bg-gray-950/80 border border-white/5 px-3 py-2 rounded-xl text-xs text-gray-300 font-serif italic flex items-center space-x-2">
                        <BookOpen className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                        <span className="truncate">{sermon.scripture}</span>
                      </div>
                    )}

                    {/* Playback Error Alert Box (if failed) */}
                    {hasError && (
                      <div className="bg-red-950/60 border border-red-500/40 rounded-2xl p-3 text-xs space-y-2 text-red-200 animate-in fade-in">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start space-x-2">
                            <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                            <p className="leading-tight text-[11px]">{playbackError}</p>
                          </div>
                          <button
                            onClick={() => {
                              setPlaybackError(null);
                              setPlaybackErrorSermonId(null);
                            }}
                            className="text-gray-400 hover:text-white p-0.5"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="flex items-center space-x-2 pt-1">
                          <button
                            onClick={() => handleTogglePlay(sermon)}
                            className="bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg flex items-center space-x-1 transition-colors cursor-pointer"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Retry</span>
                          </button>
                          <button
                            onClick={(e) => handleDownloadSermon(e, sermon)}
                            className="bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg flex items-center space-x-1 transition-colors cursor-pointer"
                          >
                            <Download className="w-3 h-3 text-red-400" />
                            <span>Direct Download</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Collateral & Action Buttons */}
                  <div className="space-y-2 pt-3 border-t border-white/10">
                    
                    {/* Primary Play Audio / Watch Video Buttons */}
                    <div className="flex items-center gap-2">
                      {hasAudio && (
                        <button
                          onClick={() => handleTogglePlay(sermon)}
                          className={`flex-1 py-2.5 px-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center space-x-1.5 shadow-md cursor-pointer ${
                            isCurrentBuffering
                              ? 'bg-amber-500 text-gray-950 font-black'
                              : isCurrentPlaying 
                                ? 'bg-amber-500 text-gray-950 font-black' 
                                : 'bg-[#d32f2f] hover:bg-red-700 text-white'
                          }`}
                        >
                          {isCurrentBuffering ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              <span>Buffering...</span>
                            </>
                          ) : isCurrentPlaying ? (
                            <>
                              <Pause className="w-3.5 h-3.5 fill-current" />
                              <span>Pause Audio</span>
                            </>
                          ) : (
                            <>
                              <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                              <span>Listen to Audio</span>
                            </>
                          )}
                        </button>
                      )}

                      {/* Video Watch Button */}
                      {hasYoutube && (
                        <button
                          onClick={() => setActiveVideoSermon(sermon)}
                          className={`py-2.5 px-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center space-x-1.5 shadow-md cursor-pointer ${
                            !hasAudio ? 'flex-1 bg-red-600 hover:bg-red-700 text-white' : 'bg-red-950/70 hover:bg-red-900/80 text-red-200 border border-red-500/40'
                          }`}
                          title="Watch Sermon Video"
                        >
                          <Video className="w-4 h-4 text-red-400" />
                          <span>Watch Video</span>
                        </button>
                      )}

                      {/* Direct Audio Download Button */}
                      {hasAudio && (
                        <button
                          onClick={(e) => handleDownloadSermon(e, sermon)}
                          disabled={downloadingId === (sermon.id || sermon.title)}
                          className="bg-white/5 hover:bg-white/15 text-gray-200 border border-white/10 p-2.5 rounded-xl transition-all cursor-pointer disabled:opacity-50 flex-shrink-0"
                          title="Download MP3 Audio File"
                        >
                          <Download className={`w-4 h-4 text-red-400 ${downloadingId === (sermon.id || sermon.title) ? 'animate-bounce' : ''}`} />
                        </button>
                      )}
                    </div>

                    {/* Sermon Notes Bar (If Notes exist for this sermon) */}
                    {hasNotes && (
                      <div className="bg-blue-950/30 border border-blue-500/20 p-2 rounded-xl flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-1.5 text-blue-300 font-bold text-[11px] truncate">
                          <FileText className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                          <span className="truncate">{sermon.notesFileName || 'Sermon Notes Document'}</span>
                        </div>

                        <div className="flex items-center space-x-1.5 flex-shrink-0">
                          <a
                            href={resolveNotesViewUrl(sermon)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 px-2 py-1 rounded-lg text-[10px] font-bold transition-colors flex items-center space-x-1"
                            title="View Sermon Notes"
                          >
                            <Eye className="w-3 h-3 text-blue-400" />
                            <span>View</span>
                          </a>

                          <a
                            href={resolveNotesDownloadUrl(sermon)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-white/5 hover:bg-white/10 text-gray-300 px-2 py-1 rounded-lg text-[10px] font-bold transition-colors flex items-center space-x-1"
                            title="Download Sermon Notes"
                          >
                            <FileDown className="w-3 h-3 text-blue-400" />
                            <span>Download</span>
                          </a>
                        </div>
                      </div>
                    )}

                  </div>

                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default SermonsPage;
