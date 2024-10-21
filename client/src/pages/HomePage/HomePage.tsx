import Case from "./Case";
import Article from "./Article";
import Book from "./Book";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { setQuery } from "@/slices/SearchBarSlice";
import { Spin, Tour, TourProps } from "antd";
import { useState } from "react";
import { ModalSpinner } from "@/components";

const HomePage = () => {
  const dispatch = useAppDispatch();
  dispatch(setQuery(""));
  const [isTourOpen, setIsTourOpen] = useState(true);
  const { isArticleLoading } = useAppSelector((state) => state.articles);

  const contentStyle: React.CSSProperties = {
    padding: 50,
    background: "rgba(0, 0, 0, 0.1)",
    borderRadius: 4,
  };

  const content = <div style={contentStyle} />;

  const steps: TourProps["steps"] = [
    {
      title: "",
      description: (
        <>
          <div className="flex mt-2 p-1">
            <div className="font-medium mr-2">DE:</div>
            {
              "Verwenden Sie diese Schaltfläche, um zur Startseite zurückzukehren."
            }
          </div>
          <div className="flex mt-2 p-1">
            <div className="font-medium mr-2">EN:</div>
            {"Use this button to return to home page."}
          </div>
        </>
      ),
      target: () => document.querySelector("#first-element"), // CSS selector of the target element
    },
    {
      title: "",
      description: (
        <>
          <div className="flex mt-2 p-1">
            <div className="font-medium mr-2">DE:</div>
            {
              "Verwenden Sie diese Suchleiste, um nach Artikeln, Fällen usw. zu suchen"
            }
          </div>
          <div className="flex mt-2 p-1">
            <div className="font-medium mr-2">EN:</div>
            {"Use this search bar to search for articles, cases, etc."}
          </div>
        </>
      ),
      target: () => document.querySelector("#second-element"),
    },
    {
      title: "",
      description: (
        <>
          <div className="flex mt-2 p-1">
            <div className="font-medium mr-2">DE:</div>
            {
              "Verwenden Sie diese Schaltfläche, um Filter anzuwenden. Es wird eine Seitenleiste mit einem Formular geöffnet."
            }
          </div>
          <div className="flex mt-2 p-1">
            <div className="font-medium mr-2">EN:</div>
            {
              "Use this button to apply filters. A side bar will open with a form."
            }
          </div>
        </>
      ),
      target: () => document.querySelector("#third-element"),
    },
    {
      title: "",
      placement: "left",
      description: (
        <>
          <div className="flex mt-2 p-1">
            <div className="font-medium mr-2">DE:</div>
            {"Verwenden Sie diese Schaltfläche, um Filter zu löschen."}
          </div>
          <div className="flex mt-2 p-1">
            <div className="font-medium mr-2">EN:</div>
            {"Use this button to clear filters."}
          </div>
        </>
      ),
      target: () => document.querySelector("#fourth-element"),
    },
    {
      title: "",
      description: (
        <>
          <div className="flex mt-2 p-1">
            <div className="font-medium mr-2">DE:</div>
            {
              "Dies ist der Bereich für empfohlene Artikel. Verwenden Sie die Schaltfläche „Mehr“, um weitere Details und Zitate anzuzeigen, um die Artikel, Fälle und Buchreferenzen zu sehen, die den Artikel zitieren."
            }
          </div>
          <div className="flex mt-2 p-1">
            <div className="font-medium mr-2">EN:</div>
            {
              "This the section for recommended articles. Use More button to view more details and citations to view the articles, cases and book references citing the article."
            }
          </div>
        </>
      ),
      target: () => document.querySelector("#recommended-articles"),
    },
    {
      title: "",
      description: (
        <>
          <div className="flex mt-2 p-1">
            <div className="font-medium mr-2">DE:</div>
            {
              "Dies ist der Bereich für empfohlene Fälle. Verwenden Sie die Schaltfläche „Mehr“, um weitere Details und Zitate anzuzeigen, um die Artikel, Fälle und Buchverweise anzuzeigen, die den Fall zitieren."
            }
          </div>
          <div className="flex mt-2 p-1">
            <div className="font-medium mr-2">EN:</div>
            {
              "This the section for recommended cases. Use More button to view more details and citations to view the articles, cases and book references citing the case."
            }
          </div>
        </>
      ),
      target: () => document.querySelector("#recommended-cases"),
    },
    {
      title: "",
      description: (
        <>
          <div className="flex mt-2 p-1">
            <div className="font-medium mr-2">DE:</div>
            {
              "Dies ist der Bereich für empfohlene Bücher. Verwenden Sie die Schaltfläche Mehr, um das Buch und seinen Inhalt zu erkunden."
            }
          </div>
          <div className="flex mt-2 p-1">
            <div className="font-medium mr-2">EN:</div>
            {
              "This the section for recommended books. Use More button to explore the book and its contents."
            }
          </div>
        </>
      ),
      target: () => document.querySelector("#recommended-books"),
    },
    {
      title: "",
      placement: "left",
      description: (
        <>
          <div className="flex mt-2 p-1">
            <div className="font-medium mr-2">DE:</div>
            {"Ändern Sie hier die Spracheinstellung."}
          </div>
          <div className="flex mt-2 p-1">
            <div className="font-medium mr-2">EN:</div>
            {"Change language setting here."}
          </div>
        </>
      ),
      target: () => document.querySelector("#language-selector"),
    },
  ];
  return (
    <>
      {!isArticleLoading && (
        <>
          <Article />
          <Case />
          <Book />
          <Tour
            open={isTourOpen}
            onClose={() => setIsTourOpen(false)}
            steps={steps}
          />
        </>
      )}
      {isArticleLoading && (
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
