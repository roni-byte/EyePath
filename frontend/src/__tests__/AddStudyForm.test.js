import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import AddStudyForm, { handleDragEndHelper } from "../components/AddStudyForm";

jest.mock(
  "../components/UploadPhotoForm",
  () =>
    ({ onSelectDatabasePhoto, onClose, open }) =>
      open ? (
        <div data-testid="upload-photo-modal">
          <button
            onClick={() =>
              onSelectDatabasePhoto({
                id: 1,
                name: "Test Photo",
                base64Data: "fakebase64",
              })
            }
          >
            Add mock photo
          </button>
          <button onClick={onClose}>Close</button>
        </div>
      ) : null
);

describe("AddStudyForm Component", () => {
  const onCloseMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders modal and input field", () => {
    render(<AddStudyForm open={true} onClose={onCloseMock} />);
    expect(screen.getByText(/Add Test/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Test name/i)).toBeInTheDocument();
  });

  test("allows typing in the test name field", () => {
    render(<AddStudyForm open={true} onClose={onCloseMock} />);
    const input = screen.getByLabelText(/Test name/i);
    fireEvent.change(input, { target: { value: "Vision Test" } });
    expect(input.value).toBe("Vision Test");
  });

  test("opens the UploadPhotoForm modal when clicking Add photo", () => {
    render(<AddStudyForm open={true} onClose={onCloseMock} />);
    const addPhotoButton = screen.getByText(/Add photo/i);
    fireEvent.click(addPhotoButton);
    expect(screen.getByTestId("upload-photo-modal")).toBeInTheDocument();
  });

  test("adds selected photo from database", async () => {
    render(<AddStudyForm open={true} onClose={onCloseMock} />);

    fireEvent.click(screen.getByText(/Add photo/i));
    fireEvent.click(screen.getByText(/Add mock photo/i));

    await waitFor(() => {
      expect(screen.getByText(/Test Photo/i)).toBeInTheDocument();
    });
  });

  test("removes a selected photo when clicking delete", async () => {
    render(<AddStudyForm open={true} onClose={onCloseMock} />);

    fireEvent.click(screen.getByText(/Add photo/i));
    fireEvent.click(screen.getByText(/Add mock photo/i));

    await waitFor(() => screen.getByText(/Test Photo/i));

    const deleteBtn = screen.getByText(/delete/i);
    fireEvent.click(deleteBtn);

    await waitFor(() => {
      expect(screen.queryByText(/Test Photo/i)).not.toBeInTheDocument();
    });
  });

  test("sends POST request when saving a test", async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ id: 123, name: "Vision Test" }),
      })
    );

    render(<AddStudyForm open={true} onClose={onCloseMock} />);

    const input = screen.getByLabelText(/Test name/i);
    fireEvent.change(input, { target: { value: "Vision Test" } });

    fireEvent.click(screen.getByText(/Add photo/i));
    fireEvent.click(screen.getByText(/Add mock photo/i));

    await waitFor(() => screen.getByText(/Test Photo/i));

    fireEvent.click(screen.getByText(/Save test/i));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(1);
      const [url, options] = fetch.mock.calls[0];
      expect(url).toBe("http://localhost:8080/api/tests");
      expect(options.method).toBe("POST");
      expect(JSON.parse(options.body)).toMatchObject({
        name: "Vision Test",
        photoIds: [1],
      });
    });
  });
});

describe("handleDragEndHelper", () => {
  test("reorders photos correctly", () => {
    const photos = [
      { id: 1, name: "Photo A" },
      { id: 2, name: "Photo B" },
      { id: 3, name: "Photo C" },
    ];

    const result = {
      source: { index: 0 },
      destination: { index: 2 },
    };

    const reordered = handleDragEndHelper(photos, result);
    expect(reordered.map((p) => p.name)).toEqual([
      "Photo B",
      "Photo C",
      "Photo A",
    ]);
  });

  test("returns same array if no destination", () => {
    const photos = [
      { id: 1, name: "A" },
      { id: 2, name: "B" },
    ];
    const result = { source: { index: 0 }, destination: null };
    const reordered = handleDragEndHelper(photos, result);
    expect(reordered).toEqual(photos);
  });
});
