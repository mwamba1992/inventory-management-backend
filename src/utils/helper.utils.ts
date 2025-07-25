import * as bcrypt from 'bcryptjs';

// The encodePassword function that hashes a plain password with bcrypt
export async function encodePassword(plainPassword: string): Promise<string> {
  const saltRounds = 4; // You can adjust the salt rounds as per your requirement
  return await bcrypt.hash(plainPassword, saltRounds);
}

// The decodePassword function that compares a plain password with a hashed password
export async function decodePassword(
  plainPassword: string,
  hashedPassword: string,
): Promise<boolean> {
  return await bcrypt.compare(plainPassword, hashedPassword);
}

// top-appellant.dto.ts
export class TopAppellantDTO {
  id: number;
  name: string;
  appealCount: number;
}

// Helper to map month index to setter method name
export function getMonthName(index: number) {
  const monthNames = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  return monthNames[index];
}

// Method to format date from dd/MM/yyyy to yyyy-MM-dd
export function formatDate(dateString: string): Date {
  console.log(dateString);
  // Split the input date (e.g. 15/05/2024) into day, month, year
  const [day, month, year] = dateString
    .split('/')
    .map((num) => parseInt(num, 10));

  // Create a new Date object using the parsed values (Note: months are 0-indexed in JavaScript)
  const date = new Date(year, month - 1, day);

  console.log('date', date);

  // Format the date as yyyy-MM-dd using toISOString and string manipulation

  // Gets 'yyyy-MM-dd'
  return date;
}

export function isValidaPhone(phoneNo: string) {
  if (!phoneNo || phoneNo.trim() === '') {
    return false;
  } else if (
    RegExp(/^\d{10}$/).exec(phoneNo.trim()) &&
    phoneNo.trim().startsWith('0')
  ) {
    // Validate phone numbers of format "0723XXXXXX"
    return true;
  } else
    return (
      RegExp(/^\d{12}$/).exec(phoneNo.trim()) &&
      phoneNo.trim().startsWith('255')
    );
}
