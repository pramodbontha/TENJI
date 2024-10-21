import { CitationsCases, ICase } from "@/types";
import {
  Button,
  Card,
  Col,
  Input,
  Pagination,
  PaginationProps,
  Row,
  Space,
} from "antd";
import DisplayCaseSection from "../DisplayCaseSection";
import { useLazyGetCitedByCasesQuery } from "@/services/CitationsApi";
import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { setCitedByCases } from "@/slices/CaseSlice";
import { useTranslation } from "react-i18next";

interface CitedByCaseProps {
  citedByCases: CitationsCases;
  caseId?: string;
  addCaseCitations: (cases: ICase) => void;
  openCaseModal: (cases: ICase) => void;
}

const CitedByCase = (props: CitedByCaseProps) => {
  const { citedByCases, caseId, addCaseCitations, openCaseModal } = props;
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  const [searchTerm, setSearchTerm] = useState("");

  const [getCasesCitedByCases] = useLazyGetCitedByCasesQuery();
  const { citedByCasesCount } = useAppSelector((state) => state.cases);
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
      const { data: citedByCases } = await getCasesCitedByCases({
        caseId: `${caseId}`,
        searchTerm,
        skip: (pageNumber - 1) * newPageSize,
        limit: newPageSize,
      });

      citedByCases && dispatch(setCitedByCases(citedByCases));
    } catch (error) {
      console.error(error);
    }
  };

  const handleSearch = async () => {
    try {
      const { data: citedByCases } = await getCasesCitedByCases({
        caseId: `${caseId}`,
        searchTerm,
        skip: 0,
        limit: pageSize,
      });

      citedByCases && dispatch(setCitedByCases(citedByCases));
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
          {citedByCases.total < citedByCasesCount && (
            <div>
              <div className=" mt-2 ml-2">
                {`${t("found")} ${citedByCases.total} ${t("cases")} ${t(
                  "of"
                )} ${citedByCasesCount}`}
              </div>
            </div>
          )}
        </div>
        <div>
          {citedByCasesCount > 0 && (
            <div className="mt-2 pb-4 flex justify-end pr-4">
              <Pagination
                showSizeChanger
                current={currentPage}
                pageSize={pageSize}
                total={citedByCases.total}
                onChange={onChange}
              />
            </div>
          )}
        </div>
      </div>
      <div className="h-[560px] mb-2 overflow-y-auto overflow-x-hidden scrollbar-rounded">
        {citedByCases.cases && citedByCases.cases.length === 0 && (
          <>{"No cases found"}</>
        )}
        {citedByCases.cases && citedByCases.cases.length !== 0 && (
          <Row gutter={[16, 16]}>
            {citedByCases.cases?.map((cases, index) => (
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
                      <div className="flex mr-4">
                        <div className="font-bold mr-1">{t("name")}: </div>
                        <div className="line-clamp-1">{cases.caseName}</div>
                      </div>
                    )}
                    <div className="mr-4">
                      <span className="font-semibold mr-1">{t("year")}: </span>
                      <span>{cases.year}</span>
                    </div>
                    <div className="mr-4">
                      <span className="font-semibold mr-1">{t("type")}: </span>
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

export default CitedByCase;
