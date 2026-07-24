import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AddJobModal from "./AddJobModal";
import { api } from "../api";

vi.mock("../api", () => ({
  api: {
    createJob: vi.fn(),
  },
}));

describe("AddJobModal", () => {
  let onCreated, onClose, flash;

  beforeEach(() => {
    onCreated = vi.fn();
    onClose = vi.fn();
    flash = vi.fn();
    vi.clearAllMocks();
  });

  function renderModal() {
    return render(<AddJobModal onCreated={onCreated} onClose={onClose} flash={flash} />);
  }

  it("renders the modal heading and all form fields", () => {
    renderModal();
    expect(screen.getByRole("heading", { name: "Add job" })).toBeInTheDocument();
    expect(screen.getByPlaceholderText("https://…")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Remote, NYC…")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("$120k–$150k")).toBeInTheDocument();
    expect(screen.getByRole("combobox")).toBeInTheDocument(); // priority select
  });

  it("calls api.createJob with normalized salary on submit", async () => {
    const user = userEvent.setup();
    api.createJob.mockResolvedValue({ id: 1, company: "Acme", title: "Engineer" });
    renderModal();

    const inputs = screen.getAllByRole("textbox");
    await user.type(inputs[0], "Acme");   // company
    await user.type(inputs[1], "Engineer"); // title
    await user.type(screen.getByPlaceholderText("$120k–$150k"), "120000");
    await user.click(screen.getByRole("button", { name: /add job/i }));

    await waitFor(() => {
      expect(api.createJob).toHaveBeenCalledWith(
        expect.objectContaining({ company: "Acme", title: "Engineer", salary: "$120k" })
      );
    });
  });

  it("calls onCreated, flash('Job added'), and onClose on success", async () => {
    const user = userEvent.setup();
    const job = { id: 1, company: "Acme", title: "Engineer" };
    api.createJob.mockResolvedValue(job);
    renderModal();

    const inputs = screen.getAllByRole("textbox");
    await user.type(inputs[0], "Acme");
    await user.type(inputs[1], "Engineer");
    await user.click(screen.getByRole("button", { name: /add job/i }));

    await waitFor(() => {
      expect(onCreated).toHaveBeenCalledWith(job);
      expect(flash).toHaveBeenCalledWith("Job added");
      expect(onClose).toHaveBeenCalled();
    });
  });

  it("calls flash with error message and keeps modal open on API failure", async () => {
    const user = userEvent.setup();
    api.createJob.mockRejectedValue(new Error("Server error"));
    renderModal();

    const inputs = screen.getAllByRole("textbox");
    await user.type(inputs[0], "Acme");
    await user.type(inputs[1], "Engineer");
    await user.click(screen.getByRole("button", { name: /add job/i }));

    await waitFor(() => {
      expect(flash).toHaveBeenCalledWith("Server error");
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  it("normalizes salary on blur", async () => {
    const user = userEvent.setup();
    renderModal();

    const salaryInput = screen.getByPlaceholderText("$120k–$150k");
    await user.type(salaryInput, "120000");
    await user.tab();

    expect(salaryInput).toHaveValue("$120k");
  });

  it("calls onClose when backdrop is clicked", () => {
    const { container } = renderModal();
    fireEvent.click(container.querySelector(".modal"));
    expect(onClose).toHaveBeenCalled();
  });
});
