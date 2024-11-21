import { ICase } from "@/types";
import { Button, Card, Space } from "antd";
import { useTranslation } from "react-i18next";
import { DisplayCaseSection } from "..";
import Highlighter from "react-highlight-words";
import { caseNumberFormatter } from "@/utils/helpers";

interface CaseCardProps {
  cases: ICase;
  isSearchResult?: boolean;
  searchTerm?: string;
  lemmatizedSearchTerm?: string;
  openCaseModal: (cases: ICase) => void;
  openCitationModal: (cases: ICase) => void;
}

const CaseCard = (props: CaseCardProps) => {
  const {
    cases,
    isSearchResult,
    searchTerm,
    lemmatizedSearchTerm,
    openCaseModal,
    openCitationModal,
  } = props;
  const { t } = useTranslation();

  return (
    <>
      <Card
        title={
          <Highlighter
            highlightClassName="bg-gray-200 text-black font-bold p-1 rounded-lg"
            searchWords={
              isSearchResult && searchTerm
                ? ([searchTerm, lemmatizedSearchTerm].filter(
                    Boolean
                  ) as string[])
                : []
            }
            autoEscape={true}
            textToHighlight={
              cases.caseName
                ? cases.caseName
                : caseNumberFormatter(cases.number)
            }
          />
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
                <Highlighter
                  highlightClassName="bg-gray-200 text-black font-bold p-1 rounded-lg"
                  searchWords={isSearchResult && searchTerm ? [searchTerm] : []}
                  autoEscape={true}
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
        <div className="line-clamp-3 mt-1">
          <DisplayCaseSection
            selectedCase={cases}
            searchTerm={isSearchResult && searchTerm ? searchTerm : ""}
            lemmatizedSearchTerm={
              isSearchResult && lemmatizedSearchTerm ? lemmatizedSearchTerm : ""
            }
            openCaseModal={openCaseModal}
          />
        </div>
      </Card>
    </>
  );
};

export default CaseCard;
