import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Layout } from "@/components";
import { FilteredResultsPage, HomePage, NotFound } from "@/pages";

function App() {
  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="search" element={<FilteredResultsPage />} />
          </Route>
          <Route path="/*" element={<NotFound />} />
        </Routes>
      </Router>
    </>
  );
}

export default App;
