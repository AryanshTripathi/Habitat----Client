/** An HTTP or network failure with a message that's safe to show the user. */
export class ApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
  }
}
