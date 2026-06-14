import winston from 'winston';

// Define log levels and formats
export const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.errors({ stack: true }), // Include stack trace in logs
        winston.format.timestamp(),
        winston.format.json() // Outputs logs as clean, parsable JSON objects
    ),
    transports: [
        // Write all errors to a dedicated error log file
        new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
        // Write all system traffic logs to a combined log file
        new winston.transports.File({ filename: 'logs/combined.log' }),
    ],
    // Catch uncaught exceptions and write them to a specific file
    exceptionHandlers: [
        new winston.transports.File({ filename: 'logs/exceptions.log' })
    ],
    // Catch unhandled promise rejections and write them to a specific file
    rejectionHandlers: [
        new winston.transports.File({ filename: 'logs/rejections.log' })
    ]
});

// If we are developing locally, also print clean colored logs to the terminal
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
        ),
        handleExceptions: true,
        handleRejections: true,
    }));
}