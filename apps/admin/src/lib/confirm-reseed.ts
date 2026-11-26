/** Shared confirm for destructive “reset to seed” actions across admin. */
export function confirmReseed(subject: string): boolean {
  return window.confirm(
    `Are you sure you want to reset ${subject} to the seed data?\n\nChoose OK for yes, or Cancel for no.`,
  );
}
