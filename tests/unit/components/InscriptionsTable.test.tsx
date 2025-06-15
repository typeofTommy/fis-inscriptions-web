import React from "react";
import {render, screen, fireEvent, waitFor} from "@testing-library/react";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import {InscriptionsTable} from "@/components/InscriptionsTable";
import {vi, describe, it, expect, beforeEach, afterEach} from "vitest";

// Mock the hooks and dependencies
vi.mock("@/hooks/useCountryInfo", () => ({
  useCountryInfo: vi.fn(() => ({
    getCountryInfo: vi.fn(() => ({name: "France", flag: "🇫🇷"})),
  })),
}));

vi.mock("next/link", () => ({
  default: ({children, href}: {children: React.ReactNode; href: string}) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("next/image", () => ({
  default: ({src, alt, ...props}: any) => (
    <img src={src} alt={alt} {...props} />
  ),
}));

// Mock data
const mockInscriptions: any[] = [
  {
    id: 1,
    eventId: 1234,
    eventData: {
      codex: 1234,
      gender: "M",
      raceDiscipline: "AL",
      raceLevel: "FIS",
      eventName: "Test Event",
      startDate: new Date("2024-01-15").toISOString(),
      endDate: new Date("2024-01-17").toISOString(),
      venue: "Test Venue",
      country: "FRA",
      place: "Test Station",
      placeNationCode: "FRA",
      organiserNationCode: "FRA",
      competitions: [
        {
          codex: 1234,
          eventCode: "AL",
          categoryCode: "FIS",
          genderCode: "M",
        },
      ],
    },
    status: "open",
    createdBy: "test-user",
    createdAt: new Date("2024-01-01T00:00:00Z").toISOString(),
    emailSentAt: null,
    deletedAt: null,
  },
  {
    id: 2,
    eventId: 5678,
    eventData: {
      codex: 5678,
      gender: "F",
      raceDiscipline: "SL",
      raceLevel: "NC",
      eventName: "Another Event",
      startDate: new Date("2024-02-15").toISOString(),
      endDate: new Date("2024-02-17").toISOString(),
      venue: "Another Venue",
      country: "SUI",
      place: "Another Station",
      placeNationCode: "SUI",
      organiserNationCode: "SUI",
      competitions: [
        {
          codex: 5678,
          eventCode: "SL",
          categoryCode: "NC",
          genderCode: "F",
        },
      ],
    },
    status: "validated",
    createdBy: "test-user",
    createdAt: new Date("2024-01-02T00:00:00Z").toISOString(),
    emailSentAt: null,
    deletedAt: null,
  },
];

// Mock API response
const mockApiResponse = mockInscriptions;

const createTestQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
};

const renderWithQueryClient = (component: React.ReactElement) => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>{component}</QueryClientProvider>
  );
};

describe("InscriptionsTable", () => {
  beforeEach(() => {
    // Mock fetch for the API calls
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockApiResponse),
      })
    ) as any;
    // Force desktop width
    window.innerWidth = 1200;
    window.dispatchEvent(new Event("resize"));
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it("should render loading state initially", () => {
    renderWithQueryClient(<InscriptionsTable />);
    expect(screen.getByText(/chargement/i)).toBeInTheDocument();
  });

  it.skip("should render inscriptions table with data", async () => {
    renderWithQueryClient(<InscriptionsTable />);

    await waitFor(() => {
      expect(screen.getByText("Test Station")).toBeInTheDocument();
      expect(screen.getByText("Another Station")).toBeInTheDocument();
    });
  });

  it.skip("should filter inscriptions by search term", async () => {
    renderWithQueryClient(<InscriptionsTable />);

    await waitFor(() => {
      expect(screen.getByText("Test Station")).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText("Rechercher une compétition...");
    fireEvent.change(input, {target: {value: "Another"}});

    await waitFor(() => {
      expect(screen.getByText("Another Station")).toBeInTheDocument();
      expect(screen.queryByText("Test Station")).not.toBeInTheDocument();
    });
  });

  it.skip("should filter by season", async () => {
    renderWithQueryClient(<InscriptionsTable />);

    await waitFor(() => {
      expect(screen.getByText("Test Station")).toBeInTheDocument();
    });

    const seasonButton = screen.getByRole("combobox", {name: /saison/i});
    fireEvent.click(seasonButton);
    const option = await screen.findByText("2025");
    fireEvent.click(option);

    await waitFor(() => {
      expect(screen.getByText("Another Station")).toBeInTheDocument();
      expect(screen.queryByText("Test Station")).not.toBeInTheDocument();
    });
  });

  it.skip("should sort table columns", async () => {
    renderWithQueryClient(<InscriptionsTable />);

    await waitFor(() => {
      expect(screen.getByText("Test Station")).toBeInTheDocument();
    });

    const columnHeader = screen.getByText("Station");
    fireEvent.click(columnHeader);

    await waitFor(() => {
      // Après tri, la première ligne doit être "Another Station"
      const rows = screen.getAllByRole("row");
      expect(rows[1]).toHaveTextContent("Another Station");
    });
  });

  it.skip("should toggle between table and card view on mobile", async () => {
    // Simule une largeur mobile
    window.innerWidth = 400;
    window.dispatchEvent(new Event("resize"));
    renderWithQueryClient(<InscriptionsTable />);

    await waitFor(() => {
      expect(
        screen.getAllByText(/test station/i).length
      ).toBeGreaterThanOrEqual(1);
    });
  });

  it.skip("should show status badges with correct colors", async () => {
    renderWithQueryClient(<InscriptionsTable />);
    await waitFor(() => {
      expect(
        screen.getAllByTestId("badge-status-open").length
      ).toBeGreaterThanOrEqual(1);
      expect(
        screen.getAllByTestId("badge-status-validated").length
      ).toBeGreaterThanOrEqual(1);
    });
  });

  it.skip("should render discipline and level badges", async () => {
    renderWithQueryClient(<InscriptionsTable />);
    // Vérifie que la colonne Disciplines est bien présente
    await waitFor(() => {
      expect(screen.getByText(/disciplines/i)).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(
        screen.getAllByTestId("badge-discipline-AL").length
      ).toBeGreaterThanOrEqual(1);
      expect(
        screen.getAllByTestId("badge-discipline-SL").length
      ).toBeGreaterThanOrEqual(1);
      expect(
        screen.getAllByTestId("badge-level-FIS").length
      ).toBeGreaterThanOrEqual(1);
      expect(
        screen.getAllByTestId("badge-level-NC").length
      ).toBeGreaterThanOrEqual(1);
    });
  });

  it("should handle API error gracefully", async () => {
    (global.fetch as any) = vi.fn(() => Promise.resolve({ok: false}));
    renderWithQueryClient(<InscriptionsTable />);
    await waitFor(() => {
      expect(
        screen.getAllByText(/pas de résultats/i).length
      ).toBeGreaterThanOrEqual(1);
    });
  });

  it.skip("should render all inscription rows", async () => {
    renderWithQueryClient(<InscriptionsTable />);
    await waitFor(() => {
      const rows = screen.queryAllByTestId(/row-inscription-/);
      // On doit avoir autant de lignes que d'inscriptions dans le mock
      expect(rows.length).toBe(mockInscriptions.length);
    });
  });
});
