import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import FilterBar from "./FilterBar";

const STAGES = [
  { key: "sourced", label: "Sourced", color: "#blue" },
  { key: "applied", label: "Applied", color: "#green" },
];

describe("FilterBar", () => {
  let props;

  beforeEach(() => {
    props = {
      search: "",
      setSearch: vi.fn(),
      sortBy: "date_desc",
      setSortBy: vi.fn(),
      minScore: 0,
      setMinScore: vi.fn(),
      hiddenStages: new Set(),
      setHiddenStages: vi.fn(),
      stages: STAGES,
    };
  });

  it("renders search input, sort select, score select, and stage chips", () => {
    render(<FilterBar {...props} />);
    expect(screen.getByPlaceholderText(/search company or title/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue("Newest first")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Any score")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sourced" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Applied" })).toBeInTheDocument();
  });

  it("typing in search input calls setSearch", async () => {
    const user = userEvent.setup();
    render(<FilterBar {...props} />);
    await user.type(screen.getByPlaceholderText(/search company or title/i), "Acme");
    expect(props.setSearch).toHaveBeenCalled();
  });

  it("changing sort select calls setSortBy with the new value", async () => {
    const user = userEvent.setup();
    render(<FilterBar {...props} />);
    await user.selectOptions(screen.getByDisplayValue("Newest first"), "date_asc");
    expect(props.setSortBy).toHaveBeenCalledWith("date_asc");
  });

  it("changing score select calls setMinScore with a number (not a string)", async () => {
    const user = userEvent.setup();
    render(<FilterBar {...props} />);
    await user.selectOptions(screen.getByDisplayValue("Any score"), "70");
    expect(props.setMinScore).toHaveBeenCalledWith(70);
    expect(typeof props.setMinScore.mock.calls[0][0]).toBe("number");
  });

  it("clicking a stage chip calls setHiddenStages", async () => {
    const user = userEvent.setup();
    render(<FilterBar {...props} />);
    await user.click(screen.getByRole("button", { name: "Sourced" }));
    expect(props.setHiddenStages).toHaveBeenCalled();
  });

  it("hidden stage chips have muted class and no pip element", () => {
    render(<FilterBar {...props} hiddenStages={new Set(["sourced"])} />);
    const btn = screen.getByRole("button", { name: "Sourced" });
    expect(btn).toHaveClass("muted");
    expect(btn.querySelector(".pip")).not.toBeInTheDocument();
  });

  it("visible stage chips have a pip element", () => {
    render(<FilterBar {...props} />);
    const btn = screen.getByRole("button", { name: "Sourced" });
    expect(btn.querySelector(".pip")).toBeInTheDocument();
  });

  it("Clear filters button is hidden when no filters are active", () => {
    render(<FilterBar {...props} />);
    expect(screen.queryByRole("button", { name: /clear filters/i })).not.toBeInTheDocument();
  });

  it("Clear filters button is visible when search is active", () => {
    render(<FilterBar {...props} search="acme" />);
    expect(screen.getByRole("button", { name: /clear filters/i })).toBeInTheDocument();
  });

  it("Clear filters button is visible when a stage is hidden", () => {
    render(<FilterBar {...props} hiddenStages={new Set(["sourced"])} />);
    expect(screen.getByRole("button", { name: /clear filters/i })).toBeInTheDocument();
  });

  it("clicking Clear filters resets all four filter values", async () => {
    const user = userEvent.setup();
    render(
      <FilterBar
        {...props}
        search="acme"
        sortBy="score_desc"
        minScore={70}
        hiddenStages={new Set(["sourced"])}
      />
    );

    await user.click(screen.getByRole("button", { name: /clear filters/i }));

    expect(props.setSearch).toHaveBeenCalledWith("");
    expect(props.setSortBy).toHaveBeenCalledWith("date_desc");
    expect(props.setMinScore).toHaveBeenCalledWith(0);
    expect(props.setHiddenStages).toHaveBeenCalledWith(new Set());
  });
});
