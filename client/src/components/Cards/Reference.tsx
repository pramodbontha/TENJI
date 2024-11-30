import { Button, Card, Space } from "antd";
import { SearchTermHighlighter } from "@/components";
import { Reference } from "@/types";
import { useAppSelector } from "@/redux/hooks";
import { RootState } from "@/redux/store";
import { caseNumberFormatter, normalizeCaseNumber } from "@/utils/helpers";
import { useTranslation } from "react-i18next";
import DisplayReferenceSection from "../DisplayReferenceSection";

interface ReferenceCardProps {
  reference: Reference;
  isSearchResult?: boolean;
  searchTerm?: string;
  lemmatizedSearchTerm?: string;
  openBookModal: (reference: Reference) => void;
  openReferenceModal: (reference: Reference) => void;
}

const ReferenceCard = (props: ReferenceCardProps) => {
  const { reference, isSearchResult, openBookModal, openReferenceModal } =
    props;
  const { query, lemmatizedQuery, citationQuery } = useAppSelector(
    (state: RootState) => state.searchBar
  );
  const { t } = useTranslation();

  const getHighlightedSearchTerms = () => {
    const caseNumberPattern =
      /^(?:\d+\s*,?\s*\d+\s*BVerfGE|BVerfGE\s*\d+\s*,?\s*\d+)$/i;
    if (caseNumberPattern.test(query || "")) {
      const formattedCaseNumber = normalizeCaseNumber(query);
      return [
        query,
        lemmatizedQuery,
        citationQuery,
        formattedCaseNumber,
        caseNumberFormatter(formattedCaseNumber),
        formattedCaseNumber?.replace(/BVerfGE(\d+),(\d+)/, "BVerfGE $1, $2"),
      ];
    }
    return [query, lemmatizedQuery, citationQuery];
  };

  return (
    <>
      <Card
        title={
          <SearchTermHighlighter
            searchWords={
              isSearchResult
                ? (getHighlightedSearchTerms().filter(Boolean) as string[])
                : []
            }
            textToHighlight={reference.text}
          />
        }
        extra={
          <>
            <Space>
              <Button onClick={() => openBookModal(reference)}>
                {t("find-in-book")}
              </Button>
              <Button onClick={() => openReferenceModal(reference)}>
                {t("in-the-text")}
              </Button>
            </Space>
          </>
        }
        className="h-44 drop-shadow-md"
      >
        <div>
          <div className="font-bold w-24">{t("context")}:</div>
          <DisplayReferenceSection
            selectedReference={reference}
            openReferenceModal={openReferenceModal}
          />
        </div>
      </Card>
    </>
  );
};

export default ReferenceCard;
