export const articleNumberFormatter = (
  articleNumber: string,
  resource: string
) => {
  return `Art. ${articleNumber} ${resource}`;
};

export const caseNumberFormatter = (caseNumber: string) => {
  return caseNumber.replace(/(\D+)(\d+),(\d+)/, "$1 $2 $3");
};

export const normalizeCaseNumber = (caseNumber: string): string => {
  // Regular expression to detect if "BVerfGE" is present at the end or beginning
  if (/^\D+\d+,\d+$/.test(caseNumber)) {
    return caseNumber; // Return as is if already formatted
  }

  // Attempt to extract components and normalize
  const match = caseNumber.match(/(\D+)?\s*(\d+)\s*,?\s*(\d+)\s*(\D+)?/);
  if (match) {
    const [, prefix1, number1, number2, prefix2] = match;
    const prefix = [prefix1, prefix2].filter(Boolean).join("").trim(); // Combine prefixes if both exist
    return `${prefix}${number1},${number2}`;
  }

  // If no match, return the input unchanged
  return caseNumber;
};
