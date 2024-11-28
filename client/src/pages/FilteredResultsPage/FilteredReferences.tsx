import { BookModal, ReferenceCard, ReferenceModal } from "@/components";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { RootState } from "@/redux/store";
import { useLazyGetFilteredReferencesWithQueriesQuery } from "@/services/ReferenceApi";
import { setReferences } from "@/slices/ReferenceSlice";
import { Reference } from "@/types";
import { Col, Pagination, PaginationProps, Row } from "antd";
import { useState } from "react";
import { useTranslation } from "react-i18next";

const FilteredReferences = () => {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [isReferenceModalOpen, setIsReferenceModalOpen] = useState(false);
  const [selectedReference, setSelectedReference] = useState({} as Reference);
  const { references, referencesCount } = useAppSelector(
    (state: RootState) => state.references
  );
  const values = useAppSelector((state: RootState) => state.form);
  const searchBar = useAppSelector((state: RootState) => state.searchBar);

  const [fetchFilteredReferences] =
    useLazyGetFilteredReferencesWithQueriesQuery();

  const dispatch = useAppDispatch();
  const { t } = useTranslation();

  const onChange: PaginationProps["onChange"] = async (
    pageNumber,
    newPageSize
  ) => {
    setCurrentPage(pageNumber);
    if (newPageSize !== pageSize) {
      setPageSize(newPageSize);
    }
    try {
      const { data: filteredReferences } = await fetchFilteredReferences({
        searchTerm: searchBar.query,
        context: values.tbContextReferences,
        text: values.text,
        skip: (pageNumber - 1) * newPageSize,
        limit: newPageSize,
        refCasesArticles: values.tbRefArtCases,
        resources: values.resources,
      });
      filteredReferences &&
        dispatch(setReferences(filteredReferences.references));
    } catch (error) {
      console.error(error);
    }
  };

  const openBookModal = (reference: Reference) => {
    setSelectedReference(reference);
    setIsBookModalOpen(true);
  };

  const openReferenceModal = (reference: Reference) => {
    setSelectedReference(reference);
    setIsReferenceModalOpen(true);
  };

  return (
    <>
      <div className="pt-0 pl-4 pr-4">
        <div className="flex justify-between items-center">
          <div className="font-semibold">
            {t("references-found")}: {referencesCount}
          </div>

          <Pagination
            showSizeChanger
            current={currentPage}
            pageSize={pageSize}
            total={referencesCount}
            onChange={onChange}
            locale={{ items_per_page: t("items-per-page") }}
          />
        </div>
        <div className="mt-2 h-[660px] p-2 overflow-y-auto overflow-x-hidden scrollbar-rounded">
          <Row gutter={[16, 16]}>
            {references?.map((reference, index) => (
              <Col key={reference.id + index} span={24}>
                <ReferenceCard
                  key={"references" + reference.id}
                  reference={reference}
                  isSearchResult={true}
                  openBookModal={openBookModal}
                  openReferenceModal={openReferenceModal}
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
          total={referencesCount}
          onChange={onChange}
          locale={{ items_per_page: t("items-per-page") }}
        />
      </div>
      {isBookModalOpen && (
        <BookModal
          reference={selectedReference}
          isOpen={isBookModalOpen}
          onClose={() => setIsBookModalOpen(false)}
        />
      )}
      {isReferenceModalOpen && (
        <ReferenceModal
          reference={selectedReference}
          isOpen={isReferenceModalOpen}
          onClose={() => setIsReferenceModalOpen(false)}
        />
      )}
    </>
  );
};

export default FilteredReferences;
