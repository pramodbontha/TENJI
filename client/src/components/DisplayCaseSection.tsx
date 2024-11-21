import { ICase } from "@/types";
import { normalizeCaseNumber } from "@/utils/helpers";
import { useEffect, useState } from "react";
import Highlighter from "react-highlight-words";
import { useTranslation } from "react-i18next";

interface DisplayCaseSectionProps {
  selectedCase: ICase;
  searchTerm?: string;
  lemmatizedSearchTerm?: string;
  openCaseModal: (cases: ICase) => void;
}

const DisplayCaseSection = ({
  selectedCase,
  searchTerm,
  lemmatizedSearchTerm,
  openCaseModal,
}: DisplayCaseSectionProps) => {
  const [adjustedText, setAdjustedText] = useState("");
  const { t } = useTranslation();
  const caseProperties = [
    { title: t("judgement"), text: selectedCase.judgment },
    { title: t("facts"), text: selectedCase.facts },
    { title: t("reasoning"), text: selectedCase.reasoning },
    { title: t("headnotes"), text: selectedCase.headnotes },
  ];

  const getHighlightedSearchTerms = () => {
    const caseNumberPattern =
      /^(?:\d+\s*,?\s*\d+\s*BVerfGE|BVerfGE\s*\d+\s*,?\s*\d+)$/i;
    if (caseNumberPattern.test(searchTerm || "")) {
      const formattedCaseNumber = normalizeCaseNumber(searchTerm);
      return [
        searchTerm,
        lemmatizedSearchTerm,
        formattedCaseNumber,
        formattedCaseNumber?.replace(/BVerfGE(\d+),(\d+)/, "BVerfGE $1, $2"),
      ];
    }
    return [searchTerm, lemmatizedSearchTerm];
  };

  const includesQuery = (text: string | undefined) =>
    text &&
    text.trim() !== "" &&
    (searchTerm || lemmatizedSearchTerm) &&
    getHighlightedSearchTerms()
      .filter(Boolean)
      .some((term) => text.toLowerCase().includes(term!.toLowerCase()));

  const sectionWithQuery = caseProperties.find(({ text }) =>
    includesQuery(text)
  );

  const sectionWithText = caseProperties.find(
    ({ text }) => text && text.trim() !== ""
  );
  const selectedSection = sectionWithQuery || sectionWithText;

  const displayText = (text: string) => {
    return text.length > 200 ? `${text.slice(0, 200)}...` : text;
  };

  useEffect(() => {
    if (selectedSection?.text) {
      const clampLines = 3; // Number of lines to clamp
      const maxCharsPerLine = 80; // Approximate characters per line, adjust based on design
      const totalCharsVisible = clampLines * maxCharsPerLine;

      const text = selectedSection.text;

      const searchTerms = getHighlightedSearchTerms().filter(Boolean);
      const foundTerm = searchTerms.find((term) =>
        text.toLowerCase().includes(term!.toLowerCase())
      );

      if (foundTerm) {
        const searchIndex = text.toLowerCase().indexOf(foundTerm.toLowerCase());

        if (searchIndex > totalCharsVisible) {
          const start = Math.max(
            0,
            searchIndex - Math.floor(totalCharsVisible / 2)
          ); // Adjust to show around search term
          const end = Math.min(text.length, start + totalCharsVisible);
          setAdjustedText(`...${text.slice(start, end)}...`); // Adjusted text with ellipsis
        } else {
          setAdjustedText(displayText(text)); // No need to adjust
        }
      } else {
        setAdjustedText(displayText(text)); // No query match, use full text
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSection, searchTerm]);

  return (
    <>
      <div className="line-clamp-3">
        <span className="font-bold mr-2">{selectedSection?.title}:</span>
        <Highlighter
          highlightClassName="bg-gray-200 text-black font-bold p-1 rounded-lg"
          searchWords={getHighlightedSearchTerms().filter(Boolean) as string[]}
          autoEscape={true}
          textToHighlight={adjustedText || ""}
        />
        <span
          className="text-black-500 font-medium underline cursor-pointer ml-1"
          onClick={() => openCaseModal(selectedCase)}
        >
          {t("more")}
        </span>
      </div>
    </>
  );
};

export default DisplayCaseSection;
