// Utilitaire pour parser une date string YYYY-MM-DD en Date locale
export const parseLocalDate = (dateString: string) => {
  if (!dateString) return undefined;
  const [year, month, day] = dateString.split("-");
  return new Date(Number(year), Number(month) - 1, Number(day));
};
