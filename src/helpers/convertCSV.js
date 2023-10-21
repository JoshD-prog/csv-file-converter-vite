
import{ DateTime } from 'luxon';
import Papa from 'papaparse';
import { in_file } from './constants';

const locale = 'en-US';

const in_csv_required_headers = [
  'Expense Date Incurred', 
  'Expense Payment Type',                             
  'Expense Total ',  
  'Vendor'                
];

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

export function generateCSVText(in_csv, isVisa) {
  const errors = [];

  // Parse the input CSV using PapaParse with quoteChar option
  const { data: parsedData, errors: parseErrors } = Papa.parse(in_csv, {
    header: true, // Treat the first row as headers
    skipEmptyLines: true, // Skip empty lines
    quoteChar: '"' // Specify the quote character used in your CSV
  });

  if (parseErrors.length > 0) {
    // Handle parsing errors
    for (const parseError of parseErrors) {
      console.error(`CSV parsing error: ${parseError.message}`, parseError )
      errors.push(`CSV parsing error on row #${parseError.row}: ${parseError.message}`);
    }
    return { csvText: '', errors };
  }

  if (parsedData.length === 0) {
    // Handle the case where there are no data rows (excluding the header)
    return { csvText: '', errors: ['No data rows found in the CSV.'] };
  }

  const csvLines = [];

  // Add the header to the CSV and surround header values with quotes
  const headerRow = out_csv_headers.map((header) => `"${header}"`).join(',');
  csvLines.push(headerRow);

  // Iterate through the parsed data
  for (let rowIndex = 0; rowIndex < parsedData.length; rowIndex++) {
    const rowData = parsedData[rowIndex];

    let { return_row, error } = processRow(rowData, isVisa, rowIndex + 2);
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

function processRow(row, isVisa, counter) {
 const return_row = new Array(out_csv_headers.length).fill(null);
  try {
    const missing_headers = []
    in_csv_required_headers.forEach((header)=>{
      if(row[header] === '') {
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
    return_row[0] = row['GL Acct - Vendor ID'];
    return_row[1] = row['Vendor'];
    return_row[2] = row['Invoice #'];
    return_row[3] = row['Expense Description'];
    return_row[4] = (parseFloat(row['Expense Total '])).toLocaleString(locale, {
      style: 'currency',
      currency: 'USD',
    });
    
    if (isVisa) {
      const first = DateTime.local().startOf('month');
      return_row[5] = col_c_date.toFormat(out_date_format).replace(/^0+/, ''); // Remove leading zeros
      return_row[6] = first.toFormat(out_date_format).replace(/^0+/, ''); // Remove leading zeros
      const lastMonth = first.minus({ days: 1 });
      return_row[7] = lastMonth.toFormat(out_date_format).replace(/^0+/, ''); // Remove leading zeros
    } else if (col_e === 'Y-Corporate FNBO Visa') {
      const first = col_c_date.startOf('month');
      return_row[5] = first.toFormat(out_date_format).replace(/^0+/, ''); // Remove leading zeros
      return_row[6] = first.toFormat(out_date_format).replace(/^0+/, ''); // Remove leading zeros
      const lastMonth = first.minus({ days: 1 });
      return_row[7] = lastMonth.toFormat(out_date_format).replace(/^0+/, ''); // Remove leading zeros
    } else if (col_e === "L-Bank-Draft") {
      return_row[5] = col_c_date.toFormat(out_date_format).replace(/^0+/, ''); // Remove leading zeros
      return_row[6] = col_c_date.toFormat(out_date_format).replace(/^0+/, ''); // Remove leading zeros
      return_row[7] = col_c_date.toFormat(out_date_format).replace(/^0+/, ''); // Remove leading zeros
    } else {
      return_row[5] = col_c_date.toFormat(out_date_format).replace(/^0+/, ''); // Remove leading zeros
      return_row[6] = DateTime.local().toFormat(out_date_format).replace(/^0+/, ''); // Remove leading zeros
      return_row[7] = col_c_date.toFormat(out_date_format).replace(/^0+/, ''); // Remove leading zeros
    }
    
    return_row[8] = (parseFloat(row['Expense Total '])).toLocaleString(locale, {
      style: 'currency',
      currency: 'USD',
    });
    
    return_row[9] = parseInt(row['GL Acct - Project No.']) === 0 ? '' : row['GL Acct - Project No.'];
    return_row[10] = row['Expense Total '];
    return_row[11] = `${row['GL Acct - Fund'].padStart(2, '0')}-${row['GL Acct - Group'].padStart(2, '0')}-${row['GL Acct - Department'].padStart(2, '0')}-${row['GL Acct - Account Code'].padStart(2, '0')}-${row['GL Acct - Position'].padStart(3, '0')}`;
    
    if (row['Author User Defined Fields - P-Card'] !== '') {
      return_row[12] = 'P-Card';
    }
    
    return_row[13] = row['Author User Defined Fields - P-Card'];
    return_row[14] = 'Funding Bank';
    return_row[15] = AttrFundingBankDescriptionMap[row['GL Acct - Funding Bank']];
    
    return { return_row, error: null };
  } catch (e) {
    console.error(e);
    return { return_row, error: `data issue on row #${counter}: ${e}` };
  }
}

