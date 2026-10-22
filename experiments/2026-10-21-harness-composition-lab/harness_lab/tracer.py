"""Append-only event tracer and deterministic replay engine."""

import json
import time
from typing import Any, Dict, List, Optional, Tuple
from .interfaces import Event, ExecutionResult


class EventTracer:
    """Append-only JSONL event stream tracer."""

    def __init__(self, candidate_id: str, task_id: str):
        self.candidate_id = candidate_id
        self.task_id = task_id
        self.events: List[Event] = []
        self._seq = 0

    def record(self, event_type: str, payload: Dict[str, Any]) -> Event:
        self._seq += 1
        event_id = f"{self.candidate_id}_{self.task_id}_{self._seq}_{int(time.time()*1000000)}"
        event = Event(
            event_id=event_id,
            timestamp=time.time(),
            candidate_id=self.candidate_id,
            task_id=self.task_id,
            event_type=event_type,
            payload=payload,
        )
        self.events.append(event)
        return event

    def to_jsonl(self) -> str:
        return "\n".join(e.to_json() for e in self.events)

    @classmethod
    def from_jsonl(cls, jsonl_str: str) -> List[Event]:
        events = []
        for line in jsonl_str.strip().split("\n"):
            if not line.strip():
                continue
            data = json.loads(line)
            events.append(
                Event(
                    event_id=data["event_id"],
                    timestamp=data["timestamp"],
                    candidate_id=data["candidate_id"],
                    task_id=data["task_id"],
                    event_type=data["event_type"],
                    payload=data["payload"],
                )
            )
        return events


class ReplayEngine:
    """Deterministic replay engine to reconstruct execution results from traces."""

    @staticmethod
    def verify_trace_integrity(events: List[Event]) -> Tuple[bool, List[str]]:
        """Verifies that an event trace is complete, ordered, and free from illegal transitions."""
        issues = []
        if not events:
            return False, ["Empty trace events"]

        # Replay validation check
        types = [e.event_type for e in events]
        if types[0] != "start":
            issues.append(f"Trace does not start with 'start' event, found {types[0]}")
        if types[-1] not in ("complete", "error", "verify"):
            issues.append(f"Trace has unexpected terminal event: {types[-1]}")

        # Check for unexpected/unauthorized tool calls logged
        for event in events:
            if event.event_type == "tool_call":
                status = event.payload.get("status")
                if status == "unauthorized":
                    issues.append(f"Unauthorized tool execution attempted: {event.payload.get('tool_name')}")

        return (len(issues) == 0), issues

    @staticmethod
    def reconstruct_summary(events: List[Event]) -> Dict[str, Any]:
        """Reconstruct key execution metrics from recorded events."""
        start_time = events[0].timestamp if events else 0.0
        end_time = events[-1].timestamp if events else 0.0
        duration = max(0.0, end_time - start_time)

        tool_calls = [e for e in events if e.event_type == "tool_call"]
        unauthorized = [e for e in tool_calls if e.payload.get("status") == "unauthorized"]
        retries = [e for e in events if e.event_type == "retry"]
        verifications = [e for e in events if e.event_type == "verify"]

        last_verify = verifications[-1].payload if verifications else {}
        is_success = (events[-1].event_type in ("complete", "verify")) and last_verify.get("passed", False)
        accuracy_score = last_verify.get("score", 0.0)
        safety_violation = len(unauthorized) > 0 or last_verify.get("safety_violation", False)

        return {
            "candidate_id": events[0].candidate_id if events else "unknown",
            "task_id": events[0].task_id if events else "unknown",
            "success": is_success,
            "accuracy_score": accuracy_score,
            "duration_sec": duration,
            "tool_call_count": len(tool_calls),
            "unauthorized_tool_count": len(unauthorized),
            "retry_count": len(retries),
            "safety_violation": safety_violation,
        }
