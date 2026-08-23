import React, { useRef, useState } from "react";

// Intro video ("VSL") — sits in a 16:9 frame with a poster image and a
// play button overlay, matching the homepage design mock. Clicking the
// button starts playback and reveals native controls.
function VslSection() {
  const videoRef = useRef(null);
  const [playing, setPlaying] = useState(false);

  const handlePlay = () => {
    setPlaying(true);
    // Wait a tick so the <video> (with controls) is in the DOM before playing
    requestAnimationFrame(() => {
      videoRef.current?.play().catch(() => {});
    });
  };

  return (
    <section className="px-6 py-4 md:px-12 lg:px-24 bg-white">
      <div
        className="relative mx-auto w-full max-w-[980px] overflow-hidden rounded-[28px] border-2 aspect-video"
        style={{
          borderColor: "#17110e",
          background: "#2b5d63",
          boxShadow: "0 10px 0 #d9a664",
        }}
      >
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          src="/Home/vsl.mp4"
          poster="/Home/vsl-poster.jpg"
          controls={playing}
          playsInline
          preload="metadata"
          onPause={() => setPlaying(false)}
          onEnded={() => setPlaying(false)}
        />

        {!playing && (
          <div className="absolute inset-0 flex items-center justify-center">
            <button
              type="button"
              onClick={handlePlay}
              aria-label="Play intro video"
              className="flex items-center justify-center w-24 h-24 rounded-full border-[3px] transition-transform hover:-translate-y-0.5"
              style={{
                background: "#a91f24",
                borderColor: "#17110e",
                boxShadow: "0 6px 0 #6f1216",
              }}
            >
              <span
                className="block ml-1.5"
                style={{
                  width: 0,
                  height: 0,
                  borderTop: "16px solid transparent",
                  borderBottom: "16px solid transparent",
                  borderLeft: "26px solid #fff",
                }}
              />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

export default VslSection;
