import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import JobDrawer from "./JobDrawer";
import { api } from "../api";

vi.mock("../api", () => ({
  api: {
    updateJob: vi.fn(),
    deleteJob: vi.fn(),
    scoreJob: vi.fn(),
  },
}));

const baseJob = {
  id: 1,
  company: "Acme",
  title: "Engineer",
  link: "https://acme.com",
  location: "Remote",
  salary: "$120k",
  priority: "medium",
  status: "sourced",
  deadline: null,
  notes: null,
  jd_text: null,
  fit_score: null,
  fit_notes: null,
};

describe("JobDrawer", () => {
  let onUpdated, onDeleted, onClose, flash;

  beforeEach(() => {
    onUpdated = vi.fn();
    onDeleted = vi.fn();
    onClose = vi.fn();
    flash = vi.fn();
    vi.clearAllMocks();
  });

  function renderDrawer(job = baseJob) {
    return render(
      <JobDrawer job={job} onUpdated={onUpdated} onDeleted={onDeleted} onClose={onClose} flash={flash} />
    );
  }

  it("renders company and title from the job prop", () => {
    renderDrawer();
    expect(screen.getByText("Acme")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Acme")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Engineer")).toBeInTheDocument();
  });

  it("Save button is disabled when no fields are changed", () => {
    renderDrawer();
    expect(screen.getByRole("button", { name: /save changes/i })).toBeDisabled();
  });

  it("Save button is enabled after editing a field", async () => {
    const user = userEvent.setup();
    renderDrawer();

    const companyInput = screen.getByDisplayValue("Acme");
    await user.clear(companyInput);
    await user.type(companyInput, "NewCo");

    expect(screen.getByRole("button", { name: /save changes/i })).toBeEnabled();
  });

  it("save calls api.updateJob with only dirty fields", async () => {
    const user = userEvent.setup();
    api.updateJob.mockResolvedValue({ ...baseJob, company: "NewCo" });
    renderDrawer();

    const companyInput = screen.getByDisplayValue("Acme");
    await user.clear(companyInput);
    await user.type(companyInput, "NewCo");
    await user.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => {
      expect(api.updateJob).toHaveBeenCalledWith(1, { company: "NewCo" });
      expect(onUpdated).toHaveBeenCalled();
      expect(flash).toHaveBeenCalledWith("Saved");
    });
  });

  it("Score button is disabled when jd_text is empty", () => {
    renderDrawer();
    expect(screen.getByRole("button", { name: /^score$/i })).toBeDisabled();
  });

  it("Score button is enabled when jd_text is present", () => {
    renderDrawer({ ...baseJob, jd_text: "Some description" });
    expect(screen.getByRole("button", { name: /^score$/i })).toBeEnabled();
  });

  it("score flow saves dirty fields first then calls scoreJob", async () => {
    const user = userEvent.setup();
    api.updateJob.mockResolvedValue({ ...baseJob, jd_text: "JD", company: "NewCo" });
    api.scoreJob.mockResolvedValue({ ...baseJob, fit_score: 80 });
    renderDrawer({ ...baseJob, jd_text: "JD" });

    const companyInput = screen.getByDisplayValue("Acme");
    await user.clear(companyInput);
    await user.type(companyInput, "NewCo");
    await user.click(screen.getByRole("button", { name: /^score$/i }));

    await waitFor(() => {
      expect(api.updateJob).toHaveBeenCalledWith(1, { company: "NewCo" });
      expect(api.scoreJob).toHaveBeenCalledWith(1);
      expect(onUpdated).toHaveBeenCalledWith({ ...baseJob, fit_score: 80 });
      expect(flash).toHaveBeenCalledWith("Scored");
    });
  });

  it("clicking Delete shows the confirm step", async () => {
    const user = userEvent.setup();
    renderDrawer();

    await user.click(screen.getByRole("button", { name: /^delete$/i }));

    expect(screen.getByRole("button", { name: /confirm delete/i })).toBeInTheDocument();
  });

  it("confirming delete calls api.deleteJob and onDeleted", async () => {
    const user = userEvent.setup();
    api.deleteJob.mockResolvedValue(null);
    renderDrawer();

    await user.click(screen.getByRole("button", { name: /^delete$/i }));
    await user.click(screen.getByRole("button", { name: /confirm delete/i }));

    await waitFor(() => {
      expect(api.deleteJob).toHaveBeenCalledWith(1);
      expect(onDeleted).toHaveBeenCalledWith(1);
    });
  });

  it("cancelling the delete confirm returns to idle", async () => {
    const user = userEvent.setup();
    renderDrawer();

    await user.click(screen.getByRole("button", { name: /^delete$/i }));
    await user.click(screen.getByRole("button", { name: /^cancel$/i }));

    expect(screen.queryByRole("button", { name: /confirm delete/i })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^delete$/i })).toBeInTheDocument();
  });

  it("switching to a different job resets the form entirely", async () => {
    const user = userEvent.setup();
    const job2 = { ...baseJob, id: 2, company: "Beta Corp", title: "Designer" };
    const { rerender } = renderDrawer();

    const companyInput = screen.getByDisplayValue("Acme");
    await user.clear(companyInput);
    await user.type(companyInput, "Edited");

    rerender(
      <JobDrawer job={job2} onUpdated={onUpdated} onDeleted={onDeleted} onClose={onClose} flash={flash} />
    );

    expect(screen.getByDisplayValue("Beta Corp")).toBeInTheDocument();
    expect(screen.queryByDisplayValue("Edited")).not.toBeInTheDocument();
  });

  it("external update to same job merges server changes into unedited fields only", async () => {
    const user = userEvent.setup();
    const { rerender } = renderDrawer();

    // User edits company
    const companyInput = screen.getByDisplayValue("Acme");
    await user.clear(companyInput);
    await user.type(companyInput, "My Edit");

    // Server updates title (same job id)
    rerender(
      <JobDrawer
        job={{ ...baseJob, title: "Updated By Server" }}
        onUpdated={onUpdated}
        onDeleted={onDeleted}
        onClose={onClose}
        flash={flash}
      />
    );

    // User's edit preserved
    expect(screen.getByDisplayValue("My Edit")).toBeInTheDocument();
    // Server's title update adopted
    expect(screen.getByDisplayValue("Updated By Server")).toBeInTheDocument();
  });
});
