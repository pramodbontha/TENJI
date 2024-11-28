export interface Article {
  id: string;
  name: string;
  citing_cases: {
    low: number;
    high: number;
  };
  number: string;
  text: string;
  total_case_citations: {
    low: number;
    high: number;
  };
  resource: string;
}

export interface ArticleFilter {
  searchTerm: string;
  name: boolean;
  number: boolean;
  text: boolean;
  skip: number;
  limit: number;
}

export interface ArticlesResponse {
  articles: Article[];
  total: number;
}
