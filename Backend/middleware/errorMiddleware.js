export function notFound(req, res, next) {
  res.status(404)
  next(new Error(`Not Found - ${req.originalUrl}`))
}

export function errorHandler(err, req, res, next) {
  let statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500
  let message = err.message || 'Server Error'
  
  // Handle specific error types
  if (err.type === 'entity.too.large') {
    statusCode = 413
    message = 'Request entity too large. Please reduce file size or try again.'
  } else if (err.code === 'LIMIT_FILE_SIZE') {
    statusCode = 413
    message = 'File size too large. Please upload smaller files.'
  } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    statusCode = 400
    message = 'Unexpected file field.'
  }
  
  console.error('🚨 Error:', {
    message: err.message,
    type: err.type,
    code: err.code,
    statusCode,
    url: req.originalUrl,
    method: req.method
  })
  
  res.status(statusCode)
  res.json({
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  })
}


