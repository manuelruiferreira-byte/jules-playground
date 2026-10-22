"""Typed interfaces and data models for the Harness Lab."""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
import hashlib
import json
import time
from typing import Any, Dict, List, Optional, Tuple, Union


@dataclass(frozen=True)
class CandidateConfig:
    """Deterministic configuration variant specification."""
    candidate_id: str
    dispatcher: str  # 'direct', 'classification', 'scored'
    memory_mode: str  # 'none', 'summary', 'bounded-retrieval'
    verifier: str  # 'schema', 'dual-check', 'trace-policy'
    bounded_retries: int  # 0 or 1

    def to_dict(self) -> Dict[str, Any]:
        return {
            "candidate_id": self.candidate_id,
            "dispatcher": self.dispatcher,
            "memory_mode": self.memory_mode,
            "verifier": self.verifier,
            "bounded_retries": self.bounded_retries,
        }

    @property
    def config_hash(self) -> str:
        s = f"{self.dispatcher}:{self.memory_mode}:{self.verifier}:{self.bounded_retries}"
        return hashlib.sha256(s.encode("utf-8")).hexdigest()[:12]


@dataclass
class TaskInput:
    """Input specification for a benchmark task fixture."""
    task_id: str
    category: str
    prompt: str
    expected_output: Dict[str, Any]
    context: Optional[Dict[str, Any]] = None
    tools_available: List[str] = field(default_factory=list)

    @property
    def input_hash(self) -> str:
        s = f"{self.task_id}:{self.category}:{self.prompt}"
        return hashlib.sha256(s.encode("utf-8")).hexdigest()[:12]


@dataclass
class ToolCall:
    """Tool invocation request."""
    tool_name: str
    arguments: Dict[str, Any]


@dataclass
class ToolResult:
    """Outcome of a tool invocation."""
    tool_name: str
    success: bool
    result: Any
    error: Optional[str] = None


@dataclass
class TaskOutput:
    """Agent response structure."""
    content: str
    structured_data: Dict[str, Any] = field(default_factory=dict)
    tool_calls: List[ToolCall] = field(default_factory=list)


@dataclass
class VerificationResult:
    """Result of verifying a task execution."""
    passed: bool
    score: float
    reasons: List[str] = field(default_factory=list)
    safety_violation: bool = False


@dataclass
class Event:
    """Append-only trace event record."""
    event_id: str
    timestamp: float
    candidate_id: str
    task_id: str
    event_type: str  # 'start', 'memory_inject', 'dispatch', 'tool_call', 'tool_result', 'verify', 'retry', 'complete', 'error'
    payload: Dict[str, Any]

    def to_dict(self) -> Dict[str, Any]:
        return {
            "event_id": self.event_id,
            "timestamp": self.timestamp,
            "candidate_id": self.candidate_id,
            "task_id": self.task_id,
            "event_type": self.event_type,
            "payload": self.payload,
        }

    def to_json(self) -> str:
        return json.dumps(self.to_dict(), sort_keys=True)


@dataclass
class ExecutionResult:
    """Summary of a single task execution under a candidate config."""
    candidate_id: str
    task_id: str
    success: bool
    accuracy_score: float
    duration_sec: float
    tool_call_count: int
    retry_count: int
    safety_violation: bool
    unauthorized_tool_count: int
    rejection_reasons: List[str] = field(default_factory=list)
    token_estimate: int = 0
    cost_estimate_usd: float = 0.0
    trace_events: List[Event] = field(default_factory=list)


class Dispatcher(ABC):
    """Abstract interface for task dispatching strategy."""

    @abstractmethod
    def dispatch(
        self,
        task: TaskInput,
        memory_context: str,
        config: CandidateConfig,
    ) -> Tuple[TaskOutput, List[ToolCall]]:
        pass


class MemoryManager(ABC):
    """Abstract interface for memory context processing."""

    @abstractmethod
    def prepare_context(self, task: TaskInput) -> str:
        pass


class Verifier(ABC):
    """Abstract interface for output & trace verification."""

    @abstractmethod
    def verify(
        self,
        task: TaskInput,
        output: TaskOutput,
        events: List[Event],
    ) -> VerificationResult:
        pass
