<script>
  import { generateCSVText } from "./helpers/convertCSV";
  import ErrorModal from "./lib/ErrorModal.svelte";

  let csvText = "";
  let uploadError = "";
  let isVisa = false; // Initialize the checkbox value to false
  let isLegacy = false; // Initialize the checkbox value to false
  let uploadText = "No file selected";
  function handleUpload(event) {
    const file = event.target.files[0];
    const reader = new FileReader();
    uploadText = file.name;
    reader.onload = (event) => {
      if (event.target.result instanceof ArrayBuffer) {
        // If the result is an ArrayBuffer, convert it to a string
        const decoder = new TextDecoder("utf-8");
        csvText = decoder.decode(event.target.result);
      } else {
        // If it's already a string, use it as is
        csvText = event.target.result;
      }

      uploadError = "";
    };

    reader.onerror = (event) => {
      uploadError = "Error reading the uploaded file.";
    };

    reader.readAsArrayBuffer(file);
  }

  let errors = [];
  let showModal = false;
  //this function calls the generateCSVText to get the output csv
  //opens the error modal if there are errors
  //and gives the file as a download to the user
  function downloadCSV() {
    console.log("downloadCSV");
    if (csvText) {
      const textOut = generateCSVText(csvText, isVisa, isLegacy); // Pass the checkbox value to the function

      if (textOut.errors && textOut.errors.length > 0) {
        errors = textOut.errors;
        showModal = true;
      } else {
        const blob = new Blob([textOut.csvText], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.style.display = "none";
        a.href = url;
        //TODO: filename should be updated to something more usefull
        a.download = "downloaded.csv";
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } else {
      errors = ["No file chosen"];
      showModal = true;
    }
  }
</script>

<main>
  <ErrorModal bind:errors bind:showModal />
  <h1>CSV File Converter</h1>

  <div class="file-upload-container">
    <label class="file-upload-label">Upload CSV File</label>
    <div class="file-input">
      <input
        type="file"
        id="csv-upload"
        accept=".csv"
        on:change={handleUpload}
      />
      <label for="csv-upload" class="file-input-button">Choose File</label>
    </div>
    <div class="selected-file" id="file-name">{uploadText}</div>
    {#if uploadError}
      <p class="error">{uploadError}</p>
    {/if}
  </div>
  <div style="margin-top: 1rem">
    <button style="padding: 2rem 4rem 2rem 4rem" on:click={downloadCSV}
      >Download CSV</button
    >
  </div>
  <div style="margin-top: 1rem">
    <!-- Add a checkbox that binds to the isVisa variable -->
    <label>
      <input type="checkbox" bind:checked={isVisa} />
      Use Visa Format
    </label>
  </div>
  <div style="margin-top: 1rem">
    <label>
      <input type="checkbox" bind:checked={isLegacy} />
      Use Legacy Format
    </label>
  </div>
</main>

<style>
  main {
    text-align: center;
    padding: 2rem;
  }

  h1 {
    font-size: 2rem;
  }

  input[type="file"] {
    display: block;
    margin-top: 0.5rem;
  }

  .error {
    color: red;
  }
  .file-upload-container {
    margin: 1.5rem 0;
    padding: 1.5rem;
    border: 2px dashed #e2e8f0;
    border-radius: 8px;
    text-align: center;
    transition: all 0.2s ease;
  }

  .file-upload-container:hover {
    border-color: #cbd5e0;
  }

  .file-upload-label {
    display: block;
    font-weight: 600;
    margin-bottom: 1rem;
  }

  .file-input {
    position: relative;
    display: inline-block;
  }

  .file-input input[type="file"] {
    position: absolute;
    left: -9999px;
  }

  .file-input-button {
    display: inline-block;
    padding: 0.75rem 1.5rem;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }

  .file-input-button:hover {
    border-color: #646cff;
  }

  .selected-file {
    margin-top: 1rem;
    font-size: 0.875rem;
  }

  .error {
    color: #e53e3e;
    font-size: 0.875rem;
    margin-top: 0.5rem;
  }
</style>
