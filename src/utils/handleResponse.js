export function handleResult(res, result, statusCode = 200) {
  if (result.success === false) {
    return res.status(400).json(result);
  }
  return res.status(statusCode).json(result);
}

export function handleError(res, error, statusCode = 500) {
  console.error('Error:', error.message);
  return res.status(statusCode).json({
    success: false,
    error: error.message || 'Terjadi kesalahan pada server',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
}