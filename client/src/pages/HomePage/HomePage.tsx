import Case from "./Case";
import Article from "./Article";
import Book from "./Book";
import { useAppSelector } from "@/redux/hooks";
import { Spin } from "antd";
import { AppTour } from "@/components";

const HomePage = () => {
  const { isSearching } = useAppSelector((state) => state.searchBar);
  const contentStyle: React.CSSProperties = {
    padding: 50,
    background: "rgba(0, 0, 0, 0.1)",
    borderRadius: 4,
  };

  const content = <div style={contentStyle} />;
  return (
    <>
      {!isSearching && (
        <>
          <Article />
          <Case />
          <Book />
          <AppTour />
        </>
      )}
      {isSearching && (
        <div className="fixed inset-0 bg-black bg-opacity-25 flex justify-center items-center z-50">
          <Spin tip="Searching" size="large">
            {content}
          </Spin>
        </div>
      )}
    </>
  );
};

export default HomePage;
