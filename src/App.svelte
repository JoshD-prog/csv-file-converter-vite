<script>
  import { generateCSVText } from './helpers/convertCSV';
  import ErrorModal from './lib/ErrorModal.svelte';

  let csvText = '';
  let uploadError = '';
  let isVisa = false; // Initialize the checkbox value to false

  function handleUpload(event) {
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = (event) => {
      if (event.target.result instanceof ArrayBuffer) {
        // If the result is an ArrayBuffer, convert it to a string
        const decoder = new TextDecoder('utf-8');
        csvText = decoder.decode(event.target.result);
      } else {
        // If it's already a string, use it as is
        csvText = event.target.result;
      }

      uploadError = '';
    };

    reader.onerror = (event) => {
      uploadError = 'Error reading the uploaded file.';
    };

    reader.readAsArrayBuffer(file);
  }

  let errors = [];
  let showModal = false;
  //this function calls the generateCSVText to get the output csv
  //opens the error modal if there are errors
  //and gives the file as a download to the user
  function downloadCSV() {
    console.log('downloadCSV');
    if (csvText) {
      const textOut = generateCSVText(csvText, isVisa); // Pass the checkbox value to the function

      if (textOut.errors && textOut.errors.length > 0) {
        errors = textOut.errors;
        showModal = true;
      } else {
        const blob = new Blob([textOut.csvText], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        //TODO: filename should be updated to something more usefull
        a.download = 'downloaded.csv';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } else {
      errors = ['No file chosen'];
      showModal = true;
    }
  }
</script>

<main>
  <ErrorModal bind:errors bind:showModal />
  <h1>CSV File Uploader and Downloader</h1>

  <div>
    <h2>Upload CSV File</h2>
    <input type="file" accept=".csv" on:change={handleUpload} />
    {#if uploadError}
      <p class="error">{uploadError}</p>
    {/if}
  </div>

  <div>
    <h2>Download CSV</h2>
    <!-- Add a checkbox that binds to the isVisa variable -->
    <label>
      <input type="checkbox" bind:checked={isVisa} />
      Use Visa Format
    </label>
    <button on:click={downloadCSV}>Download CSV</button>
  </div>
</main>

<style>
  main {
    text-align: center;
    padding: 2rem;
  }

  h1 {
    font-size: 1.5rem;
  }

  h2 {
    font-size: 1.2rem;
    margin-top: 1rem;
  }

  input[type='file'] {
    display: block;
    margin-top: 0.5rem;
  }

  .error {
    color: red;
  }
</style>
