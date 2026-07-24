import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, createEvent, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ProfileModal from "./ProfileModal";
import { api } from "../api";

vi.mock("../api", () => ({
  api: {
    getProfile: vi.fn(),
    saveProfile: vi.fn(),
    parseResume: vi.fn(),
  },
}));

function dropFile(dropZoneEl, file) {
  const event = createEvent.drop(dropZoneEl);
  Object.defineProperty(event, "dataTransfer", { value: { files: [file] } });
  fireEvent(dropZoneEl, event);
}

describe("ProfileModal", () => {
  let onClose, flash;

  beforeEach(() => {
    onClose = vi.fn();
    flash = vi.fn();
    vi.clearAllMocks();
  });

  function renderModal() {
    return render(<ProfileModal onClose={onClose} flash={flash} />);
  }

  it("pre-populates form fields from api.getProfile on mount", async () => {
    api.getProfile.mockResolvedValue({
      full_name: "Jane Doe",
      email: "jane@example.com",
      phone: "555-1234",
      location: "NYC",
      links: { linkedin: "https://linkedin.com/in/jane", github: "" },
      summary: "Engineer",
      base_resume: "My resume",
      skills: ["Python", "React"],
    });

    renderModal();

    await waitFor(() => {
      expect(screen.getByDisplayValue("Jane Doe")).toBeInTheDocument();
      expect(screen.getByDisplayValue("jane@example.com")).toBeInTheDocument();
      expect(screen.getByDisplayValue("Python, React")).toBeInTheDocument();
    });
  });

  it("leaves form blank when profile is null", async () => {
    api.getProfile.mockResolvedValue(null);
    renderModal();

    await waitFor(() => expect(api.getProfile).toHaveBeenCalled());

    // full_name is the first textbox
    expect(screen.getAllByRole("textbox")[0]).toHaveValue("");
  });

  it("save calls api.saveProfile with skills parsed from comma string", async () => {
    const user = userEvent.setup();
    api.getProfile.mockResolvedValue(null);
    api.saveProfile.mockResolvedValue({});
    renderModal();

    await waitFor(() => expect(api.getProfile).toHaveBeenCalled());

    const skillsInput = screen.getByPlaceholderText(/Python, React, SQL/i);
    await user.type(skillsInput, "Python, React");
    await user.click(screen.getByRole("button", { name: /save profile/i }));

    await waitFor(() => {
      expect(api.saveProfile).toHaveBeenCalledWith(
        expect.objectContaining({ skills: ["Python", "React"] })
      );
    });
  });

  it("file drop triggers api.parseResume and fills empty fields", async () => {
    api.getProfile.mockResolvedValue(null);
    api.parseResume.mockResolvedValue({
      text: "Resume text",
      fields: { full_name: "Jane Doe", email: "jane@example.com" },
    });
    renderModal();

    await waitFor(() => expect(api.getProfile).toHaveBeenCalled());

    const file = new File(["content"], "resume.pdf", { type: "application/pdf" });
    dropFile(screen.getByText(/Drop PDF, DOCX, or TXT/i), file);

    await waitFor(() => {
      expect(api.parseResume).toHaveBeenCalledWith(file);
      expect(screen.getByDisplayValue("Jane Doe")).toBeInTheDocument();
      expect(screen.getByDisplayValue("jane@example.com")).toBeInTheDocument();
    });
  });

  it("does not overwrite existing non-empty fields on parse", async () => {
    api.getProfile.mockResolvedValue({
      full_name: "Existing Name",
      email: "",
      phone: "",
      location: "",
      links: { linkedin: "", github: "" },
      summary: "",
      base_resume: "",
      skills: [],
    });
    api.parseResume.mockResolvedValue({
      text: "text",
      fields: { full_name: "Parsed Name", email: "parsed@example.com" },
    });
    renderModal();

    await waitFor(() => expect(screen.getByDisplayValue("Existing Name")).toBeInTheDocument());

    const file = new File(["content"], "resume.pdf", { type: "application/pdf" });
    dropFile(screen.getByText(/Drop PDF, DOCX, or TXT/i), file);

    await waitFor(() => {
      expect(screen.getByDisplayValue("Existing Name")).toBeInTheDocument();
      expect(screen.getByDisplayValue("parsed@example.com")).toBeInTheDocument();
    });
  });

  it("shows parse notice after successful parse", async () => {
    api.getProfile.mockResolvedValue(null);
    api.parseResume.mockResolvedValue({ text: "text", fields: {} });
    renderModal();

    await waitFor(() => expect(api.getProfile).toHaveBeenCalled());

    const file = new File(["content"], "resume.pdf", { type: "application/pdf" });
    dropFile(screen.getByText(/Drop PDF, DOCX, or TXT/i), file);

    await waitFor(() => {
      expect(screen.getByText(/Parsed — review and correct/i)).toBeInTheDocument();
    });
  });

  it("calls flash on parse error", async () => {
    api.getProfile.mockResolvedValue(null);
    api.parseResume.mockRejectedValue(new Error("Parse failed"));
    renderModal();

    await waitFor(() => expect(api.getProfile).toHaveBeenCalled());

    const file = new File(["content"], "resume.pdf", { type: "application/pdf" });
    dropFile(screen.getByText(/Drop PDF, DOCX, or TXT/i), file);

    await waitFor(() => expect(flash).toHaveBeenCalledWith("Parse failed"));
  });

  it("Clear button resets all fields to empty", async () => {
    const user = userEvent.setup();
    api.getProfile.mockResolvedValue({
      full_name: "Jane Doe",
      email: "jane@example.com",
      phone: "",
      location: "",
      links: { linkedin: "", github: "" },
      summary: "",
      base_resume: "",
      skills: [],
    });
    renderModal();

    await waitFor(() => expect(screen.getByDisplayValue("Jane Doe")).toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: /clear/i }));

    expect(screen.queryByDisplayValue("Jane Doe")).not.toBeInTheDocument();
  });

  it("calls flash on save error and keeps modal open", async () => {
    const user = userEvent.setup();
    api.getProfile.mockResolvedValue(null);
    api.saveProfile.mockRejectedValue(new Error("Save failed"));
    renderModal();

    await waitFor(() => expect(api.getProfile).toHaveBeenCalled());

    await user.click(screen.getByRole("button", { name: /save profile/i }));

    await waitFor(() => {
      expect(flash).toHaveBeenCalledWith("Save failed");
      expect(onClose).not.toHaveBeenCalled();
    });
  });
});
