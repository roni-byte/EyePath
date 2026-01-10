import "@testing-library/jest-dom";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import EyeGestures from "eyegestures";
import RunStudy from "../components/RunStudy";

jest.mock("eyegestures", () => {
  return jest.fn().mockImplementation(() => ({
    start: jest.fn(),
    stop: jest.fn(),
  }));
});

beforeAll(() => {
  window.alert = jest.fn();
});

const mockGetUserMediaSuccess = jest.fn(() =>
  Promise.resolve({
    getTracks: () => [{ stop: jest.fn() }],
  })
);

Object.defineProperty(global.navigator, "mediaDevices", {
  value: {
    getUserMedia: mockGetUserMediaSuccess,
  },
  writable: true,
});

describe("RunStudy Component", () => {
  const mockTest = {
    id: 1,
    name: "Test Study",
    photos: [
      { id: 101, name: "Photo1", base64Data: "fake1" },
      { id: 102, name: "Photo2", base64Data: "fake2" },
    ],
  };

  const mockOnClose = jest.fn();
  const mockOnSuccess = jest.fn();
  const mockOnFailure = jest.fn();

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();

    Object.defineProperty(global.navigator, "mediaDevices", {
      value: { getUserMedia: mockGetUserMediaSuccess },
      writable: true,
    });

    global.fetch = jest.fn((url) => {
      if (url.includes("/api/tests/1")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockTest),
        });
      }
      if (url.includes("/api/result/create")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ id: 555 }),
        });
      }
      if (url.includes("/api/point/save/batch")) {
        return Promise.resolve({ ok: true });
      }
      if (url.includes("/api/result/555/points")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  test("runs through the complete study flow (Happy Path)", async () => {
    await act(async () => {
      render(
        <RunStudy
          testId={1}
          onSuccess={mockOnSuccess}
          onClose={mockOnClose}
          onFailure={mockOnFailure}
        />
      );
    });

    const nameInput = screen.getByPlaceholderText("Name...");
    fireEvent.change(nameInput, { target: { value: "Test Participant" } });

    const startBtn = screen.getByText("Start test");
    await act(async () => {
      fireEvent.click(startBtn);
    });

    expect(screen.getByText("Preparing configuration...")).toBeInTheDocument();

    await waitFor(() => {
      expect(
        screen.queryByText("Enter participant name")
      ).not.toBeInTheDocument();
    });

    await act(async () => {
      await Promise.resolve();
    });
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(EyeGestures).toHaveBeenCalled();
    const mockGazeCallback = EyeGestures.mock.calls[0][1];

    act(() => {
      mockGazeCallback([0, 0], false);
    });

    expect(
      screen.queryByText("Preparing configuration...")
    ).not.toBeInTheDocument();
    expect(document.body.style.cursor).toBe("none");

    act(() => {
      mockGazeCallback([0, 0], true);
    });
    await act(async () => {
      mockGazeCallback([0, 0], false);
    });

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:8080/api/result/create",
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining("Test Participant"),
      })
    );

    const img = await screen.findByAltText("Photo1");
    Object.defineProperty(img, "naturalWidth", { value: 1000, writable: true });
    Object.defineProperty(img, "naturalHeight", { value: 800, writable: true });
    fireEvent.load(img);

    act(() => {
      mockGazeCallback([500, 400], false);
    });

    act(() => {
      jest.advanceTimersByTime(10000);
    });

    const img2 = await screen.findByAltText("Photo2");
    expect(img2).toBeInTheDocument();
    Object.defineProperty(img2, "naturalWidth", {
      value: 1000,
      writable: true,
    });
    Object.defineProperty(img2, "naturalHeight", {
      value: 800,
      writable: true,
    });
    fireEvent.load(img2);

    act(() => {
      mockGazeCallback([200, 200], false);
    });

    act(() => {
      jest.advanceTimersByTime(10000);
    });

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:8080/api/point/save/batch",
      expect.objectContaining({
        method: "POST",
      })
    );

    expect(
      await screen.findByText("Study results for: Test Participant")
    ).toBeInTheDocument();

    expect(document.body.style.cursor).toBe("default");

    const downloadBtn = screen.getByText("Download CSV");
    fireEvent.click(downloadBtn);
  });

  test("calls onClose and onFailure when camera permission is denied", async () => {
    let rejectPermission;

    const pendingPromise = new Promise((_, reject) => {
      rejectPermission = reject;
    });

    Object.defineProperty(global.navigator, "mediaDevices", {
      value: {
        getUserMedia: jest.fn(() => pendingPromise),
      },
      writable: true,
    });

    await act(async () => {
      render(
        <RunStudy
          testId={1}
          onSuccess={mockOnSuccess}
          onClose={mockOnClose}
          onFailure={mockOnFailure}
        />
      );
    });

    fireEvent.change(screen.getByPlaceholderText("Name..."), {
      target: { value: "Error User" },
    });
    const startBtn = screen.getByText("Start test");

    await act(async () => {
      fireEvent.click(startBtn);
    });

    expect(screen.getByText("Preparing configuration...")).toBeInTheDocument();

    await act(async () => {
      rejectPermission(
        new DOMException("Permission denied", "NotAllowedError")
      );
    });

    expect(
      screen.queryByText("Preparing configuration...")
    ).not.toBeInTheDocument();

    expect(mockOnFailure).toHaveBeenCalledWith(
      expect.stringContaining("Camera access denied")
    );

    expect(mockOnClose).toHaveBeenCalled();
    expect(document.body.style.cursor).toBe("default");
  });
});
