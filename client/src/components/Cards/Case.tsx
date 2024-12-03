import { ICase } from "@/types";
import { Button, Card, Space, Popover } from "antd";
import { useTranslation } from "react-i18next";
import { DisplayCaseSection, SearchTermHighlighter } from "@/components";
import { caseNumberFormatter, normalizeCaseNumber } from "@/utils/helpers";
import { RootState } from "@/redux/store";
import { useAppSelector } from "@/redux/hooks";

interface CaseCardProps {
  cases: ICase;
  isSearchResult?: boolean;
  openCaseModal: (cases: ICase) => void;
  openCitationModal: (cases: ICase) => void;
}

const CaseCard = (props: CaseCardProps) => {
  const { cases, isSearchResult, openCaseModal, openCitationModal } = props;
  const {
    query: searchTerm,
    lemmatizedQuery: lemmatizedSearchTerm,
    citationQuery,
  } = useAppSelector((state: RootState) => state.searchBar);
  const { t } = useTranslation();

  const getHighlightTerms = () => {
    if (isSearchResult) {
      const caseNumberPattern =
        /^(?:\d+\s*,?\s*\d+\s*BVerfGE|BVerfGE\s*\d+\s*,?\s*\d+)$/i;
      if (caseNumberPattern.test(searchTerm[0] || "")) {
        const formattedCaseNumber = normalizeCaseNumber(searchTerm[0]);
        return [
          ...searchTerm,
          lemmatizedSearchTerm,
          citationQuery,
          formattedCaseNumber,
          caseNumberFormatter(formattedCaseNumber),
          formattedCaseNumber?.replace(/BVerfGE(\d+),(\d+)/, "BVerfGE $1, $2"),
        ].filter(Boolean) as string[];
      }
      return [...searchTerm, lemmatizedSearchTerm, citationQuery].filter(
        Boolean
      ) as string[];
    }
    return [];
  };
  return (
    <>
      <Card
        title={
          <Popover
            content={
              cases.caseName
                ? cases.caseName
                : caseNumberFormatter(cases.number)
            }
          >
            <SearchTermHighlighter
              searchWords={getHighlightTerms()}
              textToHighlight={
                cases.caseName
                  ? cases.caseName
                  : caseNumberFormatter(cases.number)
              }
            />
          </Popover>
        }
        extra={
          <>
            <Space>
              <Button onClick={() => openCitationModal(cases)}>
                {t("citations")}
              </Button>
              <Button onClick={() => openCaseModal(cases)}>
                {t("in-the-text")}
              </Button>
            </Space>
          </>
        }
        className="h-48 drop-shadow-md"
      >
        <div className="flex -mt-3">
          {cases.caseName && (
            <>
              <div className="line-clamp-1 font-semibold">
                <SearchTermHighlighter
                  searchWords={getHighlightTerms()}
                  textToHighlight={caseNumberFormatter(cases.number)}
                />
              </div>
            </>
          )}
        </div>

        <div className="flex">
          <div>
            <span className="font-semibold">{t("year")}:</span>
            <span>{cases.year}</span>
          </div>
          <div className="ml-4">
            <span className="font-semibold">
              {t("type")}
              {": "}
            </span>
            <span>{cases.decision_type}</span>
          </div>
        </div>
        <div className="line-clamp-3 mt-0">
          <DisplayCaseSection
            selectedCase={cases}
            openCaseModal={openCaseModal}
          />
        </div>
      </Card>
    </>
  );
};

export default CaseCard;
