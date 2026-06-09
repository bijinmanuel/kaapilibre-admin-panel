/**
 * formatINR
 * Formats a numeric value into the Indian numbering system.
 * Never uses toLocaleString().
 *
 * Example:
 * 123456.78 -> ₹1,23,456.78
 * -5000     -> -₹5,000.00
 * 0         -> ₹0.00
 */
export function formatINR(amount: number): string {
  const isNegative = amount < 0;
  const absAmountStr = Math.abs(amount).toFixed(2);
  const [integerPart, decimalPart] = absAmountStr.split('.');

  let lastThree = integerPart.substring(integerPart.length - 3);
  const otherNumbers = integerPart.substring(0, integerPart.length - 3);

  if (otherNumbers !== '') {
    lastThree = ',' + lastThree;
  }

  // Group by pairs (Indian Numbering System)
  const formattedInteger =
    otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + lastThree;

  return `${isNegative ? '−' : ''}₹${formattedInteger}.${decimalPart}`;
}

export const CATEGORY_ACCOUNT_MAP: Record<string, number> = {
  // Direct / COGS
  Inventory: 5001,
  // Indirect / Operating Expenses
  Rent:        5012,
  Salary:      5011,
  Utility:     5013,
  Marketing:   5021,
  Maintenance: 5022,
  // Financial / Other
  Other:       5031,
};

/**
 * getExpenseType
 * Returns the broad category type for an expense category string.
 * direct   → maps to COGS accounts
 * indirect → maps to operating expense accounts
 * financial→ maps to below-the-line accounts
 */
export function getExpenseType(category: string): 'direct' | 'indirect' | 'financial' {
  if (category === 'Inventory') return 'direct';
  if (category === 'Other')     return 'financial';
  return 'indirect'; // Rent, Salary, Utility, Marketing, Maintenance
}

