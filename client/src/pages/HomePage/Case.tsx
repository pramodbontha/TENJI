import { useGetCasesQuery } from "@/services/CaseApi";
import { CaretLeftOutlined, CaretRightOutlined } from "@ant-design/icons";
import { Button, Row, Col } from "antd";
import { useState } from "react";
import { ICase as CaseType } from "@/types";
import { CaseCard, CaseModal, CitationsModal } from "@/components";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { setSelectedCase } from "@/slices/CaseSlice";
import { useTranslation } from "react-i18next";
import { setCitationsMenu } from "@/slices/CitationsSlice";

const Case = () => {
  const { data: cases } = useGetCasesQuery();

  const [current, setCurrent] = useState(1);
  const [animate, setAnimate] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalCase, setModalCase] = useState({} as CaseType);
  const [isCitationModalOpen, setIsCitationModalOpen] = useState(false);
  const pageSize = 3;

  const { citationsMenu } = useAppSelector((state) => state.citations);

  const dispatch = useAppDispatch();

  const { t } = useTranslation();

  const handleNext = () => {
    if (cases && current < Math.ceil(cases.length / pageSize)) {
      setAnimate("animate-slide-out-left");
      setTimeout(() => {
        setCurrent(current + 1);
        setAnimate("animate-slide-in-right");
      }, 300);
    }
  };

  const handlePrev = () => {
    setAnimate("animate-slide-out-right");
    setTimeout(() => {
      setCurrent(current - 1);
      setAnimate("animate-slide-in-left");
    }, 300);
  };

  const openCaseModal = (cases: CaseType) => {
    setModalCase(cases);
    setIsModalOpen(true);
  };

  const openCitationModal = (cases: CaseType) => {
    setModalCase(cases);
    dispatch(setCitationsMenu([...citationsMenu, cases]));
    dispatch(setSelectedCase(cases));
    setIsCitationModalOpen(true);
  };

  let currentPageCases;

  if (cases) {
    currentPageCases = cases.slice(
      (current - 1) * pageSize,
      current * pageSize
    );
  }

  return (
    <>
      {cases && (
        <div className="p-4" id="recommended-cases">
          <div className="font-semibold">{t("recommended-cases")}</div>
          <div className="mt-2 flex">
            <Button
              className="mt-16 mr-2"
              onClick={handlePrev}
              disabled={current === 1}
              icon={<CaretLeftOutlined />}
              type="text"
            ></Button>
            <div className="w-full overflow-hidden">
              <Row gutter={[16, 16]}>
                {currentPageCases?.map((cases) => (
                  <Col
                    key={cases.id}
                    xs={24} // Full width on extra small screens
                    sm={24} // Half width on small screens
                    md={24} // One-third width on medium screens
                    lg={8}
                    className={` ${animate ? animate : ""}`}
                  >
                    <CaseCard
                      cases={cases}
                      isSearchResult={false}
                      openCaseModal={openCaseModal}
                      openCitationModal={openCitationModal}
                    />
                  </Col>
                ))}
              </Row>
            </div>
            <Button
              onClick={handleNext}
              className="mt-16 ml-2"
              disabled={current === Math.ceil(cases.length / pageSize)}
              icon={<CaretRightOutlined />}
              type="text"
            ></Button>
          </div>
        </div>
      )}
      {isModalOpen && (
        <CaseModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          cases={modalCase}
        />
      )}
      {isCitationModalOpen && (
        <CitationsModal
          cases={modalCase}
          isOpen={isCitationModalOpen}
          onClose={() => setIsCitationModalOpen(false)}
        />
      )}
    </>
  );
};

export default Case;
