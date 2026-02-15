import { render, type RenderOptions } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

/**
 * Custom render that sets up user-event alongside React Testing Library.
 * Wraps the component with any necessary providers.
 */
function customRender(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, "wrapper">
) {
  return {
    user: userEvent.setup(),
    ...render(ui, { ...options }),
  };
}

export * from "@testing-library/react";
export { customRender as render, userEvent };
