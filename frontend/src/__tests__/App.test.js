import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import { act } from "react";
import App from "../App";

jest.mock("../components/StudyViewer", () => (props) => (
  <div data-testid="study-viewer-mock">
    Viewing Study ID: {props.testId}
    <button onClick={props.onBack}>Back Mock</button>
  </div>
));
jest.mock(
  "../components/AddStudyForm",
  () => (props) =>
    props.open ? (
      <div data-testid="add-form-mock">
        Add Form Open <button onClick={props.onClose}>Close Mock</button>
      </div>
    ) : null
);
jest.mock("../components/LogoAnimation", () => () => <div>Logo Mock</div>);

describe("App Component Integration", () => {
  const mockTests = [
    { id: 1, name: "Study 1" },
    { id: 2, name: "Study 2" },
  ];

  beforeEach(() => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve(mockTests),
      })
    );
  });

  test("renders list of studies on load", async () => {
    await act(async () => {
      render(<App />);
    });

    expect(await screen.findByText("Study 1")).toBeInTheDocument();
    expect(screen.getByText("Study 2")).toBeInTheDocument();
  });

  test("opens AddStudyForm when clicking Add Test button", async () => {
    await act(async () => {
      render(<App />);
    });

    const addBtn = screen.getByText("Add Test");
    fireEvent.click(addBtn);

    expect(screen.getByTestId("add-form-mock")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Close Mock"));
    expect(screen.queryByTestId("add-form-mock")).not.toBeInTheDocument();
  });

  test("switches to StudyViewer when a study is selected", async () => {
    await act(async () => {
      render(<App />);
    });

    const studyItem = await screen.findByText("Study 1");
    fireEvent.click(studyItem);

    expect(screen.getByTestId("study-viewer-mock")).toBeInTheDocument();
    expect(screen.getByText("Viewing Study ID: 1")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Back Mock"));
    expect(screen.queryByTestId("study-viewer-mock")).not.toBeInTheDocument();
    expect(screen.getByText("Study 1")).toBeInTheDocument();
  });
});
