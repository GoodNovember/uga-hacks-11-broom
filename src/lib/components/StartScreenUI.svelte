<script>
  let { onPlay, onPlayKeyboard, onPlayGamepad, onPlayTouch, hasCamera, hasPointer, hasGamepad, hasTouch } = $props()

  let dialog = $state()

  function openDialog() {
    dialog?.showModal()
  }

  function pick(handler) {
    dialog?.close()
    handler()
  }

  const modes = [
    {
      name: "Hands",
      get available() { return hasCamera },
      hint: "No camera detected",
      get handler() { return () => pick(onPlay) },
      controls: [
        "Point to fly forward",
        "2 fingers to rise",
        "3 fingers to descend",
        "Open palm (hold) to pause",
      ]
    },
    {
      name: "Keyboard & Mouse",
      get available() { return hasPointer },
      hint: "No mouse detected",
      get handler() { return () => pick(onPlayKeyboard) },
      controls: [
        "W to fly forward",
        "Space + W to rise, Shift + W to descend",
        "A / D or mouse to steer",
        "Esc to pause",
      ]
    },
    {
      name: "Gamepad",
      get available() { return hasGamepad },
      hint: "Connect a controller",
      get handler() { return () => pick(onPlayGamepad) },
      controls: [
        "Left stick to steer and fly",
        "Bumpers (L1/R1) to rise",
        "Triggers (L2/R2) to descend",
        "Start to pause",
      ]
    },
    {
      name: "Touch",
      get available() { return hasTouch },
      hint: "No touch screen detected",
      get handler() { return () => pick(onPlayTouch) },
      controls: [
        "Virtual joystick to steer and fly",
        "Up button to rise",
        "Down button to descend",
        "Pause button (top-right)",
      ]
    },
  ]
</script>

<div class="start-screen-overlay">
  <div class="title-container">
    <h1 class="game-title">BROOMHANDLE</h1>
  </div>

  <button class="play-button" onclick={openDialog}>
    PLAY
  </button>
</div>

<dialog bind:this={dialog}>
  <h2 class="dialog-title">Choose Your Controls</h2>

  <div class="mode-grid">
    {#each modes as mode}
      <button
        class="mode-card"
        disabled={!mode.available}
        onclick={mode.handler}
      >
        <span class="mode-name">{mode.name}</span>
        {#if mode.available}
          <ul class="mode-controls">
            {#each mode.controls as line}
              <li>{line}</li>
            {/each}
          </ul>
        {:else}
          <span class="mode-hint">{mode.hint}</span>
        {/if}
      </button>
    {/each}
  </div>

  <button class="back-btn" onclick={() => dialog?.close()}>Back</button>
</dialog>

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
    font-size: 5dvw;
    font-weight: 900;
    color: gold;
    text-shadow: 0 0 40px rgba(0,0,0,0.7), 0 4px 8px rgba(0, 0, 0, 0.5);
    background-clip: text;
    margin: 0;
    letter-spacing: 0.1em;
    margin-bottom: 8rem;
    width: 100%;
  }

  .play-button {
    pointer-events: all;
    padding: 1.2rem 6rem;
    font-size: 2rem;
    font-weight: 900;
    border: none;
    border-radius: 1rem;
    background: linear-gradient(135deg, #FFD700, #FFA500);
    color: #1a1a2e;
    cursor: pointer;
    letter-spacing: 0.2em;
    transition: transform 0.2s, box-shadow 0.2s;
    box-shadow: 0 0 30px rgba(255, 215, 0, 0.3);
  }

  .play-button:hover {
    transform: scale(1.08);
    box-shadow: 0 0 50px rgba(255, 215, 0, 0.5);
  }

  /* Dialog */
  dialog {
    border: none;
    border-radius: 1.5rem;
    background: #1a1a2e;
    color: white;
    padding: 2rem;
    max-width: 52rem;
    width: 90vw;
  }

  dialog::backdrop {
    background: rgba(0, 0, 0, 0.7);
  }

  .dialog-title {
    text-align: center;
    font-size: 1.5rem;
    font-weight: 700;
    margin: 0 0 1.5rem;
    color: #FFD700;
  }

  .mode-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
    gap: 1rem;
  }

  .mode-card {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
    padding: 1.25rem;
    border-radius: 1rem;
    border: 2px solid rgba(255, 215, 0, 0.25);
    background: rgba(255, 255, 255, 0.05);
    color: white;
    cursor: pointer;
    text-align: left;
    transition: border-color 0.2s, background 0.2s;
    font-family: inherit;
  }

  .mode-card:hover:not(:disabled) {
    border-color: #FFD700;
    background: rgba(255, 215, 0, 0.1);
  }

  .mode-card:disabled {
    opacity: 0.4;
    cursor: not-allowed;
    border-color: rgba(255, 255, 255, 0.1);
  }

  .mode-name {
    font-size: 1.15rem;
    font-weight: 700;
    color: #FFD700;
  }

  .mode-controls {
    margin: 0;
    padding-left: 1.2rem;
    font-size: 0.85rem;
    line-height: 1.6;
    color: rgba(255, 255, 255, 0.75);
  }

  .mode-hint {
    font-size: 0.85rem;
    color: rgba(255, 255, 255, 0.45);
    font-style: italic;
  }

  .back-btn {
    display: block;
    margin: 1.5rem auto 0;
    padding: 0.5rem 2rem;
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 0.5rem;
    background: transparent;
    color: rgba(255, 255, 255, 0.6);
    font-size: 0.9rem;
    cursor: pointer;
    transition: color 0.2s, border-color 0.2s;
    font-family: inherit;
  }

  .back-btn:hover {
    color: white;
    border-color: rgba(255, 255, 255, 0.5);
  }
</style>
