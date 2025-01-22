class AgentConflictError(Exception):
    """Raised when an agent with the same name and type already exists."""
    def __init__(self, message: str):
        super().__init__(message)
