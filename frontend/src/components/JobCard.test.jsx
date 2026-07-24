import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import JobCard from "./JobCard";

const base = {
  company: "Acme Corp",
  title: "Senior Engineer",
  location: "Remote",
  salary: "$120k",
  priority: "medium",
  fit_score: null,
  fit_notes: null,
};

const props = (overrides = {}) => ({
  job: { ...base, ...overrides },
  stageColor: "#aaa",
  onClick: vi.fn(),
  onDragStart: vi.fn(),
  onDragEnd: vi.fn(),
  isDragging: false,
});

describe("JobCard", () => {
  it("renders company name and title", () => {
    render(<JobCard {...props()} />);
    expect(screen.getByText("Acme Corp")).toBeInTheDocument();
    expect(screen.getByText("Senior Engineer")).toBeInTheDocument();
  });

  it("renders location and salary tags", () => {
    render(<JobCard {...props()} />);
    expect(screen.getByText("Remote")).toBeInTheDocument();
    expect(screen.getByText("$120k")).toBeInTheDocument();
  });

  it("renders no score badge when fit_score is null", () => {
    const { container } = render(<JobCard {...props()} />);
    expect(container.querySelector(".score")).not.toBeInTheDocument();
  });

  it("renders fit score badge with score-green class for score >= 70", () => {
    render(<JobCard {...props({ fit_score: 75 })} />);
    const badge = screen.getByText("75");
    expect(badge).toHaveClass("score-green");
  });

  it("renders score-amber class for score 45–69", () => {
    render(<JobCard {...props({ fit_score: 60 })} />);
    expect(screen.getByText("60")).toHaveClass("score-amber");
  });

  it("renders score-red class for score below 45", () => {
    render(<JobCard {...props({ fit_score: 30 })} />);
    expect(screen.getByText("30")).toHaveClass("score-red");
  });

  it("shows priority-high dot for high priority", () => {
    const { container } = render(<JobCard {...props({ priority: "high" })} />);
    expect(container.querySelector(".priority-high")).toBeInTheDocument();
  });

  it("shows priority-low dot for low priority", () => {
    const { container } = render(<JobCard {...props({ priority: "low" })} />);
    expect(container.querySelector(".priority-low")).toBeInTheDocument();
  });

  it("shows no priority dot for medium priority", () => {
    const { container } = render(<JobCard {...props({ priority: "medium" })} />);
    expect(container.querySelector(".priority-dot")).not.toBeInTheDocument();
  });

  it("renders score tooltip with per-dimension notes when fit_notes present", () => {
    const fit_notes = {
      skills: { score: 80, note: "Strong match" },
      experience: { score: 70, note: "Good" },
      location: { score: 90, note: "Remote ok" },
      role_scope: { score: 75, note: "Senior level" },
    };
    render(<JobCard {...props({ fit_score: 79, fit_notes })} />);
    expect(screen.getByText("Strong match")).toBeInTheDocument();
    expect(screen.getByText("Good")).toBeInTheDocument();
  });

  it("calls onClick when card is clicked", () => {
    const onClick = vi.fn();
    const { container } = render(<JobCard {...props()} onClick={onClick} />);
    fireEvent.click(container.querySelector(".card"));
    expect(onClick).toHaveBeenCalled();
  });

  it("calls onDragStart on drag start", () => {
    const onDragStart = vi.fn();
    const { container } = render(<JobCard {...props()} onDragStart={onDragStart} />);
    fireEvent.dragStart(container.querySelector(".card"));
    expect(onDragStart).toHaveBeenCalled();
  });

  it("calls onDragEnd on drag end", () => {
    const onDragEnd = vi.fn();
    const { container } = render(<JobCard {...props()} onDragEnd={onDragEnd} />);
    fireEvent.dragEnd(container.querySelector(".card"));
    expect(onDragEnd).toHaveBeenCalled();
  });

  it("sets opacity to 0.4 when isDragging is true", () => {
    const { container } = render(<JobCard {...props()} isDragging={true} />);
    expect(container.querySelector(".card")).toHaveStyle("opacity: 0.4");
  });
});
