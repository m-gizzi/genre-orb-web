import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MessageBanner } from "./MessageBanner";

describe("MessageBanner", () => {
  it("renders nothing without a message", () => {
    const { container } = render(<MessageBanner message={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders a success message", () => {
    render(<MessageBanner message={{ type: "success", text: "Saved" }} />);
    const banner = screen.getByText("Saved");
    expect(banner).toBeInTheDocument();
    expect(banner).toHaveClass("text-primary");
  });

  it("renders an error message with destructive styling", () => {
    render(<MessageBanner message={{ type: "error", text: "Failed" }} />);
    expect(screen.getByText("Failed")).toHaveClass("text-destructive");
  });
});
