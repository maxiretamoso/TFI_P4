function crearError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

export { crearError };
