const NotFound = () => {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <h1 className="text-6xl font-bold text-black-500">404</h1>
      <p className="text-lg text-gray-600 mt-4">
        The page you are looking for does not exist.
      </p>
      <a
        href="/"
        className="mt-6 px-4 py-2 bg-slate-800 text-white rounded hover:bg-slate-600"
      >
        Go Back Home
      </a>
    </div>
  );
};

export default NotFound;
