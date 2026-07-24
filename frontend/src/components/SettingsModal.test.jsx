import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SettingsModal from "./SettingsModal";
import { api } from "../api";

vi.mock("../api", () => ({
  api: {
    getSettings: vi.fn(),
    saveSettings: vi.fn(),
  },
}));

const DEFAULT_SETTINGS = {
  api_key: "sk-ant-test",
  model_resume_clean: "claude-sonnet-4-6",
  model_resume_parse: "claude-sonnet-4-6",
  model_score: "claude-sonnet-4-6",
};

describe("SettingsModal", () => {
  let onClose, flash;

  beforeEach(() => {
    onClose = vi.fn();
    flash = vi.fn();
    vi.clearAllMocks();
  });

  function renderModal() {
    return render(<SettingsModal onClose={onClose} flash={flash} />);
  }

  it("loads and populates form from api.getSettings on mount", async () => {
    api.getSettings.mockResolvedValue(DEFAULT_SETTINGS);
    renderModal();
    await waitFor(() => {
      expect(screen.getByDisplayValue("sk-ant-test")).toBeInTheDocument();
    });
  });

  it("api key field is password type by default", async () => {
    api.getSettings.mockResolvedValue(DEFAULT_SETTINGS);
    renderModal();
    await waitFor(() => screen.getByDisplayValue("sk-ant-test"));
    expect(screen.getByDisplayValue("sk-ant-test")).toHaveAttribute("type", "password");
  });

  it("Show/Hide button toggles the api key field type", async () => {
    const user = userEvent.setup();
    api.getSettings.mockResolvedValue(DEFAULT_SETTINGS);
    renderModal();
    await waitFor(() => screen.getByDisplayValue("sk-ant-test"));

    await user.click(screen.getByRole("button", { name: /show/i }));
    expect(screen.getByDisplayValue("sk-ant-test")).toHaveAttribute("type", "text");

    await user.click(screen.getByRole("button", { name: /hide/i }));
    expect(screen.getByDisplayValue("sk-ant-test")).toHaveAttribute("type", "password");
  });

  it("master model dropdown sets all three task model fields at once", async () => {
    const user = userEvent.setup();
    api.getSettings.mockResolvedValue(DEFAULT_SETTINGS);
    renderModal();
    await waitFor(() => screen.getByDisplayValue("sk-ant-test"));

    // Four selects show "Sonnet 4.6": master (index 0) + 3 task fields (indexes 1-3)
    const selects = screen.getAllByDisplayValue("Sonnet 4.6");
    await user.selectOptions(selects[0], "claude-haiku-4-5-20251001");

    // All four should now show Haiku 4.5
    expect(screen.getAllByDisplayValue("Haiku 4.5").length).toBeGreaterThanOrEqual(3);
  });

  it("changing an individual task dropdown makes master show Custom", async () => {
    const user = userEvent.setup();
    api.getSettings.mockResolvedValue(DEFAULT_SETTINGS);
    renderModal();
    await waitFor(() => screen.getByDisplayValue("sk-ant-test"));

    // selects[1] is the first task field (Resume Cleaning)
    const selects = screen.getAllByDisplayValue("Sonnet 4.6");
    await user.selectOptions(selects[1], "claude-haiku-4-5-20251001");

    expect(screen.getByDisplayValue("Custom")).toBeInTheDocument();
  });

  it("save calls api.saveSettings, flash, and onClose on success", async () => {
    const user = userEvent.setup();
    api.getSettings.mockResolvedValue(DEFAULT_SETTINGS);
    api.saveSettings.mockResolvedValue({});
    renderModal();
    await waitFor(() => screen.getByDisplayValue("sk-ant-test"));

    await user.click(screen.getByRole("button", { name: /save settings/i }));

    await waitFor(() => {
      expect(api.saveSettings).toHaveBeenCalledWith(
        expect.objectContaining({ api_key: "sk-ant-test" })
      );
      expect(flash).toHaveBeenCalledWith("Settings saved");
      expect(onClose).toHaveBeenCalled();
    });
  });

  it("calls flash on save error and keeps modal open", async () => {
    const user = userEvent.setup();
    api.getSettings.mockResolvedValue(DEFAULT_SETTINGS);
    api.saveSettings.mockRejectedValue(new Error("Save failed"));
    renderModal();
    await waitFor(() => screen.getByDisplayValue("sk-ant-test"));

    await user.click(screen.getByRole("button", { name: /save settings/i }));

    await waitFor(() => {
      expect(flash).toHaveBeenCalledWith("Save failed");
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  it("clicking the backdrop calls onClose", () => {
    api.getSettings.mockResolvedValue(DEFAULT_SETTINGS);
    const { container } = renderModal();
    fireEvent.click(container.querySelector(".modal"));
    expect(onClose).toHaveBeenCalled();
  });
});
