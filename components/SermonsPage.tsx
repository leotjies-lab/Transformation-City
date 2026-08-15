import React, { useState, useEffect, useRef } from 'react';
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
  Sparkles
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
    audioUrl: '/api/drive/stream/16YLr7CLZmgTyFdxZSsOgbwjl8QvL1W8o',
    downloadUrl: '/api/drive/download/16YLr7CLZmgTyFdxZSsOgbwjl8QvL1W8o?filename=2026_07_19_Biblical%20perspective%20on%20money.mp3',
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
    audioUrl: '/api/drive/stream/18tH_SH0kTCwTp7Ma49rW6k0s1RMeqGqm',
    downloadUrl: '/api/drive/download/18tH_SH0kTCwTp7Ma49rW6k0s1RMeqGqm?filename=2026_06_28_The%20ancient%20path%20part%204.mp3',
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
    audioUrl: '/api/drive/stream/12PYuGlFdS3KLWto8S18LeMtupkdNJGjv',
    downloadUrl: '/api/drive/download/12PYuGlFdS3KLWto8S18LeMtupkdNJGjv?filename=2026_06_14_The%20ancient%20path%20part%203.mp3',
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
    audioUrl: '/api/drive/stream/1ReJxmN-zXchGunyr_6v0SqZrk_ZhA1nz',
    downloadUrl: '/api/drive/download/1ReJxmN-zXchGunyr_6v0SqZrk_ZhA1nz?filename=2026_06_14_The%20ancient%20path%20part%202.mp3',
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
    audioUrl: '/api/drive/stream/1a-2WVQXSWHL1oOx0b2GTUwKnXG4oPhT7',
    downloadUrl: '/api/drive/download/1a-2WVQXSWHL1oOx0b2GTUwKnXG4oPhT7?filename=2026_06_07_The%20ancient%20path.mp3',
    driveFileId: '1a-2WVQXSWHL1oOx0b2GTUwKnXG4oPhT7',
    driveFileName: '2026_06_07_The ancient path.mp3',
    driveWebViewLink: 'https://drive.google.com/drive/folders/1qi4li-RY2flBnRt6wLfnpXpu4JeY_yVM',
    isPublished: true,
  }
];

interface SermonsPageProps {
  onNavigate?: (path: string) => void;
}

