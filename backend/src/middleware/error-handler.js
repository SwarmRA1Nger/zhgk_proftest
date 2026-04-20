function notFound(req, res) {
  res.status(404).json({ ok: false, error: "not_found" });
}

function errorHandler(err, req, res, next) {
  // eslint-disable-next-line no-console
  console.error(err);
  res.status(500).json({ ok: false, error: "internal_error" });
}

module.exports = { notFound, errorHandler };
