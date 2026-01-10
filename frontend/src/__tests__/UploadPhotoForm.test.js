import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import UploadPhotoForm from "../components/UploadPhotoForm";

describe("UploadPhotoForm", () => {
  const sampleItems = [
    { id: 1, name: "Item One", base64Data: "fake1" },
    { id: 2, name: "Item Two", base64Data: "fake2" },
    { id: 3, name: "Item Three", base64Data: "fake3" },
  ];

  beforeEach(() => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(sampleItems),
      })
    );
    URL.createObjectURL = jest.fn(() => "blob:preview-url");
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  test("renders modal when open", () => {
    render(<UploadPhotoForm open={true} onClose={() => {}} />);
    expect(screen.getByText("From Device")).toBeInTheDocument();
    expect(screen.getByText("From Database")).toBeInTheDocument();
  });

  test("does not render modal when closed", () => {
    render(<UploadPhotoForm open={false} onClose={() => {}} />);
    expect(screen.queryByText("From Device")).not.toBeInTheDocument();
  });

  test("calls onSelectDatabasePhoto when an item is clicked", async () => {
    const onSelectMock = jest.fn();
    const onCloseMock = jest.fn();

    render(
      <UploadPhotoForm
        open={true}
        onClose={onCloseMock}
        onSelectDatabasePhoto={onSelectMock}
      />
    );

    const firstItem = await screen.findByText("Item One");
    await waitFor(() => {
      fireEvent.click(firstItem);
      expect(onSelectMock).toHaveBeenCalledWith(sampleItems[0]);
      expect(onSelectMock).toHaveBeenCalledWith(
        expect.objectContaining(sampleItems[0])
      );
      expect(onCloseMock).toHaveBeenCalled();
    });
  });

  test("renders all items", async () => {
    await act(async () => {
      render(<UploadPhotoForm open={true} onClose={() => {}} />);
    });

    await waitFor(() => {
      sampleItems.forEach((item) => {
        expect(screen.getByText(item.name)).toBeInTheDocument();
      });
    });
  });

  test("shows file preview after selecting a file", async () => {
    await act(async () => {
      render(<UploadPhotoForm open={true} onClose={() => {}} />);
    });

    const fileInput = screen.getByTestId("file-input");
    const file = new File(["dummy content"], "test.png", { type: "image/png" });

    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [file] } });
    });

    expect(await screen.findByText("test.png")).toBeInTheDocument();
    expect(screen.getByAltText("Preview")).toHaveAttribute(
      "src",
      "blob:preview-url"
    );
  });

  test("uploads selected file successfully", async () => {
    const onSelectMock = jest.fn();
    const onCloseMock = jest.fn();
    const uploadedPhoto = { id: 99, name: "Uploaded Photo" };

    global.fetch = jest
      .fn()
      .mockImplementationOnce(() =>
        Promise.resolve({ ok: true, json: () => Promise.resolve(sampleItems) })
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(uploadedPhoto),
        })
      );

    await act(async () => {
      render(
        <UploadPhotoForm
          open={true}
          onClose={onCloseMock}
          onSelectDatabasePhoto={onSelectMock}
        />
      );
    });

    const fileInput = screen.getByTestId("file-input");
    const file = new File(["img"], "photo.png", { type: "image/png" });

    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [file] } });
    });

    const preview = await screen.findByText("photo.png");
    await act(async () => {
      fireEvent.click(preview);
    });

    await waitFor(() => {
      expect(onSelectMock).toHaveBeenCalledWith(uploadedPhoto);
      expect(onCloseMock).toHaveBeenCalled();
    });
  });

  test("handles upload error correctly", async () => {
    console.error = jest.fn();

    global.fetch = jest
      .fn()
      .mockImplementationOnce(() =>
        Promise.resolve({ ok: true, json: () => Promise.resolve(sampleItems) })
      )
      .mockImplementationOnce(() =>
        Promise.resolve({ ok: false, status: 500 })
      );

    await act(async () => {
      render(<UploadPhotoForm open={true} onClose={() => {}} />);
    });

    const fileInput = screen.getByTestId("file-input");
    const file = new File(["bad"], "broken.png", { type: "image/png" });

    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [file] } });
    });

    const preview = await screen.findByText("broken.png");
    await act(async () => {
      fireEvent.click(preview);
    });

    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith(
        "Error uploading file:",
        expect.any(Error)
      );
    });
  });

  test("handles fetch error when loading database photos", async () => {
    console.error = jest.fn();
    global.fetch = jest.fn(() => Promise.resolve({ ok: false, status: 404 }));

    await act(async () => {
      render(<UploadPhotoForm open={true} onClose={() => {}} />);
    });

    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith(
        "Failed to fetch photos:",
        expect.any(Error)
      );
    });
  });
});
