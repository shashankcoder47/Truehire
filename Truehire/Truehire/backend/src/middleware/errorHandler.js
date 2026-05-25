import multer from 'multer';

export const errorHandler = (error, _req, res, _next) => {
  if (error instanceof multer.MulterError) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }

  const statusCode = error.statusCode ?? 500;

  if (process.env.NODE_ENV !== 'test') {
    console.error(error);
  }

  res.status(statusCode).json({
    success: false,
    message: error.message ?? 'Internal server error',
    ...(error.details ? { details: error.details } : {}),
    ...(process.env.NODE_ENV === 'development' ? { stack: error.stack } : {}),
  });
};
