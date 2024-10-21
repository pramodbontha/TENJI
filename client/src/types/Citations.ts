import { Article } from "./Article";
import { ICase } from "./Case";
import { Reference } from "./Reference";

export interface CitationsCaseFilter {
  caseId: string;
  searchTerm?: string;
  skip?: number;
  limit?: number;
}

export interface CitationsArticleFilter {
  articleId: string;
  searchTerm?: string;
  skip?: number;
  limit?: number;
}

export interface CitationsCases {
  cases: ICase[];
  total: number;
}

export interface CitationsArticles {
  articles: Article[];
  total: number;
}

export interface CitationsReferences {
  references: Reference[];
  total: number;
}
