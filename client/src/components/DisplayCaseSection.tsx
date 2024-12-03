import { ICase } from "@/types";
import { normalizeCaseNumber } from "@/utils/helpers";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { SearchTermHighlighter } from "@/components";
import { useAppSelector } from "@/redux/hooks";
import { RootState } from "@/redux/store";

interface DisplayCaseSectionProps {
  selectedCase: ICase;
  searchTerm?: string;
  lemmatizedSearchTerm?: string;
  openCaseModal: (cases: ICase) => void;
}

const DisplayCaseSection = ({
  selectedCase,
  openCaseModal,
}: DisplayCaseSectionProps) => {
  const [adjustedText, setAdjustedText] = useState("");
  const {
    query: searchTerm,
    lemmatizedQuery: lemmatizedSearchTerm,
    citationQuery,
  } = useAppSelector((state: RootState) => state.searchBar);
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
    if (caseNumberPattern.test(searchTerm[0] || "")) {
      const formattedCaseNumber = normalizeCaseNumber(searchTerm[0]);
      return [
        ...searchTerm,
        lemmatizedSearchTerm,
        citationQuery,
        formattedCaseNumber,
        formattedCaseNumber?.replace(/BVerfGE(\d+),(\d+)/, "BVerfGE $1, $2"),
      ];
    }
    return [...searchTerm, lemmatizedSearchTerm, citationQuery];
  };

  const includesQuery = (text: string | undefined) =>
    text &&
    text.trim() !== "" &&
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

  const displayText = (text: string, isSearch: boolean) => {
    const slicedText = isSearch ? text.slice(0, 240) : text.slice(0, 200);
    return text.length > 240 ? `${slicedText}...` : text;
  };

  useEffect(() => {
    if (selectedSection?.text) {
      const clampLines = 3; // Number of lines to clamp
      const maxCharsPerLine = 100; // Approximate characters per line, adjust based on design
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
          setAdjustedText(displayText(text, true)); // No need to adjust
        }
      } else {
        setAdjustedText(displayText(text, false)); // No query match, use full text
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSection, searchTerm, citationQuery]);

  return (
    <>
      <div className="line-clamp-3">
        <span className="font-bold mr-2">{selectedSection?.title}:</span>
        <SearchTermHighlighter
          searchWords={getHighlightedSearchTerms().filter(Boolean) as string[]}
          textToHighlight={adjustedText}
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
