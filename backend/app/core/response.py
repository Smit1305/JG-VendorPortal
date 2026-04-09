from typing import Any
from pydantic import BaseModel


class APIResponse(BaseModel):
    success: bool
    message: str
    data: Any = None


def success(message: str = "OK", data: Any = None) -> APIResponse:
    return APIResponse(success=True, message=message, data=data)


def error(message: str, data: Any = None) -> APIResponse:
    return APIResponse(success=False, message=message, data=data)
