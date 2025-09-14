import React from 'react';

function Controls({ isPlaying, onPlayPause }) {
  return (
    <div className="controls">
      <button className="play-button" onClick={onPlayPause}>
        {isPlaying ? 'Pause' : 'Play'}
      </button>
    </div>
  );
}

export default Controls;