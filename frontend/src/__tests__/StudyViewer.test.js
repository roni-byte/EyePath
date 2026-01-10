import "@testing-library/jest-dom";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import StudyViewer from "../components/StudyViewer";

jest.mock("../components/HeatmapResult", () => () => (
  <div data-testid="heatmap-mock" />
));
jest.mock("../components/RunStudy", () => () => (
  <div data-testid="run-study-mock" />
));

describe("StudyViewer Component", () => {
  const mockTest = {
    id: 1,
    name: "Test Study 1",
    photos: [
      { id: 10, name: "Photo A", base64Data: "fakeA" },
      { id: 11, name: "Photo B", base64Data: "fakeB" },
    ],
  };

  const mockParticipants = [
    { id: 101, name: "User One", atDate: "2023-01-01" },
    { id: 102, name: "User Two", atDate: "2023-01-02" },
  ];

  beforeEach(() => {
    global.fetch = jest.fn((url) => {
      if (url.includes("/api/tests/1")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockTest),
        });
      }
      if (url.includes("/api/result/test/1")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockParticipants),
        });
      }
      if (url.includes("/points")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("renders details and navigates slideshow", async () => {
    await act(async () => {
      render(<StudyViewer testId={1} onBack={jest.fn()} tests={[]} />);
    });

    expect(await screen.findByText("Test Study 1")).toBeInTheDocument();

    const slideshowBtn = screen.getByText("Photos Slideshow");
    fireEvent.click(slideshowBtn);

    const img = screen.getByAltText("Photo A");
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", "data:image/png;base64,fakeA");

    const nextBtn = screen.getByText("Next →");
    fireEvent.click(nextBtn);

    const img2 = screen.getByAltText("Photo B");
    expect(img2).toBeInTheDocument();
    expect(img2).toHaveAttribute("src", "data:image/png;base64,fakeB");

    const prevBtn = screen.getByText("← Previous");
    fireEvent.click(prevBtn);
    expect(screen.getByAltText("Photo A")).toBeInTheDocument();
  });

  test("switches to Results view and filters participants", async () => {
    await act(async () => {
      render(<StudyViewer testId={1} onBack={jest.fn()} tests={[]} />);
    });

    const resultsBtn = screen.getByText("Results");
    await act(async () => {
      fireEvent.click(resultsBtn);
    });

    expect(await screen.findByText("Download CSV")).toBeInTheDocument();

    expect(await screen.findByText(/User One/)).toBeInTheDocument();

    const select = screen.getByRole("combobox");
    expect(select).toBeInTheDocument();

    await act(async () => {
      fireEvent.change(select, { target: { value: "101" } });
    });

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "http://localhost:8080/api/result/101/points"
      );
    });
  });
});
