import { Modal, Tabs } from "antd";
import { ICase } from "@/types";
import Highlighter from "react-highlight-words";
import { useAppSelector } from "@/redux/hooks";
import { RootState } from "@/redux/store";
import { useTranslation } from "react-i18next";

interface CaseModalProps {
  cases: ICase;
  citationSearch?: string;
  isOpen: boolean;
  onClose: () => void;
}

const CaseModal = (props: CaseModalProps) => {
  const { cases, citationSearch, isOpen, onClose } = props;
  const searchBar = useAppSelector((state: RootState) => state.searchBar);
  const { t } = useTranslation();
  return (
    <>
      <div>
        <Modal
          title={`${t("case-number")}: ${cases.number}`}
          open={isOpen}
          onOk={onClose}
          onCancel={onClose}
          width={1200}
          footer={null}
        >
          <div className="flex">
            <div className="font-bold mr-2">{t("name")}:</div>
            <div className="line-clamp-1">{cases.caseName}</div>
            <div className="ml-4">
              <span className="font-semibold">{t("year")}: </span>
              <span>{cases.year}</span>
            </div>
            <div className="ml-4">
              <span className="font-semibold">{t("type")}: </span>
              <span>{cases.decision_type}</span>
            </div>
          </div>
          <div className="h-[520px]">
            <Tabs defaultActiveKey="1" className="h-full">
              <Tabs.TabPane tab={t("facts")} key="1" className="h-full">
                <div className="h-[450px] overflow-y-auto overflow-x-hidden scrollbar-rounded">
                  <Highlighter
                    highlightClassName="bg-gray-200 text-black font-bold p-1 rounded-lg"
                    searchWords={[searchBar.query || "", citationSearch || ""]}
                    autoEscape={true}
                    textToHighlight={cases.facts}
                  />
                </div>
              </Tabs.TabPane>
              <Tabs.TabPane tab={t("judgement")} key="2" className="h-full">
                <div className="h-[450px] overflow-y-auto overflow-x-hidden scrollbar-rounded">
                  <Highlighter
                    highlightClassName="bg-gray-200 text-black font-bold p-1 rounded-lg"
                    searchWords={[searchBar.query || "", citationSearch || ""]}
                    autoEscape={true}
                    textToHighlight={cases.judgment}
                  />
                </div>
              </Tabs.TabPane>
              <Tabs.TabPane tab={t("reasoning")} key="3" className="h-full">
                <div className="h-[450px] w-auto overflow-y-auto overflow-x-hidden scrollbar-rounded">
                  <Highlighter
                    highlightClassName="bg-gray-200 text-black font-bold p-1 rounded-lg"
                    searchWords={[searchBar.query || "", citationSearch || ""]}
                    autoEscape={true}
                    textToHighlight={cases.reasoning}
                  />
                </div>
              </Tabs.TabPane>
              <Tabs.TabPane tab={t("headnotes")} key="4" className="h-full">
                <div className="h-[450px] overflow-y-auto overflow-x-hidden scrollbar-rounded">
                  <Highlighter
                    highlightClassName="bg-gray-200 text-black font-bold p-1 rounded-lg"
                    searchWords={[searchBar.query || "", citationSearch || ""]}
                    autoEscape={true}
                    textToHighlight={cases.headnotes}
                  />
                </div>
              </Tabs.TabPane>
            </Tabs>
          </div>
        </Modal>
      </div>
    </>
  );
};

export default CaseModal;
