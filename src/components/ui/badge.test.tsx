import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Badge } from "./badge";

describe("Badge component", () => {
  it("renders children correctly", () => {
    const { getByText } = render(<Badge>Test Badge</Badge>);
    expect(getByText("Test Badge")).toBeInTheDocument();
  });

  it("applies the correct variant class", () => {
    const { getByText } = render(<Badge variant="destructive">Destructive</Badge>);
    const badge = getByText("Destructive");
    expect(badge).toHaveClass("bg-destructive");
  });
});
