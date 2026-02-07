<script>
  let { onPlay, onPlayKeyboard, onPlayGamepad } = $props()
</script>

<div class="start-screen-overlay">
  <div class="title-container">
    <h1 class="game-title">BROOMHANDLE</h1>
    <!-- <p class="game-subtitle">Ride the skies. Collect the rings.</p> -->
  </div>

  <div class="actions">
    <button class="play-button" onclick={onPlay}>
      Play With Your Hands
    </button>
    
    <button class="play-button" onclick={onPlayKeyboard}>
      Play With Mouse and Keyboard
    </button>

    <button class="play-button" onclick={onPlayGamepad}>
      Play With Gamepad
    </button>
  </div>
</div>

<style>
  .start-screen-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    pointer-events: none;
    z-index: 5;
  }

  .title-container {
    text-align: center;
    margin-bottom: 3rem;
  }

  .game-title {
    font-size: 5rem;
    font-weight: 900;
    color: white;
    text-shadow: 0 0 40px rgba(255, 215, 0, 0.6),
                 0 4px 8px rgba(0, 0, 0, 0.5);
    background: linear-gradient(135deg, #FFD700, #FFA500);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin: 0;
    letter-spacing: 0.1em;
    margin-bottom: 8rem;
  }

  .actions {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  } 

  .game-subtitle {
    font-size: 1.3rem;
    color: rgba(255, 255, 255, 0.7);
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
    margin-top: 0.5rem;
    margin-bottom: 8rem;
  }

  .play-button {
    pointer-events: all;
    padding: 1rem 4rem;
    font-size: 1.5rem;
    font-weight: 700;
    border: none;
    border-radius: 1rem;
    background: linear-gradient(135deg, #FFD700, #FFA500);
    color: #1a1a2e;
    cursor: pointer;
    letter-spacing: 0.15em;
    transition: transform 0.2s, box-shadow 0.2s;
    box-shadow: 0 0 30px rgba(255, 215, 0, 0.3);
  }

  .play-button:hover {
    transform: scale(1.08);
    box-shadow: 0 0 50px rgba(255, 215, 0, 0.5);
  }

  .play-button:disabled {
    background: linear-gradient(135deg, #888888, #555555);
    color: #1a1a2e;
    cursor: not-allowed;
    box-shadow: none;
  }
</style>
