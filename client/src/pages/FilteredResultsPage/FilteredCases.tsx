import { useAppSelector, useAppDispatch } from "@/redux/hooks";
import { RootState } from "@/redux/store";
import { setCases, setSelectedCase } from "@/slices/CaseSlice";
import { ICase } from "@/types";

import { Col, Pagination, PaginationProps, Row } from "antd";
import { useState } from "react";
import { CaseCard, CaseModal, CitationsModal } from "@/components";
import { useLazyGetFilteredCasesQuery } from "@/services/CaseApi";
import { useTranslation } from "react-i18next";
import { setCitationsMenu } from "@/slices/CitationsSlice";

const FilteredCases = () => {
  const [isCaseModelOpen, setIsCaseModelOpen] = useState(false);
  const [selectedCases, setSelectedCases] = useState({} as ICase);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [isCitationModalOpen, setIsCitationModalOpen] = useState(false);

  const [fetchFilteredCases] = useLazyGetFilteredCasesQuery();
  const { cases, casesCount } = useAppSelector(
    (state: RootState) => state.cases
  );
  const { citationsMenu } = useAppSelector((state) => state.citations);

  const { query } = useAppSelector((state: RootState) => state.searchBar);

  const values = useAppSelector((state: RootState) => state.form);
  const dispatch = useAppDispatch();
  const { t } = useTranslation();

  const openCaseModal = (selectedCase: ICase) => {
    setSelectedCases(selectedCase);
    setIsCaseModelOpen(true);
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
      const { data: filteredCases } = await fetchFilteredCases({
        searchTerm: query,
        name: values.caseName,
        number: values.caseNumber,
        judgment: values.caseJudgement,
        facts: values.caseFacts,
        reasoning: values.caseReasoning,
        headnotes: values.caseHeadnotes,
        startYear: values?.caseYear && values?.caseYear[0]?.format("YYYY"),
        endYear: values?.caseYear && values?.caseYear[1]?.format("YYYY"),
        skip: (pageNumber - 1) * newPageSize,
        limit: newPageSize,
        decisionType: values.caseDecision,
      });
      filteredCases && dispatch(setCases(filteredCases.cases));
    } catch (error) {
      console.error(error);
    }
  };

  const openCitationModal = (cases: ICase) => {
    setSelectedCases(cases);
    dispatch(setCitationsMenu([...citationsMenu, cases]));
    dispatch(setSelectedCase(cases));
    setIsCitationModalOpen(true);
  };

  return (
    <>
      <div className="pt-0 pl-4 pr-4">
        <div className="flex justify-between items-center">
          <div className="font-semibold">
            {t("cases-found")}: {casesCount}
          </div>

          <Pagination
            showSizeChanger
            current={currentPage}
            pageSize={pageSize}
            total={casesCount}
            onChange={onChange}
            onShowSizeChange={onChange}
            locale={{ items_per_page: t("items-per-page") }}
          />
        </div>
        <div className="mt-2 h-[660px] p-2 overflow-y-auto overflow-x-hidden scrollbar-rounded">
          <Row gutter={[16, 16]}>
            {cases?.map((cases, index) => (
              <Col key={cases.id + index} span={24}>
                <CaseCard
                  cases={cases}
                  isSearchResult={true}
                  openCaseModal={openCaseModal}
                  openCitationModal={openCitationModal}
                />
              </Col>
            ))}
          </Row>
        </div>
      </div>
      <div className="mt-4 pb-4 flex justify-end pr-4">
        <Pagination
          showSizeChanger
          current={currentPage}
          pageSize={pageSize}
          total={casesCount}
          onChange={onChange}
          locale={{ items_per_page: t("items-per-page") }}
        />
      </div>
      {isCaseModelOpen && (
        <CaseModal
          cases={selectedCases}
          isOpen={isCaseModelOpen}
          onClose={() => setIsCaseModelOpen(false)}
        />
      )}
      {isCitationModalOpen && (
        <CitationsModal
          cases={selectedCases}
          isOpen={isCitationModalOpen}
          onClose={() => setIsCitationModalOpen(false)}
        />
      )}
    </>
  );
};

export default FilteredCases;
