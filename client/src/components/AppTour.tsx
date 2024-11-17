import { Tour, TourProps } from "antd";
import { useTranslation } from "react-i18next";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { RootState } from "@/redux/store";
import { setIsTourEnabled } from "@/slices/AppTourSlice";

const AppTour = () => {
  const { isTourEnabled } = useAppSelector((state: RootState) => state.appTour);
  const dispatch = useAppDispatch();
  const { t } = useTranslation();

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
      target: () => document.querySelector("#home-button") as HTMLElement, // CSS selector of the target element
      nextButtonProps: { children: t("next") },
    },
    {
      title: "",
      description: (
        <>
          <div className="flex mt-2 p-1">
            <div className="font-medium mr-2">DE:</div>
            <div>
              <p>
                Verwenden Sie diese Suchleiste, um nach Artikeln, Fällen usw. zu
                suchen
              </p>
              <p>Beispiel-Suchbegriffe:</p>
              <ul className="list-disc ml-5">
                <li>"Nassauskiesung" für einen Fallnamen</li>
                <li>"BVerfGE 58 300" für eine Fallnummer</li>
                <li>"Erbrecht" für einen Artikelnamen</li>
                <li>"Art. 14 GG" für eine Artikelnummer</li>
              </ul>
            </div>
          </div>
          <div className="flex mt-2 p-1">
            <div className="font-medium mr-2">EN:</div>
            <div>
              <p>Use this search bar to search for articles, cases, etc.</p>
              <p>Example search terms:</p>
              <ul className="list-disc ml-5">
                <li>"Nassauskiesung" for a case name</li>
                <li>"BVerfGE 58 300" for a case number</li>
                <li>"Erbrecht" for an article name</li>
                <li>"Art. 14 GG" for an article number</li>
              </ul>
            </div>
          </div>
        </>
      ),
      target: () => document.querySelector("#search-input") as HTMLElement,
      nextButtonProps: { children: t("next") },
      prevButtonProps: { children: t("previous") },
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
      target: () => document.querySelector("#filter-button") as HTMLElement,
      nextButtonProps: { children: t("next") },
      prevButtonProps: { children: t("previous") },
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
      target: () => document.querySelector("#clear-filters") as HTMLElement,
      nextButtonProps: { children: t("next") },
      prevButtonProps: { children: t("previous") },
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
      target: () =>
        document.querySelector("#recommended-articles") as HTMLElement,
      nextButtonProps: { children: t("next") },
      prevButtonProps: { children: t("previous") },
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
      target: () => document.querySelector("#recommended-cases") as HTMLElement,
      nextButtonProps: { children: t("next") },
      prevButtonProps: { children: t("previous") },
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
      target: () => document.querySelector("#recommended-books") as HTMLElement,
      nextButtonProps: { children: t("next") },
      prevButtonProps: { children: t("previous") },
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
      target: () => document.querySelector("#language-selector") as HTMLElement,
      nextButtonProps: { children: t("finish") },
      prevButtonProps: { children: t("previous") },
    },
  ];

  const getFilteredSteps = (isSearchRoute: boolean) => {
    if (isSearchRoute) {
      return steps.filter((step) => {
        if (typeof step.target === "function") {
          const targetElement = step.target(); // Execute the target function
          return (
            targetElement !== document.querySelector("#recommended-articles") &&
            targetElement !== document.querySelector("#recommended-cases") &&
            targetElement !== document.querySelector("#recommended-books")
          );
        }
        return true;
      });
    }
    return steps;
  };

  return (
    <>
      <Tour
        open={isTourEnabled}
        onClose={() => dispatch(setIsTourEnabled(false))}
        steps={getFilteredSteps(location.pathname === "/search")}
      />
    </>
  );
};

export default AppTour;
