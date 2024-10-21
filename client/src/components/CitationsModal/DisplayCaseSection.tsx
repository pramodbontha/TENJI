import { ICase } from "@/types";
import { useEffect, useState } from "react";
import Highlighter from "react-highlight-words";
import { useTranslation } from "react-i18next";

const DisplayCaseSection = ({
  selectedCase,
  searchTerm,
}: {
  selectedCase: ICase;
  searchTerm?: string;
}) => {
  const [adjustedText, setAdjustedText] = useState("");
  const { t } = useTranslation();
  const caseProperties = [
    { title: t("judgement"), text: selectedCase.judgment },
    { title: t("facts"), text: selectedCase.facts },
    { title: t("reasoning"), text: selectedCase.reasoning },
    { title: t("headnotes"), text: selectedCase.headnotes },
  ];

  const includesQuery = (text: string | undefined) =>
    text &&
    text.trim() !== "" &&
    searchTerm &&
    text.toLowerCase().includes(searchTerm.toLowerCase());

  const sectionWithQuery = caseProperties.find(({ text }) =>
    includesQuery(text)
  );

  const sectionWithText = caseProperties.find(
    ({ text }) => text && text.trim() !== ""
  );
  const selectedSection = sectionWithQuery || sectionWithText;

  useEffect(() => {
    if (selectedSection?.text) {
      const clampLines = 3; // Number of lines to clamp
      const maxCharsPerLine = 100; // Approximate characters per line, adjust based on design
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
          setAdjustedText(text); // No need to adjust
        }
      } else {
        setAdjustedText(text); // No query match, use full text
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
      </div>
    </>
  );
};

export default DisplayCaseSection;
