class PublicError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.name = "PublicError";
    this.status = status;
  }
}

function publicError(message, status) {
  return new PublicError(message, status);
}

function safeErrorMessage(error, fallback) {
  return error instanceof PublicError ? error.message : fallback;
}

module.exports = { PublicError, publicError, safeErrorMessage };
