import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, AlertCircle, Play, Pause, Volume2, VolumeX, Maximize, Minimize, SkipBack, SkipForward, Phone } from "lucide-react";

interface VideoPlayerProps {
  videoUrl: string;
  title?: string;
  thumbnailUrl?: string;
  onClose?: () => void;
  directVideoUrl?: string;
}

export default function VideoPlayer({ videoUrl, title, thumbnailUrl, onClose, directVideoUrl }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [buffering, setBuffering] = useState(false);

  const finalVideoUrl = directVideoUrl || videoUrl;
  const hasValidUrl = finalVideoUrl && finalVideoUrl.trim() !== "";

  // Play/Pause
  const togglePlay = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
    }
  };

  // Mute/Unmute
  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  };

  // Volume Change
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      setVolume(newVolume);
      setIsMuted(newVolume === 0);
    }
  };

  // Progress Click
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (progressRef.current && videoRef.current) {
      const rect = progressRef.current.getBoundingClientRect();
      const percent = (e.clientX - rect.left) / rect.width;
      videoRef.current.currentTime = percent * duration;
    }
  };

  // Skip
  const skip = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime += seconds;
    }
  };

  // Fullscreen
  const toggleFullscreen = () => {
    if (!containerRef.current || !videoRef.current) return;
    
    // على الموبايل (iOS/Safari)، استخدم webkitEnterFullscreen للفيديو مباشرة
    const videoElement = videoRef.current as any;
    if (videoElement.webkitEnterFullscreen) {
      videoElement.webkitEnterFullscreen();
      return;
    }
    
    // على الويب، استخدم Fullscreen API
    if (!document.fullscreenElement) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      } else if ((containerRef.current as any).webkitRequestFullscreen) {
        (containerRef.current as any).webkitRequestFullscreen();
      } else if ((containerRef.current as any).mozRequestFullScreen) {
        (containerRef.current as any).mozRequestFullScreen();
      } else if ((containerRef.current as any).msRequestFullscreen) {
        (containerRef.current as any).msRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      } else if ((document as any).mozCancelFullScreen) {
        (document as any).mozCancelFullScreen();
      } else if ((document as any).msExitFullscreen) {
        (document as any).msExitFullscreen();
      }
    }
  };

  // Format Time
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Video Events
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleTimeUpdate = () => setCurrentTime(video.currentTime);
    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      setLoading(false);
    };
    const handleWaiting = () => setBuffering(true);
    const handleCanPlay = () => {
      setBuffering(false);
      setLoading(false);
    };
    const handleError = () => {
      setError("حدث خطأ في تحميل الفيديو");
      setLoading(false);
    };

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('error', handleError);

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('error', handleError);
    };
  }, []);

  // Fullscreen Change
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!videoRef.current) return;

      switch (e.key) {
        case ' ':
        case 'k':
          e.preventDefault();
          togglePlay();
          break;
        case 'f':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'm':
          e.preventDefault();
          toggleMute();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          skip(-10);
          break;
        case 'ArrowRight':
          e.preventDefault();
          skip(10);
          break;
        case 'Escape':
          if (isFullscreen) {
            document.exitFullscreen();
          } else if (onClose) {
            onClose();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isFullscreen, onClose]);

  // Auto-hide controls
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    const handleMouseMove = () => {
      setShowControls(true);
      clearTimeout(timeout);
      if (isPlaying && isFullscreen) {
        timeout = setTimeout(() => setShowControls(false), 3000);
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      clearTimeout(timeout);
    };
  }, [isPlaying, isFullscreen]);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl p-4"
        onClick={(e) => e.target === e.currentTarget && onClose?.()}
      >
        <motion.div
          ref={containerRef}
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="relative w-full max-w-6xl mx-auto bg-gradient-to-br from-gray-950 via-black to-gray-950 rounded-2xl overflow-hidden shadow-2xl border border-white/10"
          style={{ maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
        >
          {/* Title */}
          {title && !isFullscreen && !isPlaying && (
            <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/90 to-transparent p-2 sm:p-4 md:p-6 pr-10 sm:pr-16 md:pr-20">
              <h3 className="text-sm sm:text-base md:text-xl lg:text-2xl font-bold text-white line-clamp-2">{title}</h3>
            </div>
          )}

          {/* Close Button */}
          {onClose && !isFullscreen && !isPlaying && (
            <button
              onClick={onClose}
              className="absolute top-2 right-2 sm:top-4 sm:right-4 md:top-6 md:right-6 z-[100] bg-white/10 hover:bg-red-500/90 text-white rounded-lg sm:rounded-xl p-1.5 sm:p-2 md:p-2.5 transition-all duration-300 backdrop-blur-lg border border-white/20 hover:scale-110 hover:rotate-90 shadow-lg hover:shadow-red-500/50"
              aria-label="إغلاق"
            >
              <X className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5" strokeWidth={2.5} />
            </button>
          )}

          {/* Video Container */}
          <div className="relative w-full bg-black" style={{ aspectRatio: '16/9', maxHeight: '90vh' }}>
            {!hasValidUrl ? (
              <div className="absolute inset-0 flex items-center justify-center text-white bg-gradient-to-br from-gray-900 via-black to-gray-900">
                <div className="text-center px-8 max-w-2xl">
                  <AlertCircle className="w-24 h-24 mx-auto mb-6 text-orange-500" />
                  <h3 className="text-2xl md:text-3xl font-bold mb-4">رابط الفيديو غير متاح</h3>
                  <p className="text-lg text-gray-300 mb-6 leading-relaxed">
                    عذراً، رابط الفيديو غير متاح حالياً. يرجى التواصل مع مستر عمر للحصول على المساعدة.
                  </p>
                  <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
                    <div className="flex items-center justify-center gap-3 mb-4">
                      <Phone className="w-6 h-6 text-orange-500" />
                      <a 
                        href="tel:01146525436"
                        className="text-2xl font-bold text-orange-500 hover:text-orange-400 transition-colors"
                      >
                        01146525436
                      </a>
                    </div>
                    <p className="text-sm text-gray-400">
                      اضغط على الرقم للاتصال مباشرة
                    </p>
                  </div>
                </div>
              </div>
            ) : error ? (
              <div className="absolute inset-0 flex items-center justify-center text-white">
                <div className="text-center px-8 max-w-2xl">
                  <AlertCircle className="w-20 h-20 mx-auto mb-4 text-red-500" />
                  <p className="text-xl mb-4">{error}</p>
                  <p className="text-sm text-gray-400 break-all font-mono bg-gray-900/50 p-4 rounded-lg mb-4">
                    {finalVideoUrl}
                  </p>
                  <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700">
                    <p className="text-gray-300 mb-3">إذا استمرت المشكلة، يرجى التواصل مع مستر عمر:</p>
                    <div className="flex items-center justify-center gap-3">
                      <Phone className="w-5 h-5 text-orange-500" />
                      <a 
                        href="tel:01146525436"
                        className="text-lg font-semibold text-orange-500 hover:text-orange-400 transition-colors"
                      >
                        01146525436
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Loading */}
                {(loading || buffering) && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-20">
                    <div className="text-center">
                      <Loader2 className="w-16 h-16 text-orange-500 animate-spin mx-auto mb-4" />
                      <p className="text-white text-lg">جاري التحميل...</p>
                    </div>
                  </div>
                )}

                {/* Video */}
                <video
                  ref={videoRef}
                  className="w-full h-full"
                  playsInline
                  {...({
                    'webkit-playsinline': 'true',
                    'x5-video-player-type': 'h5',
                    'x5-video-player-fullscreen': 'true',
                    'x5-video-orientation': 'portrait'
                  } as any)}
                  onClick={togglePlay}
                  onContextMenu={(e) => e.preventDefault()}
                  style={{
                    objectFit: 'contain',
                    width: '100%',
                    height: '100%',
                    display: 'block'
                  }}
                >
                  <source src={finalVideoUrl} type="video/mp4" />
                  <source src={finalVideoUrl} type="video/webm" />
                  المتصفح الخاص بك لا يدعم تشغيل الفيديو.
                </video>

                {/* Controls */}
                <AnimatePresence>
                  {!isPlaying && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 20 }}
                      className="absolute bottom-0 left-0 right-0 z-30 bg-gradient-to-t from-black/95 via-black/80 to-transparent backdrop-blur-sm sm:backdrop-blur-md"
                    >
                      {/* Progress Bar */}
                      <div
                        ref={progressRef}
                        onClick={handleProgressClick}
                        className="relative h-1.5 sm:h-2 bg-white/20 cursor-pointer group sm:hover:h-3 transition-all"
                      >
                        <div
                          className="absolute top-0 left-0 h-full bg-gradient-to-r from-orange-600 to-red-600"
                          style={{ width: `${progress}%` }}
                        />
                        <div
                          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4 bg-white rounded-full shadow-lg opacity-0 sm:group-hover:opacity-100 transition-opacity"
                          style={{ left: `${progress}%`, transform: 'translate(-50%, -50%)' }}
                        />
                      </div>

                      {/* Control Buttons */}
                      <div className="flex items-center justify-between px-2 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 gap-2 sm:gap-3 md:gap-4">
                        {/* Left Side */}
                        <div className="flex items-center gap-1 sm:gap-2 md:gap-3 flex-1 min-w-0">
                          {/* Play/Pause */}
                          <button
                            onClick={togglePlay}
                            className="text-white hover:text-orange-500 transition-colors p-1.5 sm:p-2 hover:bg-white/10 rounded-lg flex-shrink-0"
                          >
                            {isPlaying ? <Pause className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" /> : <Play className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" fill="currentColor" />}
                          </button>

                          {/* Skip Buttons - مخفية على الموبايل */}
                          <button
                            onClick={() => skip(-10)}
                            className="hidden sm:flex text-white hover:text-orange-500 transition-colors p-1.5 sm:p-2 hover:bg-white/10 rounded-lg"
                          >
                            <SkipBack className="w-4 h-4 sm:w-5 sm:h-5" />
                          </button>
                          <button
                            onClick={() => skip(10)}
                            className="hidden sm:flex text-white hover:text-orange-500 transition-colors p-1.5 sm:p-2 hover:bg-white/10 rounded-lg"
                          >
                            <SkipForward className="w-4 h-4 sm:w-5 sm:h-5" />
                          </button>

                          {/* Volume - مخفية على الموبايل */}
                          <div className="hidden md:flex items-center gap-2">
                            <button
                              onClick={toggleMute}
                              className="text-white hover:text-orange-500 transition-colors p-1.5 sm:p-2 hover:bg-white/10 rounded-lg"
                            >
                              {isMuted || volume === 0 ? <VolumeX className="w-4 h-4 sm:w-5 sm:h-5" /> : <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" />}
                            </button>
                            <input
                              type="range"
                              min="0"
                              max="1"
                              step="0.01"
                              value={isMuted ? 0 : volume}
                              onChange={handleVolumeChange}
                              className="w-16 sm:w-20 h-1 bg-white/30 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer"
                            />
                          </div>

                          {/* Mute Button فقط على الموبايل */}
                          <button
                            onClick={toggleMute}
                            className="md:hidden text-white hover:text-orange-500 transition-colors p-1.5 hover:bg-white/10 rounded-lg flex-shrink-0"
                          >
                            {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                          </button>

                          {/* Time */}
                          <div className="text-white text-xs sm:text-sm font-mono flex-shrink-0 ml-auto sm:ml-0">
                            <span className="hidden sm:inline">{formatTime(currentTime)} / {formatTime(duration)}</span>
                            <span className="sm:hidden">{formatTime(currentTime)}</span>
                          </div>
                        </div>

                        {/* Right Side */}
                        <div className="flex items-center gap-1 sm:gap-2 md:gap-3 flex-shrink-0">
                          {/* Fullscreen */}
                          <button
                            onClick={toggleFullscreen}
                            className="text-white hover:text-orange-500 transition-colors p-1.5 sm:p-2 hover:bg-white/10 rounded-lg"
                          >
                            {isFullscreen ? <Minimize className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" /> : <Maximize className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

