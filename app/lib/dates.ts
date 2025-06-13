// Utilitaire pour parser une date string YYYY-MM-DD en Date locale
export const parseLocalDate = (dateString: string) => {
  if (!dateString) return undefined;
  const [year, month, day] = dateString.split("-");
  return new Date(Number(year), Number(month) - 1, Number(day));
};

// Calcule la saison d'une date donnée
// Une saison commence le 1er juillet et se termine le 30 avril de l'année suivante
// Par exemple: 8 novembre 2024 -> saison 2025, 15 février 2025 -> saison 2025
export const getSeasonFromDate = (date: Date): number => {
  const year = date.getFullYear();
  const month = date.getMonth() + 1; // getMonth() retourne 0-11, on veut 1-12
  
  // Si on est entre juillet (7) et décembre (12), c'est la saison de l'année suivante
  if (month >= 7) {
    return year + 1;
  }
  // Si on est entre janvier (1) et avril (4), c'est la saison de l'année courante
  else if (month <= 4) {
    return year;
  }
  // Mai et juin ne font pas partie d'une saison officielle, on retourne l'année courante
  else {
    return year;
  }
};

// Obtient la saison actuelle
export const getCurrentSeason = (): number => {
  return getSeasonFromDate(new Date());
};

// Génère la liste des saisons disponibles basée sur les dates des inscriptions
export const getSeasonsFromInscriptions = (inscriptions: Array<{eventData: {startDate: string}}>): number[] => {
  const seasons = new Set<number>();
  
  inscriptions.forEach(inscription => {
    const date = new Date(inscription.eventData.startDate);
    const season = getSeasonFromDate(date);
    seasons.add(season);
  });
  
  // Ajoute aussi la saison actuelle au cas où il n'y aurait pas d'inscriptions
  seasons.add(getCurrentSeason());
  
  return Array.from(seasons).sort((a, b) => b - a); // Trie par ordre décroissant
};
