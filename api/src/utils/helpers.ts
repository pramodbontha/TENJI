// Utility function to normalize the case number format
export const normalizeCaseNumber = (caseNumber: string): string => {
  // Regular expression to detect if "BVerfGE" is present at the end or beginning
  if (/^\D+\d+,\d+$/.test(caseNumber)) {
    return caseNumber; // Return as is if already formatted
  }

  // Attempt to extract components and normalize
  const match = caseNumber.match(
    /\b(?:BVerfGE\s*(\d+)\s*,?\s*(\d+)|(\d+)\s*,?\s*(\d+)\s*BVerfGE)\b/i,
  );
  if (match) {
    const [, num1After, num2After, num1Before, num2Before] = match;
    const number1 = num1After || num1Before;
    const number2 = num2After || num2Before;
    return `BVerfGE${number1},${number2}`;
  }
  console.log(`case number: ${caseNumber}`);

  // If no match, return the input unchanged
  return caseNumber;
};

export const getSearchTerms = (searchTerm: string) => {
  const regex = /BVerfGE\s?\d+(,?\s?\d+)|Art\.?\s?\d+\s\w+/i;
  const match = searchTerm.match(regex);

  if (match) {
    const mainPart = match[0].replace(/\s+/g, ' ').trim(); // Normalize spaces in the matched part

    // Check if the main part is "BVerfGE" or "Art" and generate variations accordingly
    let variations: string[] = [];
    if (/^BVerfGE/i.test(mainPart)) {
      // Split into parts to generate BVerfGE variations
      const caseParts = mainPart.split(/\s+/); // Split by spaces
      const caseNumber = caseParts[1]; // First number
      const additionalNumber = caseParts[2] || ''; // Second number, if present

      variations = [
        `${caseParts[0]} ${caseNumber} ${additionalNumber}`.trim(), // "BVerfGE 18 85"
        `${caseParts[0]}${caseNumber}, ${additionalNumber}`.trim(), // "BVerfGE18, 85"
        `${caseParts[0]} ${caseNumber}, ${additionalNumber}`.trim(), // "BVerfGE 18, 85"
      ];
    } else if (/^Art/i.test(mainPart)) {
      // Normalize "Art." to ensure consistent formatting
      const normalizedMainPart = mainPart.replace(/^Art\.?\s?/, 'Art. ').trim();
      variations = [normalizedMainPart];
    }

    // Remove the matched part from the searchTerm
    const remainingPart = searchTerm.replace(match[0], '').trim();
    const remainingWords = remainingPart ? remainingPart.split(/\s+/) : []; // Split remaining words by spaces

    return [...variations, ...remainingWords]; // Combine variations and remaining words
  }
  // Fallback: if no pattern is found, split the entire search term
  return searchTerm.split(/\s+/);
};
