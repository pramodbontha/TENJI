import { useAppSelector } from "@/redux/hooks";
import { RootState } from "@/redux/store";
import { Modal, Spin } from "antd";

const ModalSpinner = () => {
  const { isSearching } = useAppSelector((state: RootState) => state.searchBar);

  const contentStyle: React.CSSProperties = {
    padding: 50,
    background: "rgba(0, 0, 0, 0.05)",
    borderRadius: 4,
  };

  const content = <div style={contentStyle} />;
  return (
    <Modal open={isSearching} footer={null} closable={false} centered={true}>
      <Spin tip="Searching..." size="large">
        {content}
      </Spin>
    </Modal>
  );
};

export default ModalSpinner;
