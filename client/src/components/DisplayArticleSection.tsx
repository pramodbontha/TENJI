import { Article } from "@/types";
import { useEffect, useState } from "react";
import { SearchTermHighlighter } from "@/components";
import { useTranslation } from "react-i18next";
import { RootState } from "@/redux/store";
import { useAppSelector } from "@/redux/hooks";

interface DisplayArticleSectionProps {
  selectedArticle: Article;
  openArticleModal: (article: Article) => void;
}

const DisplayArticleSection = (props: DisplayArticleSectionProps) => {
  const { selectedArticle, openArticleModal } = props;
  const [adjustedText, setAdjustedText] = useState("");
  const articleProperties = [{ title: "text", text: selectedArticle.text }];
  const {
    query: searchTerm,
    lemmatizedQuery: lemmatizedSearchTerm,
    citationQuery,
  } = useAppSelector((state: RootState) => state.searchBar);
  const { t } = useTranslation();

  const getHighlightedSearchTerms = () => {
    const articleNumberPattern =
      /^(Art\.\s*)?\d+(\s*\(?[A-Za-z0-9]+\.\)?)*\s*GG$/i;
    if (articleNumberPattern.test(searchTerm[0])) {
      const extractedSearchTerm = searchTerm[0]?.match(/(\d+[a-zA-Z]?)/)?.[0];
      return [
        ...searchTerm,
        lemmatizedSearchTerm,
        citationQuery,
        `Artikel ${extractedSearchTerm}`,
      ];
    }
    return [...searchTerm, lemmatizedSearchTerm, citationQuery];
  };

  const includesQuery = (text: string | undefined) =>
    text &&
    text.trim() !== "" &&
    [...searchTerm, lemmatizedSearchTerm, citationQuery]
      .filter(Boolean)
      .some((term) => text.toLowerCase().includes(term!.toLowerCase()));

  const sectionWithQuery = articleProperties.find(({ text }) =>
    includesQuery(text)
  );

  const sectionWithText = articleProperties.find(
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
          onClick={() => openArticleModal(selectedArticle)}
        >
          {t("more")}
        </span>
      </div>
    </>
  );
};

export default DisplayArticleSection;
