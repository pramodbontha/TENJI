import { Article } from "@/types";
import { useEffect, useState } from "react";
import Highlighter from "react-highlight-words";
import { useTranslation } from "react-i18next";

interface DisplayArticleSectionProps {
  selectedArticle: Article;
  searchTerm: string;
  openArticleModal: (article: Article) => void;
}

const DisplayArticleSection = (props: DisplayArticleSectionProps) => {
  const { selectedArticle, searchTerm, openArticleModal } = props;
  const [adjustedText, setAdjustedText] = useState("");
  const articleProperties = [{ title: "text", text: selectedArticle.text }];
  const { t } = useTranslation();

  const includesQuery = (text: string | undefined) =>
    text &&
    text.trim() !== "" &&
    searchTerm &&
    text.toLowerCase().includes(searchTerm.toLowerCase());

  const sectionWithQuery = articleProperties.find(({ text }) =>
    includesQuery(text)
  );

  const sectionWithText = articleProperties.find(
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

      if (includesQuery(text) && searchTerm) {
        const searchIndex = text
          .toLowerCase()
          .indexOf(searchTerm.toLowerCase());

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
          searchWords={[searchTerm || ""]}
          autoEscape={true}
          textToHighlight={adjustedText || ""}
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
