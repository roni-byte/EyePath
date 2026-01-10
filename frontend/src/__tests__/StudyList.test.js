import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import StudyList from "../components/StudyList";

describe("StudyList Component", () => {
  test("renders message when list is empty", () => {
    render(<StudyList tests={[]} onSelectTest={jest.fn()} />);
    expect(screen.getByText("Zero tests available.")).toBeInTheDocument();
  });

  test("renders list of tests", () => {
    const tests = [
      { id: 1, name: "Study 1" },
      { id: 2, name: "Study 2" },
    ];
    render(<StudyList tests={tests} onSelectTest={jest.fn()} />);

    expect(screen.getByText("Study 1")).toBeInTheDocument();
    expect(screen.getByText("Study 2")).toBeInTheDocument();
  });

  test("calls onSelectTest when clicking an item", () => {
    const handleSelect = jest.fn();
    const tests = [{ id: 100, name: "Clickable Study" }];

    render(<StudyList tests={tests} onSelectTest={handleSelect} />);

    fireEvent.click(screen.getByText("Clickable Study"));
    expect(handleSelect).toHaveBeenCalledWith(100);
  });
});
