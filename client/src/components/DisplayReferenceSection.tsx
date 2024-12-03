import { Reference } from "@/types";
import { useEffect, useState } from "react";
import { SearchTermHighlighter } from "@/components";
import { useTranslation } from "react-i18next";
import { RootState } from "@/redux/store";
import { useAppSelector } from "@/redux/hooks";
import { normalizeCaseNumber } from "@/utils/helpers";

interface DisplayReferenceSectionProps {
  selectedReference: Reference;
  openReferenceModal: (reference: Reference) => void;
}

const DisplayReferenceSection = (props: DisplayReferenceSectionProps) => {
  const { selectedReference, openReferenceModal } = props;
  const [adjustedText, setAdjustedText] = useState("");
  const referenceProperties = [
    { title: "context", text: selectedReference.context },
  ];
  const {
    query: searchTerm,
    lemmatizedQuery: lemmatizedSearchTerm,
    citationQuery,
  } = useAppSelector((state: RootState) => state.searchBar);
  const { t } = useTranslation();

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

  const sectionWithQuery = referenceProperties.find(({ text }) =>
    includesQuery(text)
  );

  const sectionWithText = referenceProperties.find(
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
        <SearchTermHighlighter
          searchWords={getHighlightedSearchTerms().filter(Boolean) as string[]}
          textToHighlight={adjustedText}
        />
        <span
          className="text-black-500 font-medium underline cursor-pointer ml-1"
          onClick={() => openReferenceModal(selectedReference)}
        >
          {t("more")}
        </span>
      </div>
    </>
  );
};

export default DisplayReferenceSection;
