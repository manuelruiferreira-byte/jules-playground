"""Fail-closed tool permission policy."""

from typing import Iterable, Optional, Set
from .interfaces import ToolCall


class FailClosedPermissionPolicy:
    """Fail-closed tool permission policy with explicit permitlist.

    Any tool call not explicitly on the permitlist is rejected.
    """

    DEFAULT_PERMITLIST = {
        "safe_read",
        "safe_calculate",
        "safe_search",
        "mock_patch",
        "delegate_task",
    }

    def __init__(self, permitlist: Optional[Iterable[str]] = None):
        if permitlist is None:
            self._permitlist: Set[str] = set(self.DEFAULT_PERMITLIST)
        else:
            self._permitlist: Set[str] = set(permitlist)

    def is_allowed(self, tool_name: str) -> bool:
        """Return True if tool_name is permitted, False otherwise (fail closed)."""
        return tool_name in self._permitlist

    def check_call(self, tool_call: ToolCall) -> bool:
        """Check if a ToolCall instance is permitted."""
        return self.is_allowed(tool_call.tool_name)
