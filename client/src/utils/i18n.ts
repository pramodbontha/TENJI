import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
  en: {
    translation: {
      "use-filters": "Use Filters for Advanced Search",
      filters: "Filters",
      "clear-filters": "Clear Filters",
      search: "Search",
      apply: "Apply",
      reset: "Reset",
      "recommended-articles": "Recommended Articles",
      "recommended-cases": "Recommended Cases",
      "recommended-books": "Recommended Books",
      "article-number": "Article Number",
      "case-number": "Case Number",
      year: "Year",
      decision: "Decision",
      citations: "Citations",
      more: "More",
      name: "Name",
      summary: "Summary",
      facts: "Facts",
      judgement: "Judgement",
      reasoning: "Reasoning",
      headnotes: "Headnotes",
      "search-results": "Search Results",
      "articles-found": "Articles Found",
      articles: "Articles",
      cases: "Cases",
      references: "References",
      "cases-found": "Cases Found",
      "references-found": "References Found",
      context: "Context",
      "find-in-book": "Find in Book",
      sections: "Sections",
      "no-references-found":
        "No references found. Select further sections to find references.",
      "no-further-sections": "No further sections found.",
      "interaction-history": "Interaction History",
      "cited-by-cases": "Cited by Cases",
      "book-references": "Book References",
      "cited-cases": "Cited Cases",
      "cited-articles": "Cited Articles",
      "cited-by-articles": "Cited by Articles",
      "search-in": "Search in",
      "filter-by": "Filter by",
      number: "Number",
      text: "Text",
      books: "Books",
      "references-to-articles-and-cases": "References to Articles and Cases",
      "context-of-the-references": "Context of the References",
      resources: "Resources",
      "use this button to return to home page.":
        "Use this button to return to home page.",
      type: "Type",
      found: "Found",
      of: "of",
      "in-the-text": "In the Text",
      "citations-network": "Citations Network",
      next: "Next",
      previous: "Previous",
      finish: "Finish",
      "items-per-page": "/ Page",
      "start-tour": "Start Tour",
    },
  },
  de: {
    translation: {
      "use-filters": "Verwenden Sie Filter für die erweiterte Suche",
      filters: "Filter",
      "clear-filters": "Filter löschen",
      search: "Suche",
      apply: "Anwenden",
      reset: "Zurücksetzen",
      "recommended-articles": "Empfohlene Artikel",
      "recommended-cases": "Empfohlene Fälle",
      "recommended-books": "Empfohlene Bücher",
      "article-number": "Artikelnummer",
      "case-number": "Fallnummer",
      year: "Jahr",
      decision: "Entscheidung",
      citations: "Zitate",
      more: "Mehr",
      name: "Name",
      summary: "Zusammenfassung",
      facts: "Fakten",
      judgement: "Urteil",
      reasoning: "Begründung",
      headnotes: "Leitsätze",
      "search-results": "Suchergebnisse",
      "articles-found": "Artikel gefunden",
      articles: "Artikel",
      cases: "Fälle",
      references: "Referenzen",
      "cases-found": "Fälle gefunden",
      "references-found": "Referenzen gefunden",
      context: "Kontext",
      "find-in-book": "In Buch finden",
      sections: "Abschnitte",
      "no-references-found":
        "Keine Referenzen gefunden. Wählen Sie weitere Abschnitte aus, um Referenzen zu finden.",
      "no-further-sections": "Keine weiteren Abschnitte gefunden.",
      "interaction-history": "Interaktionsgeschichte",
      "cited-by-cases": "Zitiert von Fällen",
      "book-references": "Buchreferenzen",
      "cited-cases": "Zitierte Fälle",
      "cited-articles": "Zitierte Artikel",
      "cited-by-articles": "Zitiert von Artikeln",
      "search-in": "Suche in",
      "filter-by": "Filtern nach",
      number: "Nummer",
      text: "Text",
      books: "Bücher",
      "references-to-articles-and-cases": "Verweise auf Artikel und Fälle",
      "context-of-the-references": "Kontext der Verweise",
      resources: "Ressourcen",
      "use this button to return to home page.":
        "Verwenden Sie diese Schaltfläche, um zur Startseite zurückzukehren.",
      type: "Typ",
      found: "Gefunden",
      of: "von",
      "in-the-text": "In den Text",
      "citations-network": "Zitationsnetzwerk",
      next: "Nächster",
      previous: "Vorheriger",
      finish: "Fertig",
      "items-per-page": "/ Seite",
      "start-tour": "Tour starten",
    },
  },
  "pt-PT": {
    translation: {
      "use-filters": "Use Filtros para Pesquisa Avançada",
      filters: "Filtros",
      "clear-filters": "Limpar Filtros",
      search: "Pesquisar",
      apply: "Aplicar",
      reset: "Repor",
      "recommended-articles": "Artigos Recomendados",
      "recommended-cases": "Casos Recomendados",
      "recommended-books": "Livros Recomendados",
      "article-number": "Número do Artigo",
      "case-number": "Número do Caso",
      year: "Ano",
      decision: "Decisão",
      citations: "Citações",
      more: "Mais",
      name: "Nome",
      summary: "Resumo",
      facts: "Factos",
      judgement: "Sentença",
      reasoning: "Raciocínio",
      headnotes: "Sumários",
      "search-results": "Resultados da Pesquisa",
      "articles-found": "Artigos Encontrados",
      articles: "Artigos",
      cases: "Casos",
      references: "Referências",
      "cases-found": "Casos Encontrados",
      "references-found": "Referências Encontradas",
      context: "Contexto",
      "find-in-book": "Encontrar no Livro",
      sections: "Secções",
      "no-references-found":
        "Não foram encontradas referências. Selecione mais secções para encontrar referências.",
      "no-further-sections": "Não foram encontradas mais secções.",
      "interaction-history": "Histórico de Interação",
      "cited-by-cases": "Citado por Casos",
      "book-references": "Referências de Livros",
      "cited-cases": "Casos Citados",
      "cited-articles": "Artigos Citados",
      "cited-by-articles": "Citado por Artigos",
      "search-in": "Pesquisar em",
      "filter-by": "Filtrar por",
      number: "Número",
      text: "Texto",
      books: "Livros",
      "references-to-articles-and-cases": "Referências a Artigos e Casos",
      "context-of-the-references": "Contexto das Referências",
      resources: "Recursos",
      "use this button to return to home page.":
        "Utilize este botão para voltar à página inicial.",
      type: "Tipo",
      found: "Encontrado",
      of: "de",
      "in-the-text": "No Texto",
      "citations-network": "Rede de Citações",
      next: "Seguinte",
      previous: "Anterior",
      finish: "Terminar",
      "items-per-page": "/ Página",
      "start-tour": "Iniciar Tour",
    },
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: "de",
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
