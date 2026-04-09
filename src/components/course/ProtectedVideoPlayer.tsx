"use client";

import { useState } from "react";
import { Play } from "lucide-react";

interface ProtectedVideoPlayerProps {
  videoUrl: string | null;
  title?: string;
}

/**
 * Защищённый видеоплеер.
 *
 * Поддерживает два режима:
 * 1. Kinescope (DRM) — если videoUrl содержит "kinescope.io"
 *    Обеспечивает защиту от записи экрана (чёрный экран при скринкасте).
 *    Формат URL: https://kinescope.io/embed/{videoId}
 *
 * 2. Прямой URL на видео — для тестирования и видео без DRM.
 *    Базовая защита: блокировка ПКМ, запрет скачивания.
 */
export default function ProtectedVideoPlayer({ videoUrl, title }: ProtectedVideoPlayerProps) {
  const [showVideo, setShowVideo] = useState(false);

  if (!videoUrl) {
    return (
      <div className="relative aspect-video bg-bg-secondary rounded-2xl overflow-hidden neon-border flex items-center justify-center">
        <div className="text-center">
          <Play className="w-16 h-16 text-accent/30 mx-auto mb-3" />
          <p className="text-text-muted">Видео будет добавлено</p>
        </div>
      </div>
    );
  }

  // Kinescope embed — DRM защита от записи экрана
  const isKinescope = videoUrl.includes("kinescope.io");

  if (isKinescope) {
    return (
      <div className="relative aspect-video rounded-2xl overflow-hidden neon-border">
        <iframe
          src={videoUrl}
          className="w-full h-full"
          allow="autoplay; fullscreen; picture-in-picture; encrypted-media; screen-wake-lock"
          allowFullScreen
          style={{ border: "none" }}
        />
      </div>
    );
  }

  // Fallback: прямой URL на видео (для тестирования)
  return (
    <div
      className="relative aspect-video bg-black rounded-2xl overflow-hidden neon-border group select-none"
      onContextMenu={(e) => e.preventDefault()}
    >
      {!showVideo ? (
        <div
          className="w-full h-full flex items-center justify-center cursor-pointer"
          onClick={() => setShowVideo(true)}
        >
          <div className="w-20 h-20 rounded-full bg-accent/90 flex items-center justify-center neon-glow hover:scale-110 transition-transform">
            <Play className="w-8 h-8 text-white ml-1" fill="white" />
          </div>
          {title && (
            <p className="absolute bottom-6 left-6 text-white/70 text-sm">{title}</p>
          )}
        </div>
      ) : (
        <video
          className="w-full h-full"
          controls
          autoPlay
          controlsList="nodownload noplaybackrate"
          disablePictureInPicture
          playsInline
          onContextMenu={(e) => e.preventDefault()}
        >
          <source src={videoUrl} type="video/mp4" />
        </video>
      )}
    </div>
  );
}
