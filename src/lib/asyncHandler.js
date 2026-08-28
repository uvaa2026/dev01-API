// Express 4 does not automatically catch rejected promises thrown inside
// async route handlers — an unhandled DB error would otherwise leave the
// request hanging with no response instead of hitting the error middleware.
// Wrap every async handler with this so failures always reach `next(err)`.
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}
