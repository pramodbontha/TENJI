import Highlighter from "react-highlight-words";

interface SearchTermHighlighterProps {
  searchWords?: string[];
  textToHighlight: string;
}

const SearchTermHighlighter = (props: SearchTermHighlighterProps) => {
  const { searchWords, textToHighlight } = props;
  return (
    <>
      <Highlighter
        highlightClassName="bg-gray-200 text-black font-bold p-1 rounded-lg"
        searchWords={searchWords || []}
        autoEscape={true}
        textToHighlight={textToHighlight || ""}
      />
    </>
  );
};

export default SearchTermHighlighter;
