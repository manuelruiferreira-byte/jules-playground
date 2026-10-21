"""Harness Lab Plugin Architecture & Execution Engine."""

from .interfaces import (
    CandidateConfig,
    Event,
    ExecutionResult,
    TaskInput,
    TaskOutput,
    ToolCall,
    ToolResult,
    VerificationResult,
)
from .dispatchers import DirectDispatcher, ClassificationDispatcher, ScoredDispatcher, Dispatcher
from .memory import NoneMemoryManager, SummaryMemoryManager, BoundedRetrievalMemoryManager, MemoryManager
from .verifiers import SchemaVerifier, DualCheckVerifier, TracePolicyVerifier, Verifier
from .permissions import FailClosedPermissionPolicy
from .tracer import EventTracer, ReplayEngine

__all__ = [
    "CandidateConfig",
    "Event",
    "ExecutionResult",
    "TaskInput",
    "TaskOutput",
    "ToolCall",
    "ToolResult",
    "VerificationResult",
    "Dispatcher",
    "DirectDispatcher",
    "ClassificationDispatcher",
    "ScoredDispatcher",
    "MemoryManager",
    "NoneMemoryManager",
    "SummaryMemoryManager",
    "BoundedRetrievalMemoryManager",
    "Verifier",
    "SchemaVerifier",
    "DualCheckVerifier",
    "TracePolicyVerifier",
    "FailClosedPermissionPolicy",
    "EventTracer",
    "ReplayEngine",
]
