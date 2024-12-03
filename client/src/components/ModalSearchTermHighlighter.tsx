import React from "react";
import Highlighter from "react-highlight-words";
import parse from "html-react-parser";

interface SearchTermHighlighterProps {
  searchWords?: string[];
  textToHighlight: string;
}

const ModalSearchTermHighlighter: React.FC<SearchTermHighlighterProps> = ({
  searchWords = [],
  textToHighlight = "",
  ...rest
}) => {
  // Parse the HTML text and apply highlighting
  const highlightWithHtml = (text: string) => {
    // Parse the HTML string into React elements
    const parsedHtml = parse(text, {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      replace: (domNode: any) => {
        if (domNode.type === "text") {
          // Use Highlighter for text nodes
          return (
            <Highlighter
              searchWords={searchWords}
              textToHighlight={domNode.data}
              highlightClassName="bg-gray-200 text-black font-bold p-1 rounded-lg"
            />
          );
        }
        return domNode; // Leave other HTML elements intact
      },
    });

    return parsedHtml;
  };

  return <span {...rest}>{highlightWithHtml(textToHighlight)}</span>;
};

export default ModalSearchTermHighlighter;
