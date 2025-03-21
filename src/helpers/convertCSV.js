import { DateTime } from 'luxon';
import Papa from 'papaparse';

// used for parsing currency
const locale = 'en-US';

// This is the list of headers that the program checks have value for each row\
// TODO: this list may need refinement.
const in_csv_required_headers = [
  'Expense Date Incurred',
  'Expense Payment Type',
  'Expense Total ',
  'Vendor'
];

// These are the headers that will be added at the top of the output csv
const out_csv_headers = [
  'Vendor_ID',                   // 00 A
  'Vendor',                      // 01 B
  'Invoice_Number',              // 02 C
  'Invoice_Description',         // 03 D
  'Invoice_amount',              // 04 E
  'Invoice_Date',                // 05 F
  'Due_Date',                    // 06 G
  'Post_Date',                   // 07 H
  'Invoice_Distribution_Amount', // 08 I
  'ProjectID',                   // 09 J
  'Invoice_Distribution_Amount1',// 10 K
  'Textbox19',                   // 11 L
  'AttrPCard',                   // 12 M
  'AuthorPCard',                 // 13 N
  'AttrFundingBank',             // 14 O
  'AttrFundingBankDescription'   // 15 P
];

const h_map = {}
for (let index = 0; index < out_csv_headers.length; index++) {
  h_map[out_csv_headers[index]] = index;
}
// These are the headers that will be added at the top of the output csv
const out_csv_headers_new = [
  "Vendor ID",
  "Invoice number",
  "Invoice date",
  "Due date",
  "Description",
  "Post date",
  "Debit Transaction Distribution Amount", //6
  "Invoice Distribution Amount",
  "Invoice Distribution Debit account number",
  "Invoice Distribution Line item description",
  "Debit Transaction Distribution Amount", //10
  "Debit Transaction Distribution Project ID",
  "Invoice Distribution Credit account number",
  "Debit Transaction Distribution Amount", //13
  "Credit Transaction Distribution Project ID",
  "AttrPCard",
  "AuthorPCard",
  "AttrFundingBank",
  "AttrFundingBankDescription",
  "Vendor"
];

function setCol(return_row, header, valueToSet, excluding = []) {
  for (let index = 0; index < out_csv_headers_new.length; index++) {
    if (excluding.includes(index)) {
      continue;
    }
    if (out_csv_headers_new[index] === header) {
      return_row[index] = valueToSet;
    }
  }
  return return_row;
}

function setCols(return_row, headers, valueToSet, excluding = []) {
  for (let index = 0; index < headers.length; index++) {
    return_row = setCol(return_row, headers[index], valueToSet, excluding);
  }
  return return_row;
}
const AttrFundingBankDescriptionMap = {
  '1001': '1001-OPERATING',
  '1008': '1008-MMO',
  '1009': '1009-CHURCH PLNTG',
  '1016': '1016-RESERVES',
  '1017': '1017-ARF',
  '1019': '1019-OTHER DESIGNATED',
  '1022': '1022-AUTOS/COMPUTERS',
  '1024': '1024-CP PROMO',
  '1026': '1026-HRA',
  '1018': '1018-PARTNERSHIP',
  '1028': '1028-BSU BUILDING PROJECT',
  '1029': '1029-DISASTER RELIEF'
};

const invDistCredActNmbrSuffix = '-00-00-2001-000';

