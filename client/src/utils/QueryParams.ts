import _ from "lodash";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const createQueryParams = (params: Record<string, any>) => {
  // Filter out undefined, null, or empty string values using lodash
  const filteredParams = _.pickBy(
    params,
    (value) => value !== undefined && value !== null && value !== ""
  );

  // Use URLSearchParams to build the query string
  const queryParams = new URLSearchParams(filteredParams);

  return queryParams.toString();
};
