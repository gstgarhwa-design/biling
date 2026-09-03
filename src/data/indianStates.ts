export interface IndianState {
  code: string;
  name: string;
}

export const INDIAN_STATES: IndianState[] = [
  { code: '01', name: 'Jammu and Kashmir' },
  { code: '02', name: 'Himachal Pradesh' },
  { code: '03', name: 'Punjab' },
  { code: '04', name: 'Chandigarh' },
  { code: '05', name: 'Uttarakhand' },
  { code: '06', name: 'Haryana' },
  { code: '07', name: 'Delhi' },
  { code: '08', name: 'Rajasthan' },
  { code: '09', name: 'Uttar Pradesh' },
  { code: '10', name: 'Bihar' },
  { code: '11', name: 'Sikkim' },
  { code: '12', name: 'Arunachal Pradesh' },
  { code: '13', name: 'Nagaland' },
  { code: '14', name: 'Manipur' },
  { code: '15', name: 'Mizoram' },
  { code: '16', name: 'Tripura' },
  { code: '17', name: 'Meghalaya' },
  { code: '18', name: 'Assam' },
  { code: '19', name: 'West Bengal' },
  { code: '20', name: 'Jharkhand' },
  { code: '21', name: 'Odisha' },
  { code: '22', name: 'Chhattisgarh' },
  { code: '23', name: 'Madhya Pradesh' },
  { code: '24', name: 'Gujarat' },
  { code: '25', name: 'Daman and Diu' },
  { code: '26', name: 'Dadra and Nagar Haveli' },
  { code: '27', name: 'Maharashtra' },
  { code: '28', name: 'Andhra Pradesh (Old)' },
  { code: '29', name: 'Karnataka' },
  { code: '30', name: 'Goa' },
  { code: '31', name: 'Lakshadweep' },
  { code: '32', name: 'Kerala' },
  { code: '33', name: 'Tamil Nadu' },
  { code: '34', name: 'Puducherry' },
  { code: '35', name: 'Andaman and Nicobar Islands' },
  { code: '36', name: 'Telangana' },
  { code: '37', name: 'Andhra Pradesh (New)' },
  { code: '38', name: 'Ladakh' },
  { code: '97', name: 'Other Territory' },
];

export function getStateByCode(code: string): IndianState | undefined {
  if (!code) return undefined;
  return INDIAN_STATES.find(s => s.code === code);
}

export function getStateByName(name: string): IndianState | undefined {
  if (!name || typeof name !== 'string') return undefined;
  return INDIAN_STATES.find(s => s.name?.toLowerCase() === name.toLowerCase());
}

export function validateGSTIN(gstin: string): boolean {
  if (!gstin) return false;
  const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  return gstinRegex.test(gstin.toUpperCase());
}

export function extractPanFromGstin(gstin: string): string {
  if (!gstin || gstin.length < 12) return '';
  return gstin.substring(2, 12).toUpperCase();
}

export function extractStateCodeFromGstin(gstin: string): string {
  if (!gstin || gstin.length < 2) return '';
  return gstin.substring(0, 2);
}

// Convert amount into Indian Rupees in words
export function amountInWords(amount: number): string {
  if (!amount || isNaN(amount) || amount === 0) return 'Zero Rupees Only';
  
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const numToWordsLessThanThousand = (num: number): string => {
    let str = '';
    if (num >= 100) {
      str += ones[Math.floor(num / 100)] + ' Hundred ';
      num %= 100;
    }
    if (num >= 20) {
      str += tens[Math.floor(num / 10)] + ' ';
      num %= 10;
    }
    if (num > 0) {
      str += ones[num] + ' ';
    }
    return str.trim();
  };

  const integerPart = Math.floor(Math.abs(amount));
  const decimalPart = Math.round((Math.abs(amount) - integerPart) * 100);

  let crore = Math.floor(integerPart / 10000000);
  let remainder = integerPart % 10000000;
  let lakh = Math.floor(remainder / 100000);
  remainder = remainder % 100000;
  let thousand = Math.floor(remainder / 1000);
  remainder = remainder % 1000;
  let hundreds = remainder;

  let result = '';
  if (crore > 0) result += numToWordsLessThanThousand(crore) + ' Crore ';
  if (lakh > 0) result += numToWordsLessThanThousand(lakh) + ' Lakh ';
  if (thousand > 0) result += numToWordsLessThanThousand(thousand) + ' Thousand ';
  if (hundreds > 0) result += numToWordsLessThanThousand(hundreds) + ' ';

  result = result.trim() + ' Rupees';
  if (decimalPart > 0) {
    result += ' and ' + numToWordsLessThanThousand(decimalPart) + ' Paise';
  }
  result += ' Only';

  return result.replace(/\s+/g, ' ');
}

// Indian Currency Formatter (₹ 1,23,456.00)
export function formatINR(val: number): string {
  if (isNaN(val)) return '₹0.00';
  return '₹' + Number(val).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