export function generateCSVText(in_csv, isVisa, isLegacy) {
  const errors = [];

  // Parse the input CSV using PapaParse with quoteChar option
  const { data: parsedData, errors: parseErrors } = Papa.parse(in_csv, {
    header: true, // Treat the first row as headers
    skipEmptyLines: true, // Skip empty lines
    quoteChar: '"' // Specify the quote character used in your CSV
  });

  if (parseErrors.length > 0) {
    // Handle parng errors
    for (const parseError of parseErrors) {
      console.error(`CSV parsing error: ${parseError.message}`, parseError)
      errors.push(`CSV parsing error on row #${parseError.row}: ${parseError.message}`);
    }
    return { csvText: '', errors };
  }

  if (parsedData.length === 0) {
    // Handle the case where there are no data rows (excluding the header)
    return { csvText: '', errors: ['No data rows found in the CSV.'] };
  }

  const csvLines = [];

  const headersToUse = isLegacy ? out_csv_headers : out_csv_headers_new
  // Add the header to the CSV and surround header values with quotes
  const headerRow = headersToUse.map((header) => `"${header}"`).join(',');
  csvLines.push(headerRow);

  // Iterate through the parsed data
  for (let rowIndex = 0; rowIndex < parsedData.length; rowIndex++) {
    const rowData = parsedData[rowIndex];

    const genToUse = isLegacy ? processRow : processNewRow

    let { return_row, error } = genToUse(rowData, isVisa, rowIndex + 2);
    if (error !== null) {
      errors.push(error);
    }

    // Map object properties to an array of values and handle quoting
    return_row = Object.values(return_row).map((value) => {
      // Check if the value contains a comma, and if so, surround it with quotes
      if (typeof value === 'string' && value.includes(',')) {
        return `"${value}"`;
      }
      return value;
    });
    csvLines.push(return_row.join(','));
  }

  const csvText = csvLines.join('\n');

  return { csvText, errors };
}
// Processing is done row by row. Rules are applied to the output 
// based on the contents of the input row, and based on whether or not the file is to be 
// processed as a visa
function processNewRow(row, isVisa, counter) {
  let return_row = new Array(out_csv_headers.length).fill(null);
  try {
    // Do a check to see if any required values are missing
    const missing_headers = []
    in_csv_required_headers.forEach((header) => {
      if (row[header] === '') {
        missing_headers.push(header)
      }
    });
    if (missing_headers.length > 0) {
      throw new Error(`The following required fields are missing: ${missing_headers.join(',')}`)
    }

    const dateStr = row['Expense Date Incurred'];
    let col_c_date;

    if (dateStr.length === 7) {
      col_c_date = DateTime.fromObject({
        year: parseInt(dateStr.slice(-4)),
        month: parseInt(dateStr.slice(0, 1)),
        day: parseInt(dateStr.slice(1, 3)),
      });
    } else {
      col_c_date = DateTime.fromFormat(dateStr, 'MMddyyyy');
    }

    const col_e = row['Expense Payment Type'];
    const out_date_format = 'MM/dd/yyyy';
    // If I were to refactor this, I would probably want to change it so that
    // the return_row used the column headers instead of indexes for readability
    return_row = setCol(return_row, 'Vendor ID', row['GL Acct - Vendor ID']);
    return_row = setCol(return_row, 'Vendor', row['Vendor']);
    return_row = setCol(return_row, 'Invoice number', row['Invoice #']);
    return_row = setCols(return_row, ['Description', 'Invoice Distribution Line item description'], row['Expense Description']);
    return_row = setCol(return_row, 'Debit Transaction Distribution Amount', (parseFloat(row['Expense Total '])), [10, 13]);

    // The way the dates are handled here is probable the most complicated logic that happens
    // This bit is the main part of the program that makes this a little more than just a simple 
    // shifting of column order. It's really not too bad: four conditions of how to handle dates.
    // If I was more inclined toward VBA all of this might have been easy to create as a script in excel.
    if (isVisa) {
      const first = DateTime.local().startOf('month');
      return_row = setCol(return_row, 'Invoice date', col_c_date.toFormat(out_date_format).replace(/^0+/, '')); // Remove leading zero)s
      return_row = setCol(return_row, 'Due date', first.toFormat(out_date_format).replace(/^0+/, '')); // Remove leading zero)s
      const lastMonth = first.minus({ days: 1 });
      return_row = setCol(return_row, 'Post date', lastMonth.toFormat(out_date_format).replace(/^0+/, '')); // Remove leading zero)s
    } else if (col_e === 'Y-Corporate FNBO Visa') {
      const first = col_c_date.startOf('month');
      return_row = setCol(return_row, 'Invoice date', first.toFormat(out_date_format).replace(/^0+/, '')); // Remove leading zero)s
      return_row = setCol(return_row, 'Due date', first.toFormat(out_date_format).replace(/^0+/, '')); // Remove leading zero)s
      const lastMonth = first.minus({ days: 1 });
      return_row = setCol(return_row, 'Post date', lastMonth.toFormat(out_date_format).replace(/^0+/, '')); // Remove leading zero)s
    } else if (col_e === "L-Bank-Draft") {
      return_row = setCol(return_row, 'Invoice date', col_c_date.toFormat(out_date_format).replace(/^0+/, '')); // Remove leading zero)s
      return_row = setCol(return_row, 'Due date', col_c_date.toFormat(out_date_format).replace(/^0+/, '')); // Remove leading zero)s
      return_row = setCol(return_row, 'Post date', col_c_date.toFormat(out_date_format).replace(/^0+/, '')); // Remove leading zero)s
    } else {
      return_row = setCol(return_row, 'Invoice date', col_c_date.toFormat(out_date_format).replace(/^0+/, '')); // Remove leading zero)s
      return_row = setCol(return_row, 'Due date', DateTime.local().toFormat(out_date_format).replace(/^0+/, '')); // Remove leading zero)s
      return_row = setCol(return_row, 'Post date', col_c_date.toFormat(out_date_format).replace(/^0+/, '')); // Remove leading zero)s
    }

    return_row = setCol(return_row, 'Debit Transaction Distribution Amount', (parseFloat(row['Expense Total '])), [6]);


    return_row = setCols(return_row, ['Credit Transaction Distribution Project ID', 'Debit Transaction Distribution Project ID'], parseInt(row['GL Acct - Project No.']) === 0 ? '' : row['GL Acct - Project No.']);
    return_row = setCol(return_row, 'Invoice Distribution Amount', row['Expense Total ']);

    const account_number = `${row['GL Acct - Fund'].padStart(2, '0')}-${row['GL Acct - Group'].padStart(2, '0')}-${row['GL Acct - Department'].padStart(2, '0')}-${row['GL Acct - Account Code'].padStart(2, '0')}-${row['GL Acct - Position'].padStart(3, '0')}`;
    return_row = setCol(return_row, 'Invoice Distribution Debit account number', account_number);

    if (row['Author User Defined Fields - P-Card'] !== '') {
      return_row = setCol(return_row, 'AttrPCard', 'P-Card');
    }

    return_row = setCol(return_row, 'AuthorPCard', row['Author User Defined Fields - P-Card']);
    return_row = setCol(return_row, 'AttrFundingBank', 'Funding Bank');
    return_row = setCol(return_row, 'AttrFundingBankDescription', AttrFundingBankDescriptionMap[row['GL Acct - Funding Bank']]);
    return_row = setCol(return_row, 'Invoice Distribution Credit account number', `${row['GL Acct - Fund'].padStart(2, '0')}${invDistCredActNmbrSuffix}`)


    return { return_row, error: null };
  } catch (e) {
    console.error(e);
    // errors are returned here instead of thrown, so that all the rows can be evaluated
    // for errors before displaying info to the user.
    return { return_row, error: `data issue on row #${counter}: ${e}` };
  }
}

