# CSV File Converter

This is a svelte application to convert csvs from one format to another.

## Running the project locally

To run the project locally, use ```npm run dev```

## Building

To build the project, use ```npm run build```

This project uses vite-plugin-singlefile to compile the project down to a single html file, so that it can be run on a browser without hosting

The main resulting build file is found in dist/index.html - I renamed the html file to csvConvert.html for clarity before sending it out last

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Svelte](https://marketplace.visualstudio.com/items?itemName=svelte.svelte-vscode).

## Notes on application structure (development folder structure, not built file)
The main entry point of this application is technically index.html, but you don't really get into the meat of it till src/App.svelte.

src/App.svelte contains the main "ui" functions of the application, it has the form elements that make up the app. It sends the processing to src/helpers/convertCSV.js.


src/helpers/convertCSV.js contains all the logic for converting the input csv's format to the required output format.

data/ contains some development files. These include numerous examples of what I was getting for output as well as example inputs and outputs.