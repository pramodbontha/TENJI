export interface ICase {
  citing_cases: {
    low: number;
    high: number;
  };
  year: number;
  headnotes: string;
  reasoning: string;
  total_case_citations: {
    low: number;
    high: number;
  };
  facts: string;
  number: string;
  judgment: string;
  month: number;
  decision_type: string;
  panel_of_judges: string;
  bverfge_references: string;
  id: string;
  gg_references: string;
  day: number;
  caseName: string;
}

export interface CaseFilter {
  searchTerm: string;
  name: boolean;
  number: boolean;
  judgment: boolean;
  facts: boolean;
  reasoning: boolean;
  headnotes: boolean;
  startYear: string;
  endYear: string;
  decisionType: string[];
  skip: number;
  limit: number;
}

export interface CasesResponse {
  cases: ICase[];
  total: number;
}