// Processing is done row by row. Rules are applied to the output 
// based on the contents of the input row, and based on whether or not the file is to be 
// processed as a visa
function processRow(row, isVisa, counter) {
  const return_row = new Array(out_csv_headers.length).fill(null);
  try {
    // Do a check to see if any required values are missing
    const missing_headers = []
    in_csv_required_headers.forEach((header) => {
      if (row[header] === '') {
        missing_headers.push(header)
      }
    });
    if (missing_headers.length > 0) {
      throw new Error(`The following required fields are missing: ${missing_headers.join(',')}`)
    }

    const dateStr = row['Expense Date Incurred'];
    let col_c_date;

    if (dateStr.length === 7) {
      col_c_date = DateTime.fromObject({
        year: parseInt(dateStr.slice(-4)),
        month: parseInt(dateStr.slice(0, 1)),
        day: parseInt(dateStr.slice(1, 3)),
      });
    } else {
      col_c_date = DateTime.fromFormat(dateStr, 'MMddyyyy');
    }

    const col_e = row['Expense Payment Type'];
    const out_date_format = 'MM/dd/yyyy';
    // If I were to refactor this, I would probably want to change it so that
    // the return_row used the column headers instead of indexes for readability
    return_row[h_map['Vendor_ID']] = row['GL Acct - Vendor ID'];
    return_row[h_map['Vendor']] = row['Vendor'];
    return_row[h_map['Invoice_Number']] = row['Invoice #'];
    return_row[h_map['Invoice_Description']] = row['Expense Description'];
    return_row[h_map['Invoice_amount']] = (parseFloat(row['Expense Total '])).toLocaleString(locale, {
      style: 'currency',
      currency: 'USD',
    });

    // The way the dates are handled here is probable the most complicated logic that happens
    // This bit is the main part of the program that makes this a little more than just a simple 
    // shifting of column order. It's really not too bad: four conditions of how to handle dates.
    // If I was more inclined toward VBA all of this might have been easy to create as a script in excel.
    if (isVisa) {
      const first = DateTime.local().startOf('month');
      return_row[h_map['Invoice_Date']] = col_c_date.toFormat(out_date_format).replace(/^0+/, ''); // Remove leading zeros
      return_row[h_map['Due_Date']] = first.toFormat(out_date_format).replace(/^0+/, ''); // Remove leading zeros
      const lastMonth = first.minus({ days: 1 });
      return_row[h_map['Post_Date']] = lastMonth.toFormat(out_date_format).replace(/^0+/, ''); // Remove leading zeros
    } else if (col_e === 'Y-Corporate FNBO Visa') {
      const first = col_c_date.startOf('month');
      return_row[h_map['Invoice_Date']] = first.toFormat(out_date_format).replace(/^0+/, ''); // Remove leading zeros
      return_row[h_map['Due_Date']] = first.toFormat(out_date_format).replace(/^0+/, ''); // Remove leading zeros
      const lastMonth = first.minus({ days: 1 });
      return_row[h_map['Post_Date']] = lastMonth.toFormat(out_date_format).replace(/^0+/, ''); // Remove leading zeros
    } else if (col_e === "L-Bank-Draft") {
      return_row[h_map['Invoice_Date']] = col_c_date.toFormat(out_date_format).replace(/^0+/, ''); // Remove leading zeros
      return_row[h_map['Due_Date']] = col_c_date.toFormat(out_date_format).replace(/^0+/, ''); // Remove leading zeros
      return_row[h_map['Post_Date']] = col_c_date.toFormat(out_date_format).replace(/^0+/, ''); // Remove leading zeros
    } else {
      return_row[h_map['Invoice_Date']] = col_c_date.toFormat(out_date_format).replace(/^0+/, ''); // Remove leading zeros
      return_row[h_map['Due_Date']] = DateTime.local().toFormat(out_date_format).replace(/^0+/, ''); // Remove leading zeros
      return_row[h_map['Post_Date']] = col_c_date.toFormat(out_date_format).replace(/^0+/, ''); // Remove leading zeros
    }

    return_row[h_map['Invoice_Distribution_Amount']] = (parseFloat(row['Expense Total '])).toLocaleString(locale, {
      style: 'currency',
      currency: 'USD',
    });

    return_row[h_map['ProjectID']] = parseInt(row['GL Acct - Project No.']) === 0 ? '' : row['GL Acct - Project No.'];
    return_row[h_map['Invoice_Distribution_Amount1']] = row['Expense Total '];
    return_row[h_map['Textbox19']] = `${row['GL Acct - Fund'].padStart(2, '0')}-${row['GL Acct - Group'].padStart(2, '0')}-${row['GL Acct - Department'].padStart(2, '0')}-${row['GL Acct - Account Code'].padStart(2, '0')}-${row['GL Acct - Position'].padStart(3, '0')}`;

    if (row['Author User Defined Fields - P-Card'] !== '') {
      return_row[h_map['AttrPCard']] = 'P-Card';
    }

    return_row[h_map['AuthorPCard']] = row['Author User Defined Fields - P-Card'];
    return_row[h_map['AttrFundingBank']] = 'Funding Bank';
    return_row[h_map['AttrFundingBankDescription']] = AttrFundingBankDescriptionMap[row['GL Acct - Funding Bank']];

    return { return_row, error: null };
  } catch (e) {
    console.error(e);
    // errors are returned here instead of thrown, so that all the rows can be evaluated
    // for errors before displaying info to the user.
    return { return_row, error: `data issue on row #${counter}: ${e}` };
  }
}

