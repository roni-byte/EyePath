import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import TopBar from "../components/TopBar";

describe("TopBar Component", () => {
  test("renders logo and title", () => {
    render(<TopBar />);
    expect(screen.getByText(/EyePath/i)).toBeInTheDocument();
    expect(screen.getByAltText(/Logo/i)).toBeInTheDocument();
  });

  test("calls onAddTest when Add Test button is clicked", () => {
    const handleAddTest = jest.fn();
    render(<TopBar onAddTest={handleAddTest} />);

    const button = screen.getByText(/Add Test/i);
    fireEvent.click(button);

    expect(handleAddTest).toHaveBeenCalledTimes(1);
  });

  test("calls onViewTests when View Tests button is clicked", () => {
    const handleViewTests = jest.fn();
    render(<TopBar onViewTests={handleViewTests} />);

    const button = screen.getByText(/View Tests/i);
    fireEvent.click(button);

    expect(handleViewTests).toHaveBeenCalledTimes(1);
  });
});
