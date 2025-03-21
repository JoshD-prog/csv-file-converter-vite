<script>
  export let errors = [];
  export let showModal = false;

  // Detect system color scheme preference
  let isDarkMode = false;

  // Function to update theme based on system preference
  function updateTheme() {
    if (typeof window !== "undefined") {
      isDarkMode =
        window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
  }

  // Set theme on component initialization
  if (typeof window !== "undefined") {
    updateTheme();

    // Listen for changes in system preferences
    window
      .matchMedia("(prefers-color-scheme: dark)")
      .addEventListener("change", updateTheme);
  }

  function closeModal() {
    showModal = false;
    errors = [];
  }
</script>

{#if showModal}
  <div class="modal-overlay" class:dark={isDarkMode} on:click={closeModal}>
    <div class="modal-content" on:click={(e) => e.stopPropagation()}>
      <h2>An Error has Occurred</h2>
      <div class="error-container">
        {#if errors.length > 0}
          <ul>
            {#each errors as error (error)}
              <li>{error}</li>
            {/each}
          </ul>
        {:else}
          <p>No errors to display.</p>
        {/if}
      </div>
      <button class="close-button" on:click={closeModal}>Close</button>
    </div>
  </div>
{/if}

<style>
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000; /* Very high z-index to ensure it's on top */
    padding: 20px;
    box-sizing: border-box;
  }

  .modal-overlay.dark {
    background: rgba(0, 0, 0, 0.7);
  }

  .modal-content {
    background: #fff;
    color: #333;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 0 20px rgba(0, 0, 0, 0.3);
    max-width: 500px;
    width: 100%;
    text-align: left;
    max-height: 80vh; /* Maximum height relative to viewport */
    display: flex;
    flex-direction: column;
    position: relative;
    transition:
      background-color 0.3s,
      color 0.3s;
  }

  .dark .modal-content {
    background: #282828;
    color: #f7fafc;
    box-shadow: 0 0 20px rgba(0, 0, 0, 0.6);
  }

  .error-container {
    overflow-y: auto; /* Enable vertical scrolling */
    max-height: 60vh; /* Maximum height for the error content */
    margin: 10px 0;
    padding-right: 5px; /* Space for scrollbar */
  }

  h2 {
    margin-top: 0;
    color: #e53e3e;
    font-size: 1.5rem;
    border-bottom: 1px solid #eee;
    padding-bottom: 10px;
  }

  .dark h2 {
    border-bottom-color: #4a5568;
  }

  ul {
    margin: 0;
    padding-left: 20px;
    text-align: left;
  }

  li {
    margin-bottom: 8px;
    line-height: 1.4;
  }

  .close-button {
    background-color: #e53e3e;
    color: white;
    border: none;
    padding: 10px 16px;
    border-radius: 6px;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.2s;
    margin-top: 10px;
    align-self: flex-end;
  }

  .close-button:hover {
    background-color: #c53030;
  }

  .dark .close-button {
    background-color: #fc8181;
    color: #1a202c;
  }

  .dark .close-button:hover {
    background-color: #f56565;
  }

  /* Custom scrollbar styling - Light Mode */
  .error-container::-webkit-scrollbar {
    width: 8px;
  }

  .error-container::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 4px;
  }

  .error-container::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 4px;
  }

  .error-container::-webkit-scrollbar-thumb:hover {
    background: #a1a1a1;
  }

  /* Custom scrollbar styling - Dark Mode */
  .dark .error-container::-webkit-scrollbar-track {
    background: #1f1f1f;
  }

  .dark .error-container::-webkit-scrollbar-thumb {
    background: #484848;
  }

  .dark .error-container::-webkit-scrollbar-thumb:hover {
    background: #a0a0a0;
  }
</style>

