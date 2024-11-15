const getApiUrl = () => {
  if (process.env.NODE_ENV === "production") {
    return "https://tenji.cs.ovgu.de/api/";
  } else {
    return "http://localhost/api/";
  }
};

export const API_URL = getApiUrl();
