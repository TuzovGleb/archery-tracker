import { useEffect, useRef } from 'react'

const SILENT_VIDEO_DATA_URL =
  'data:video/mp4;base64,AAAAHGZ0eXBpc29tAAACAGlzb21pc28ybXA0MQAAAAhmcmVlAAAAFm1kYXQAAAGzABAHAAABthBgUYJDAAACVm1vb3YAAABsbXZoZAAAAAAAAAAAAAAAAAAAA+gAAAPAAAEAAAEAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAACK3RyYWsAAABcdGtoZAAAAAMAAAAAAAAAAAAAAAEAAAAAAAADwAAAAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAEAAAAACgAAAAWgAAAAAACRlZHRzAAAAHGVsc3QAAAAAAAAAAQAAA8AAAAAAAAEAAAAAAaNtZGlhAAAAIG1kaGQAAAAAAAAAAAAAAAAAACgAAAAIAFXEAAAAAAAtaGRscgAAAAAAAAAAdmlkZQAAAAAAAAAAAAAAAFZpZGVvSGFuZGxlcgAAAAFObWluZgAAABR2bWhkAAAAAQAAAAAAAAAAAAAAJGRpbmYAAAAcZHJlZgAAAAAAAAABAAAADHVybCAAAAABAAABDnN0YmwAAACSc3RzZAAAAAAAAAABAAAAgmF2YzEAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAACgAFoAEgAAABIAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGP//AAAAMGF2Y0MBQsAJ/+EAGGdCwAk0jBXyG5IFAGmAACjUCBwIDQUyTAEABGjIyhAAAAAYc3R0cwAAAAAAAAABAAAAAQAACAAAAAAcc3RzYwAAAAAAAAABAAAAAQAAAAEAAAABAAAAFHN0c3oAAAAAAAAAvwAAAAEAAAAUc3RjbwAAAAAAAAABAAAAMA=='

export function WakeLock() {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const sentinelRef = useRef<WakeLockSentinel | null>(null)

  useEffect(() => {
    let mounted = true
    const useNative = 'wakeLock' in navigator
    const acquire = async () => {
      if (useNative) {
        try {
          const sentinel: WakeLockSentinel = await navigator.wakeLock.request('screen')
          if (!mounted) {
            sentinel.release().catch(() => {})
          } else {
            sentinelRef.current = sentinel
            sentinel.addEventListener('release', () => {
              sentinelRef.current = null
            })
          }
        } catch {
          // fall back to video silent loop
          tryVideo()
        }
      } else {
        tryVideo()
      }
    }

    const tryVideo = () => {
      const v = videoRef.current
      if (!v) return
      v.muted = true
      v.loop = true
      v.playsInline = true
      v.play().catch(() => {})
    }

    const onVisibility = () => {
      if (document.visibilityState === 'visible' && useNative && !sentinelRef.current) {
        acquire()
      }
    }

    acquire()
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      mounted = false
      document.removeEventListener('visibilitychange', onVisibility)
      if (sentinelRef.current) {
        sentinelRef.current.release().catch(() => {})
        sentinelRef.current = null
      }
      const v = videoRef.current
      if (v) {
        v.pause()
      }
    }
  }, [])

  return (
    <video
      ref={videoRef}
      src={SILENT_VIDEO_DATA_URL}
      muted
      loop
      playsInline
      autoPlay
      tabIndex={-1}
      aria-hidden
      className="fixed bottom-0 right-0 w-px h-px opacity-0 pointer-events-none"
    />
  )
}
