from common.logger import get_logger
from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from config.config import settings
from fastapi.staticfiles import StaticFiles
from middleware.logging import LoggingMiddleware, setup_logging
from routers import issues


# Set up logging configuration
setup_logging()
logging = get_logger(__name__)

# Initialize FastAPI app
app = FastAPI(
    swagger_ui_oauth2_redirect_url="/oauth2-redirect",
    swagger_ui_init_oauth={
        "usePkceWithAuthorizationCodeGrant": True,
        "clientId": settings.aad_client_id,
    },
)

# Add middlewares
app.add_middleware(LoggingMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(issues.router)


# Health check endpoint
@app.get(
    "/api/health",
    summary="Health Check",
    response_description="Health status of the API",
)
def health_check():
    logging.info("Health check endpoint called.")
    return Response(status_code=204)


# Mount the UI at the root path (should come last so it doesn't interfere with /api routes)
if settings.serve_static:
    app.mount("/", StaticFiles(directory="www", html=True))


# Exception handler only for HTTPExceptions
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    logging.error(f"HTTPException occurred: {exc.detail}")
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": "HTTPException", "message": exc.detail},
    )


# Exception handler for general exceptions
@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    logging.error(f"Unexpected error occurred: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "error": "500 Internal Server Error",
            "message": str(exc),
        },
    )
