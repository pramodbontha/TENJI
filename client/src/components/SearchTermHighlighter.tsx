import Highlighter from "react-highlight-words";

interface SearchTermHighlighterProps {
  searchWords?: string[];
  textToHighlight: string;
}

const SearchTermHighlighter = ({
  searchWords = [],
  textToHighlight = "",
  ...rest
}: SearchTermHighlighterProps) => {
  const stripHtml = (html: string): string => {
    const doc = new DOMParser().parseFromString(html, "text/html");
    return doc.body.textContent || "";
  };
  return (
    <Highlighter
      {...rest}
      highlightClassName="bg-gray-200 text-black font-bold p-1 rounded-lg"
      searchWords={searchWords}
      autoEscape={true}
      textToHighlight={stripHtml(textToHighlight)}
    />
  );
};

export default SearchTermHighlighter;
