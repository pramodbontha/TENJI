import { Outlet } from "react-router-dom";
import Header from "./Header";

import SearchBar from "./SearchBar";

const Layout = () => {
  return (
    <div className="h-screen bg-gray-200">
      <Header />
      <div className="mt-6 ml-6 mr-6">
        <SearchBar />
        <Outlet />
      </div>
    </div>
  );
};

export default Layout;
