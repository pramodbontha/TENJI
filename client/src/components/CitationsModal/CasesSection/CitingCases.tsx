import {
  Row,
  Col,
  Card,
  Space,
  Button,
  Pagination,
  PaginationProps,
  Input,
} from "antd";
import DisplayCaseSection from "../DisplayCaseSection";
import { CitationsCases, ICase } from "@/types";
import { useLazyGetCitingCasesQuery } from "@/services/CitationsApi";
import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { setCitingCases } from "@/slices/CaseSlice";
import { useTranslation } from "react-i18next";

interface CitingCasesProps {
  citingCases: CitationsCases;
  caseId?: string;
  addCaseCitations: (cases: ICase) => void;
  openCaseModal: (cases: ICase) => void;
}

const CitingCases = (props: CitingCasesProps) => {
  const { citingCases, caseId, addCaseCitations, openCaseModal } = props;
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  const [searchTerm, setSearchTerm] = useState("");

  const [getCasesCitingCases] = useLazyGetCitingCasesQuery();

  const { citingCasesCount } = useAppSelector((state) => state.cases);
  const dispatch = useAppDispatch();

  const { t } = useTranslation();
  const debounceDelay = 500; // milliseconds

  const onSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
    setPageSize(10);
  };

  const onChange: PaginationProps["onChange"] = async (
    pageNumber,
    newPageSize
  ) => {
    setCurrentPage(pageNumber);
    if (newPageSize !== pageSize) {
      setPageSize(newPageSize);
    }
    try {
      const { data: citingCases } = await getCasesCitingCases({
        caseId: `${caseId}`,
        searchTerm,
        skip: (pageNumber - 1) * newPageSize,
        limit: newPageSize,
      });

      citingCases && dispatch(setCitingCases(citingCases));
    } catch (error) {
      console.error(error);
    }
  };

  const handleSearch = async () => {
    try {
      const { data: citingCases } = await getCasesCitingCases({
        caseId: `${caseId}`,
        searchTerm,
        skip: 0,
        limit: pageSize,
      });

      citingCases && dispatch(setCitingCases(citingCases));
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      // Call search after the debounce delay

      caseId && handleSearch();
    }, debounceDelay);

    // Cleanup function to clear the timeout if searchTerm, currentPage, or pageSize changes again
    return () => {
      clearTimeout(handler);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  return (
    <>
      <div className="flex items-center justify-between -mt-4">
        <div className="mt-3 mb-4 flex">
          <div className=" bg-gray-200  rounded-full p-1 flex ">
            <Input
              placeholder={t("search")}
              value={searchTerm}
              variant="borderless"
              onChange={onSearchInputChange}
            />
          </div>
          {citingCases.total < citingCasesCount && (
            <div>
              <div className=" mt-2 ml-2">
                {`${t("found")} ${citingCases.total} ${t("cases")} ${t(
                  "of"
                )} ${citingCasesCount}`}
              </div>
            </div>
          )}
        </div>
        <div>
          {citingCasesCount > 0 && (
            <div className="mt-4 pb-4 flex justify-end pr-4">
              <Pagination
                showSizeChanger
                current={currentPage}
                pageSize={pageSize}
                total={citingCases.total}
                onChange={onChange}
              />
            </div>
          )}
        </div>
      </div>
      <div className="h-[560px] mb-2 pr-2 overflow-y-auto overflow-x-hidden scrollbar-rounded">
        {citingCases.cases && citingCases.cases.length === 0 && (
          <>{"No cases found"}</>
        )}
        {citingCases.cases && citingCases.cases.length !== 0 && (
          <Row gutter={[16, 16]}>
            {citingCases.cases?.map((cases, index) => (
              <Col key={cases.id + index} span={24}>
                <Card
                  title={`${t("case-number")}: ${cases.number}`}
                  extra={
                    <Space>
                      <Button onClick={() => addCaseCitations(cases)}>
                        {t("citations")}
                      </Button>
                      <Button onClick={() => openCaseModal(cases)}>
                        {t("more")}
                      </Button>
                    </Space>
                  }
                  className="h-44 drop-shadow-md"
                >
                  <div className="flex">
                    {cases.caseName && (
                      <>
                        <div className="font-bold mr-1">{t("name")}:</div>
                        <div className="line-clamp-1">{cases.caseName}</div>
                      </>
                    )}
                    <div className="ml-4">
                      <span className="font-semibold">{t("year")}:</span>
                      <span>{cases.year}</span>
                    </div>
                    <div className="ml-4">
                      <span className="font-semibold">{t("type")}: </span>
                      <span>{cases.decision_type}</span>
                    </div>
                  </div>
                  <div className="line-clamp-3 mt-1">
                    <DisplayCaseSection
                      selectedCase={cases}
                      searchTerm={searchTerm}
                    />
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </div>
    </>
  );
};

export default CitingCases;
