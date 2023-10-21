<script>
  export let errors = [];

  export let showModal = false;

  function closeModal() {
    showModal = false;
    errors = [];
  }
</script>

{#if showModal}
  <div class="modal-overlay" on:click={closeModal}>
    <div class="modal-content" on:click={(e) => e.stopPropagation()}>
      <h2>An Error has Occurred</h2>
      {#if errors.length > 0}
        <ul>
          {#each errors as error (error)}
            <li>{error}</li>
          {/each}
        </ul>
      {:else}
        <p>No errors to display.</p>
      {/if}
      <button on:click={closeModal}>Close</button>
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
  }

  .modal-content {
    background: #fff;
    color: #000;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
    max-width: 400px;
    width: 100%;
    text-align: center;
  }
</style>
