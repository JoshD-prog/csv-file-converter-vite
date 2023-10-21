// import csv from 'csv-parser';
import{ DateTime } from 'luxon';

const locale = 'en-US';
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

// function main() {
//   const isVisa = false;
//   const in_csv = getCSVasArray('in.csv');
//   writeOutCSV(in_csv, 'out.csv', isVisa);
// }

// function testWrite(in_csv) {
//   const { data, error } = getCSVasArray(in_csv);
//   if (error !== null) {
//     return ["Ensure that the file selected is a CSV file"];
//   }
//   return writeOutCSV(data, "test", false, true);
// }

// function write(in_csv, out_f_name, isVisa) {
//   const { data, ignored } = getCSVasArray(in_csv);
//   return writeOutCSV(data, out_f_name, isVisa);
// }

export function generateCSVText(in_csv, isVisa) {
  const csvLines = [];
  const errors = [];

  csvLines.push(out_csv_headers.join(','));

  for (let counter = 2; counter <= in_csv.length + 1; counter++) {
    const row = in_csv[counter - 2];
    const { return_row, error } = processRow(row, isVisa, counter);
    if (error !== null) {
      errors.push(error);
    }
    csvLines.push(return_row.join(','));
  }

  const csvText = csvLines.join('\n');

  console.log(csvText)

  return { csvText, errors };
}

// function writeOutCSV(in_csv, out_file_name, isVisa, isTest = false) {
//   const errors = [];
//   const out_stream = fs.createWriteStream(out_file_name);

//   out_stream.write(out_csv_headers.join(',') + '\n');
//   let counter = 2;

//   for (const row of in_csv) {
//     const { return_row, error } = processRow(row, isVisa, counter);
//     counter += 1;
//     if (error !== null) {
//       errors.push(error);
//     }
//     out_stream.write(return_row.join(',') + '\n');
//   }
  
//   out_stream.end();

//   if (isTest) {
//     fs.unlinkSync(out_file_name);
//   }
  
//   return errors;
// }

function processRow(row, isVisa, counter) {
  const return_row = new Array(out_csv_headers.length).fill(null);
  try {
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
    process.exit(1);
    return { return_row, error: `data issue on row #${counter}: ${e}` };
  }
}

// function getCSVasArray(filename) {
//   try {
//     const fileData = fs.readFileSync(filename, 'utf8');
//     const lines = fileData.split('\n');
//     const keys = lines[0].split(',');
//     const data = [];
//     for (let i = 1; i < lines.length; i++) {
//       const values = lines[i].split(',');
//       if (values.length === keys.length) {
//         const row = {};
//         for (let j = 0; j < keys.length; j++) {
//           row[keys[j]] = values[j];
//         }
//         data.push(row);
//       }
//     }
//     console.log(`Processed ${data.length} lines.`);
//     return { data, error: null };
//   } catch (e) {
//     return { data: null, error: e.toString() };
//   }
// }

