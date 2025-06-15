import {describe, it, expect} from "vitest";
import {
  getSeasonFromDate,
  getCurrentSeason,
  getSeasonsFromInscriptions,
} from "@/app/lib/dates";

describe("Date utilities", () => {
  describe("getSeasonFromDate", () => {
    it("should return correct season for January date", () => {
      expect(getSeasonFromDate(new Date("2024-01-15"))).toBe(2024);
    });

    it("should return correct season for September date", () => {
      expect(getSeasonFromDate(new Date("2024-09-15"))).toBe(2025);
    });

    it("should return correct season for July date (end of season)", () => {
      expect(getSeasonFromDate(new Date("2024-07-15"))).toBe(2025);
    });

    it("should return correct season for August date (start of new season)", () => {
      expect(getSeasonFromDate(new Date("2024-08-15"))).toBe(2025);
    });

    it("should handle Date objects", () => {
      const date = new Date("2024-01-15");
      expect(getSeasonFromDate(date)).toBe(2024);
    });
  });

  describe("getCurrentSeason", () => {
    it("should return current season as a number", () => {
      const season = getCurrentSeason();
      expect(typeof season).toBe("number");
    });

    it("should return season based on current date logic", () => {
      const now = new Date();
      const expectedSeason = getSeasonFromDate(now);
      expect(getCurrentSeason()).toBe(expectedSeason);
    });
  });

  describe("getSeasonsFromInscriptions", () => {
    const mockInscriptions: any[] = [
      {
        eventData: {startDate: "2024-01-15"},
      },
      {
        eventData: {startDate: "2024-09-15"},
      },
    ];

    it("should extract unique seasons from inscriptions", () => {
      const seasons = getSeasonsFromInscriptions(mockInscriptions);
      expect(seasons).toContain(2024);
      expect(seasons).toContain(2025);
      expect(seasons.length).toBe(2);
    });

    it("should sort seasons in descending order", () => {
      const seasons = getSeasonsFromInscriptions(mockInscriptions);
      expect(seasons[0]).toBe(2025);
      expect(seasons[1]).toBe(2024);
    });

    it("should handle empty array", () => {
      const seasons = getSeasonsFromInscriptions([]);
      expect(Array.isArray(seasons)).toBe(true);
      expect(seasons.length).toBe(1);
      expect(typeof seasons[0]).toBe("number");
    });

    it("should handle inscriptions from same season", () => {
      const sameSeasonInscriptions = [
        {eventData: {startDate: "2024-01-15"}},
        {eventData: {startDate: "2024-02-15"}},
        {eventData: {startDate: "2024-03-15"}},
      ];
      const seasons = getSeasonsFromInscriptions(sameSeasonInscriptions);
      expect(seasons).toEqual([2024]);
    });
  });
});
