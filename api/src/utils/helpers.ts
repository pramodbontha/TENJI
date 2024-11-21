// Utility function to normalize the case number format
export const normalizeCaseNumber = (caseNumber: string): string => {
  // Regular expression to detect if "BVerfGE" is present at the end or beginning
  if (/^\D+\d+,\d+$/.test(caseNumber)) {
    return caseNumber; // Return as is if already formatted
  }

  // Attempt to extract components and normalize
  const match = caseNumber.match(/(\D+)?\s*(\d+)\s*(\d+)\s*(\D+)?/);
  if (match) {
    const [, prefix1, number1, number2, prefix2] = match;
    const prefix = prefix1 || prefix2 || ''; // Pick whichever prefix exists
    return `${prefix.trim()}${number1},${number2}`;
  }

  // If no match, return the input unchanged
  return caseNumber;
};
