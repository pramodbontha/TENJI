export const articleNumberFormatter = (
  articleNumber: string,
  resource: string
) => {
  return `Art. ${articleNumber} ${resource}`;
};

export const caseNumberFormatter = (caseNumber: string) => {
  return caseNumber.replace(/(\D+)(\d+),(\d+)/, "$1 $2 $3");
};

export const normalizeCaseNumber = (caseNumber?: string) => {
  // Regular expression to detect if "BVerfGE" is present at the end or beginning
  if (caseNumber) {
    if (/^\D+\d+,\d+$/.test(caseNumber)) {
      return caseNumber; // Return as is if already formatted
    }

    // Attempt to extract components and normalize
    const match = caseNumber.match(/(\D+)?\s*(\d+)\s*(\d+)\s*(\D+)?/);
    if (match) {
      const [, prefix1, number1, number2, prefix2] = match;
      const prefix = prefix1 || prefix2 || ""; // Pick whichever prefix exists
      return `${prefix.trim()}${number1},${number2}`;
    }
  }

  // If no match, return the input unchanged
  return caseNumber;
};