const SermonsPage: React.FC<SermonsPageProps> = () => {
  const [sermons, setSermons] = useState<Sermon[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Sorting state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTheme, setSelectedTheme] = useState('All');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'title_asc' | 'length_desc'>('date_desc');

  // Currently playing audio state
  const [activeSermonId, setActiveSermonId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);

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

  // Helper to resolve streamable audio source (handles Google Drive URLs and proxy routing)
  const resolveStreamableAudioUrl = (sermon: Sermon): string => {
    if (sermon.driveFileId) {
      return `/api/drive/stream/${sermon.driveFileId}`;
    }
    if (sermon.driveFileName) {
      return `/api/drive/stream-by-name?filename=${encodeURIComponent(sermon.driveFileName)}`;
    }
    const url = sermon.audioUrl || '';
    if (!url) return '';

    // If it's already an app-relative stream URL
    if (url.startsWith('/api/')) return url;

    // Check if Google Drive file ID is inside URL
    const driveMatch = url.match(/(?:id=|\/d\/|file\/d\/)([a-zA-Z0-9_-]{25,})/);
    if (driveMatch && driveMatch[1]) {
      return `/api/drive/stream/${driveMatch[1]}`;
    }

    // For any external URL, proxy it to guarantee proper CORS and audio content-type
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return `/api/audio-proxy?url=${encodeURIComponent(url)}`;
    }

    return url;
  };

  // Helper to resolve direct attachment download URL (forces immediate file download)
  const resolveDirectDownloadUrl = (sermon: Sermon): string => {
    // Priority: 1) Exact Google Drive filename, 2) Title string
    const targetFileName = sermon.driveFileName || (sermon.title ? `${sermon.title}.mp3` : 'sermon.mp3');

    if (sermon.driveFileId) {
      return `/api/drive/download/${sermon.driveFileId}?filename=${encodeURIComponent(targetFileName)}`;
    }

    if (sermon.driveFileName) {
      return `/api/drive/download-by-name?filename=${encodeURIComponent(sermon.driveFileName)}`;
    }

    const rawUrl = sermon.downloadUrl || sermon.audioUrl || '';
    if (!rawUrl) return '#';

    // Check if URL contains Google Drive file ID
    const driveMatch = rawUrl.match(/(?:id=|\/d\/|file\/d\/)([a-zA-Z0-9_-]{25,})/);
    if (driveMatch && driveMatch[1]) {
      return `/api/drive/download/${driveMatch[1]}?filename=${encodeURIComponent(targetFileName)}`;
    }

    // Proxy external URLs so Content-Disposition: attachment is enforced
    if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) {
      return `/api/audio-download?url=${encodeURIComponent(rawUrl)}&filename=${encodeURIComponent(targetFileName)}`;
    }

    return rawUrl;
  };

  // Handle Play/Pause
  const handleTogglePlay = async (sermon: Sermon) => {
    const streamUrl = resolveStreamableAudioUrl(sermon);
    if (!streamUrl && !sermon.audioUrl) return;

    if ('mediaSession' in navigator) {
      try {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: sermon.title || 'Sermon Audio',
          artist: sermon.speaker || 'Pastor Leon Louw',
          album: sermon.driveFileName || sermon.series || 'Kingdom Foundations',
        });
      } catch (_) {}
    }

    if (activeSermonId === sermon.id) {
      if (isPlaying) {
        audioRef.current?.pause();
        setIsPlaying(false);
      } else {
        try {
          await audioRef.current?.play();
          setIsPlaying(true);
        } catch (e: any) {
          console.warn("Audio resume error:", e?.message || String(e));
          setIsPlaying(false);
        }
      }
    } else {
      setActiveSermonId(sermon.id || null);
      setIsPlaying(true);
      if (audioRef.current) {
        const primarySrc = streamUrl || sermon.audioUrl;
        audioRef.current.src = primarySrc;
        audioRef.current.load();
        try {
          await audioRef.current.play();
        } catch (e: any) {
          console.warn("Audio play error:", e?.message || String(e));
          setIsPlaying(false);
        }
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
      setDuration(audioRef.current.duration || 0);
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

    return matchesSearch && matchesTheme;
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

  const activeSermon = sermons.find(s => s.id === activeSermonId);

  return (
    <div className="bg-gray-950 text-white min-h-screen pt-24 pb-20">
      {/* Hidden Audio Element for Playback */}
      <audio 
        ref={audioRef} 
        preload="auto"
        onTimeUpdate={handleTimeUpdate} 
        onEnded={() => setIsPlaying(false)}
        onCanPlay={() => {
          if (audioRef.current && isPlaying) {
            audioRef.current.play().catch((playErr) => {
              console.warn("Audio auto-play warning:", playErr?.message || String(playErr));
            });
          }
        }}
        onLoadedMetadata={() => {
          if (audioRef.current) {
            setDuration(audioRef.current.duration || 0);
          }
        }}
        onError={() => {
          const errCode = audioRef.current?.error?.code;
          const errMsg = audioRef.current?.error?.message;
          console.warn("Audio player error code:", errCode, errMsg || "");
          setIsPlaying(false);
        }}
      />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-red-950/60 via-gray-900 to-gray-950 border-b border-white/10 py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-6">
          <h1 className="text-4xl sm:text-6xl font-black uppercase tracking-tight text-white leading-none">
            Sermon <span className="text-[#d32f2f]">Recordings</span>
          </h1>

          <p className="text-base sm:text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed font-normal">
            Listen to life-transforming messages, Sunday teachings, and spiritual encouragement from Transformation City Church. Stream or download anytime.
          </p>
        </div>
      </section>

      {/* Controls & Filter Bar */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-20">
        <div className="bg-gray-900 border border-white/10 p-5 rounded-3xl shadow-2xl space-y-4 md:space-y-0 md:flex md:items-center md:justify-between md:space-x-4">
          
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

          {/* Theme Category Filter */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center space-x-1.5 mr-1">
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
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Sort By:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-xs font-bold text-white outline-none cursor-pointer"
            >
              <option value="date_desc" className="bg-gray-900 text-white">Date: Newest First</option>
              <option value="date_asc" className="bg-gray-900 text-white">Date: Oldest First</option>
              <option value="title_asc" className="bg-gray-900 text-white">Title: A-Z</option>
            </select>
          </div>

        </div>
      </section>

      {/* Persistent Audio Sticky Player Bar (When Playing) */}
      {activeSermon && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900/95 backdrop-blur-xl border-t border-red-500/30 p-4 shadow-2xl transition-all animate-in slide-in-from-bottom">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            
            {/* Info */}
            <div className="flex items-center space-x-3 w-full md:w-1/3">
              <button 
                onClick={() => handleTogglePlay(activeSermon)}
                className="w-11 h-11 bg-[#d32f2f] hover:bg-red-700 text-white rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95 flex-shrink-0"
              >
                {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
              </button>
              <div className="min-w-0">
                <h4 className="text-sm font-black text-white truncate">{activeSermon.title}</h4>
                <p className="text-xs text-gray-400 truncate">{activeSermon.speaker} • {activeSermon.sermonDate}</p>
              </div>
            </div>

            {/* Scrubber & Controls */}
            <div className="flex items-center space-x-3 w-full md:w-1/2">
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

            {/* Download & Drive Link */}
            <div className="flex items-center space-x-2 w-full md:w-auto justify-end">
              <button
                onClick={(e) => handleDownloadSermon(e, activeSermon)}
                disabled={downloadingId === (activeSermon.id || activeSermon.title)}
                className="bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-3 py-2 rounded-xl border border-white/10 flex items-center space-x-1.5 transition-all disabled:opacity-50 cursor-pointer"
                title="Download MP3 Audio File"
              >
                <Download className={`w-3.5 h-3.5 text-red-400 ${downloadingId === (activeSermon.id || activeSermon.title) ? 'animate-bounce' : ''}`} />
                <span>{downloadingId === (activeSermon.id || activeSermon.title) ? 'Downloading...' : 'Download'}</span>
              </button>
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
              No published sermon recordings matched your criteria. Try adjusting your search query or theme filter.
            </p>
            <button
              onClick={() => { setSearchQuery(''); setSelectedTheme('All'); }}
              className="bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-4 py-2 rounded-xl border border-white/10"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSermons.map((sermon) => {
              const isCurrentPlaying = activeSermonId === sermon.id && isPlaying;

              return (
                <div 
                  key={sermon.id || sermon.title}
                  className={`bg-gray-900 border rounded-3xl p-6 transition-all duration-300 flex flex-col justify-between space-y-5 hover:border-red-500/40 hover:shadow-2xl group ${
                    activeSermonId === sermon.id ? 'border-red-500/50 bg-gray-900/90 ring-1 ring-red-500/30' : 'border-white/10'
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
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-4 border-t border-white/10 flex items-center justify-between gap-3">
                    <button
                      onClick={() => handleTogglePlay(sermon)}
                      className={`flex-1 py-3 px-4 rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center space-x-2 shadow-lg ${
                        isCurrentPlaying 
                          ? 'bg-amber-500 text-gray-950 font-black' 
                          : 'bg-[#d32f2f] hover:bg-red-700 text-white'
                      }`}
                    >
                      {isCurrentPlaying ? (
                        <>
                          <Pause className="w-4 h-4 fill-current" />
                          <span>Pause Audio</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 fill-current ml-0.5" />
                          <span>Listen Now</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={(e) => handleDownloadSermon(e, sermon)}
                      disabled={downloadingId === (sermon.id || sermon.title)}
                      className="bg-white/5 hover:bg-white/15 text-gray-200 border border-white/10 p-3 rounded-2xl transition-all cursor-pointer disabled:opacity-50"
                      title="Download MP3 Audio File"
                    >
                      <Download className={`w-4 h-4 text-red-400 ${downloadingId === (sermon.id || sermon.title) ? 'animate-bounce' : ''}`} />
                    </button>
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
