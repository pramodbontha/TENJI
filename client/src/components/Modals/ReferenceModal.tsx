import { Modal, Tabs } from "antd";
import { Reference } from "@/types";
import { useAppSelector } from "@/redux/hooks";
import { RootState } from "@/redux/store";
import Highlighter from "react-highlight-words";
import { useTranslation } from "react-i18next";
import { normalizeCaseNumber } from "@/utils/helpers";
import BookModal from "./BookModal";
import { useState } from "react";
import ModalSearchTermHighlighter from "../ModalSearchTermHighlighter";

interface ReferenceModalProps {
  reference: Reference;
  isOpen: boolean;
  onClose: () => void;
}

const ReferenceModal = (props: ReferenceModalProps) => {
  const { reference, isOpen, onClose } = props;
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const { query, lemmatizedQuery, citationQuery } = useAppSelector(
    (state: RootState) => state.searchBar
  );
  const { t } = useTranslation();

  const getHighlightedSearchTerms = () => {
    const caseNumberPattern =
      /^(?:\d+\s*,?\s*\d+\s*BVerfGE|BVerfGE\s*\d+\s*,?\s*\d+)$/i;
    if (caseNumberPattern.test(query[0] || "")) {
      const formattedCaseNumber = normalizeCaseNumber(query[0]);
      return [
        ...query,
        lemmatizedQuery,
        citationQuery,
        formattedCaseNumber,
        formattedCaseNumber?.replace(/BVerfGE(\d+),(\d+)/, "BVerfGE $1, $2"),
      ];
    }
    return [...query, lemmatizedQuery, citationQuery];
  };

  return (
    <>
      <Modal
        title={
          <Highlighter
            highlightClassName="bg-gray-200 text-black font-bold p-1 rounded-lg"
            searchWords={
              getHighlightedSearchTerms().filter(Boolean) as string[]
            }
            autoEscape={true}
            textToHighlight={reference.text}
          />
        }
        open={isOpen}
        onOk={onClose}
        onCancel={onClose}
        width={1200}
        footer={null}
      >
        <div className="h-[520px]">
          <a
            onClick={() => setIsBookModalOpen(true)}
            className="bg-gray-200 text-gray-500  p-1 rounded-lg hover:text-black hover:underline"
          >
            {reference.id}
          </a>
          <Tabs defaultActiveKey="1" className="h-full">
            <Tabs.TabPane tab={t("context")} key="1" className="h-full">
              <div className="h-[450px] overflow-y-auto scrollbar-rounded">
                <ModalSearchTermHighlighter
                  searchWords={
                    getHighlightedSearchTerms().filter(Boolean) as string[]
                  }
                  textToHighlight={reference.context}
                />
              </div>
            </Tabs.TabPane>
          </Tabs>
        </div>
      </Modal>
      {isBookModalOpen && (
        <BookModal
          reference={reference}
          isOpen={isBookModalOpen}
          onClose={() => setIsBookModalOpen(false)}
        />
      )}
    </>
  );
};

export default ReferenceModal;
