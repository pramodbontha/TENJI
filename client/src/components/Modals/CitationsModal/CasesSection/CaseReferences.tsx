import { ReferenceCard, ReferenceModal } from "@/components";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { useLazyGetReferencesWithGivenCaseQuery } from "@/services/CitationsApi";
import { setCaseReferences } from "@/slices/ReferenceSlice";
import { setCitationQuery } from "@/slices/SearchBarSlice";
import { CitationsReferences, Reference } from "@/types";
import { Row, Col, Pagination, PaginationProps, Input } from "antd";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

interface CaseReferenceProps {
  caseReferences: CitationsReferences;
  caseId?: string;
  openBookModal: (reference: Reference) => void;
}

const CaseReferences = (props: CaseReferenceProps) => {
  const { caseReferences, caseId, openBookModal } = props;
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  const [searchTerm, setSearchTerm] = useState("");
  const [isReferenceModalOpen, setIsReferenceModalOpen] = useState(false);
  const [selectedReference, setSelectedReference] = useState({} as Reference);

  const [getReferencesWithCase] = useLazyGetReferencesWithGivenCaseQuery();

  const { caseReferencesCount } = useAppSelector((state) => state.references);

  const dispatch = useAppDispatch();
  const { t } = useTranslation();

  const debounceDelay = 500; // milliseconds

  const onSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    dispatch(setCitationQuery(e.target.value));
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
      const { data: references } = await getReferencesWithCase({
        caseId: `${caseId}`,
        searchTerm,
        skip: (pageNumber - 1) * newPageSize,
        limit: newPageSize,
      });

      references && dispatch(setCaseReferences(references));
    } catch (error) {
      console.error(error);
    }
  };

  const handleSearch = async () => {
    try {
      const { data: references } = await getReferencesWithCase({
        caseId: `${caseId}`,
        searchTerm,
        skip: 0,
        limit: pageSize,
      });

      references && dispatch(setCaseReferences(references));
    } catch (error) {
      console.error(error);
    }
  };

  const openReferenceModal = (reference: Reference) => {
    setSelectedReference(reference);
    setIsReferenceModalOpen(true);
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
          {caseReferences.total < caseReferencesCount && (
            <div>
              <div className=" mt-2 ml-2">
                {`${t("found")} ${caseReferences.total} ${t("references")} ${t(
                  "of"
                )} ${caseReferencesCount}`}
              </div>
            </div>
          )}
        </div>
        <div>
          {caseReferencesCount > 0 && (
            <div className="mt-2 pb-4 flex justify-end pr-4">
              <Pagination
                showSizeChanger
                current={currentPage}
                pageSize={pageSize}
                total={caseReferences.total}
                onChange={onChange}
                locale={{ items_per_page: t("items-per-page") }}
              />
            </div>
          )}
        </div>
      </div>
      <div className="h-[560px] mb-2 overflow-y-auto overflow-x-hidden scrollbar-rounded">
        <Row gutter={[16, 16]}>
          {caseReferences &&
            caseReferences.references?.length !== 0 &&
            caseReferences.references?.map((reference, index) => (
              <Col key={reference.id + index} span={24}>
                <ReferenceCard
                  reference={reference}
                  openBookModal={openBookModal}
                  openReferenceModal={() => openReferenceModal(reference)}
                />
              </Col>
            ))}
        </Row>
      </div>
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

export default CaseReferences;
