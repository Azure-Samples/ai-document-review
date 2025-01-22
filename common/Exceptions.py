class ConflictError(Exception):
    """Raised when an agent with the same name and type already exists."""
    def __init__(self, message: str):
        super().__init__(message)

class ResourceNotFoundError(Exception):
    """Raised when a resource is not found."""
    def __init__(self, message: str):
        super().__init__(message)
