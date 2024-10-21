export interface Reference {
  id: string;
  context: string;
  next_toc: string;
  resource: string;
  text: string;
}

export interface ReferenceFilter {
  searchTerm: string;
  context: boolean;
  refCasesArticles: boolean;
  resources: string[];
  text: boolean;
  skip: number;
  limit: number;
}

export interface ReferencesResponse {
  references: Reference[];
  total: number;
}
