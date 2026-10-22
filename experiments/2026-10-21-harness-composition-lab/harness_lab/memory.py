"""Memory management implementations for candidate variants."""

import json
from typing import Any, Dict, Optional
from .interfaces import MemoryManager, TaskInput


class NoneMemoryManager(MemoryManager):
    """Memory mode: none. Does not append extra memory context."""

    def prepare_context(self, task: TaskInput) -> str:
        return ""


class SummaryMemoryManager(MemoryManager):
    """Memory mode: summary. Synthesizes a compact summary of available context."""

    def prepare_context(self, task: TaskInput) -> str:
        if not task.context:
            return "[Memory Summary: No external context provided]"

        # Compact summary of context keys
        summary_items = []
        for k, v in task.context.items():
            val_str = str(v)
            if len(val_str) > 100:
                val_str = val_str[:97] + "..."
            summary_items.append(f"{k}: {val_str}")
        return f"[Memory Summary: {'; '.join(summary_items)}]"


class BoundedRetrievalMemoryManager(MemoryManager):
    """Memory mode: bounded-retrieval. Grounded mock retrieval over task context sections."""

    def prepare_context(self, task: TaskInput) -> str:
        if not task.context:
            return "[Retrieved Context: Empty]"

        # Simulate bounded keyword retrieval from task.context dict
        prompt_words = set(task.prompt.lower().split())
        relevant_chunks = []

        for key, val in task.context.items():
            key_lower = str(key).lower()
            val_str = str(val)
            # Match keywords or include if category is retrieval-grounded
            if any(w in key_lower or w in val_str.lower() for w in prompt_words) or task.category == "retrieval_grounded":
                relevant_chunks.append(f"<{key}>: {val_str}")

        if not relevant_chunks:
            # Fallback to top key
            first_key = next(iter(task.context))
            relevant_chunks.append(f"<{first_key}>: {task.context[first_key]}")

        # Limit to top 2 chunks (bounded retrieval cap)
        bounded_chunks = relevant_chunks[:2]
        return f"[Retrieved Context Chunks (max 2)]\n" + "\n".join(bounded_chunks)
