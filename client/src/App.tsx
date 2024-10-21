import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Layout } from "@/components";
import { FilteredResultsPage, HomePage } from "@/pages";

function App() {
  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="search" element={<FilteredResultsPage />} />
          </Route>
        </Routes>
      </Router>
    </>
  );
}

export default App;
