import { useAppSelector, useAppDispatch } from "@/redux/hooks";
import { RootState } from "@/redux/store";
import { setCases, setCasesMenu, setSelectedCase } from "@/slices/CaseSlice";
import { ICase } from "@/types";

import {
  Button,
  Card,
  Col,
  Pagination,
  PaginationProps,
  Row,
  Space,
} from "antd";
import { useEffect, useState } from "react";
import { CaseModal, CitationsModal } from "@/components";
import { useLazyGetFilteredCasesQuery } from "@/services/CaseApi";
import Highlighter from "react-highlight-words";
import { useTranslation } from "react-i18next";

const FilteredCases = () => {
  const [isCaseModelOpen, setIsCaseModelOpen] = useState(false);
  const [selectedCases, setSelectedCases] = useState({} as ICase);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [isCitationModalOpen, setIsCitationModalOpen] = useState(false);

  const [fetchFilteredCases] = useLazyGetFilteredCasesQuery();
  const { cases, casesCount, casesMenu } = useAppSelector(
    (state: RootState) => state.cases
  );

  const searchBar = useAppSelector((state: RootState) => state.searchBar);

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
        searchTerm: searchBar.query,
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
    dispatch(setCasesMenu([...casesMenu, cases]));
    dispatch(setSelectedCase(cases));
    setIsCitationModalOpen(true);
  };

  const DisplayCaseSection = ({ selectedCase }: { selectedCase: ICase }) => {
    const [adjustedText, setAdjustedText] = useState("");
    const caseProperties = [
      { title: t("judgement"), text: selectedCase.judgment },
      { title: t("facts"), text: selectedCase.facts },
      { title: t("reasoning"), text: selectedCase.reasoning },
      { title: t("headnotes"), text: selectedCase.headnotes },
    ];

    const includesQuery = (text: string | undefined) =>
      text &&
      text.trim() !== "" &&
      text.toLowerCase().includes(searchBar.query.toLowerCase());

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

        if (includesQuery(text)) {
          const searchIndex = text
            .toLowerCase()
            .indexOf(searchBar.query.toLowerCase());

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
    }, [selectedSection, searchBar.query]);

    return (
      <>
        <div className="line-clamp-3">
          <span className="font-bold mr-2">{selectedSection?.title}:</span>
          <Highlighter
            highlightClassName="bg-gray-200 text-black font-bold p-1 rounded-lg"
            searchWords={[searchBar.query]}
            autoEscape={true}
            textToHighlight={adjustedText || ""}
          />
        </div>
      </>
    );
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
          />
        </div>
        <div className="mt-2 h-[660px] p-2 overflow-y-auto overflow-x-hidden scrollbar-rounded">
          <Row gutter={[16, 16]}>
            {cases?.map((cases, index) => (
              <Col key={cases.id + index} span={24}>
                <Card
                  title={
                    <Highlighter
                      highlightClassName="bg-gray-200 text-black font-bold p-1 rounded-lg"
                      searchWords={[searchBar.query]}
                      autoEscape={true}
                      textToHighlight={`${t("case-number")}: ${cases.number}`}
                    />
                  }
                  extra={
                    <Space>
                      <Button onClick={() => openCitationModal(cases)}>
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
                        <div className="font-bold">{t("name")}:</div>
                        <div className="ml-2 line-clamp-1 mr-4">
                          <Highlighter
                            highlightClassName="bg-gray-200 text-black font-bold p-1 rounded-lg"
                            searchWords={[searchBar.query]}
                            autoEscape={true}
                            textToHighlight={cases.caseName}
                          />
                        </div>
                      </>
                    )}
                    <div>
                      <span className="font-semibold">{t("year")}:</span>
                      <span>{cases.year}</span>
                    </div>
                    <div className="ml-4">
                      <span className="font-semibold">{t("type")}: </span>
                      <span>{cases.decision_type}</span>
                    </div>
                  </div>
                  <div className="line-clamp-3 mt-1">
                    <DisplayCaseSection selectedCase={cases} />
                  </div>
                </Card>
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
