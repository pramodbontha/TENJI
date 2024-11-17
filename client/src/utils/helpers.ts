export const articleNumberFormatter = (articleNumber: string) => {
  return `Art. ${articleNumber} GG`;
};

export const caseNumberFormatter = (caseNumber: string) => {
  return caseNumber.replace(/(\D+)(\d+),(\d+)/, "$1 $2 $3");
};
