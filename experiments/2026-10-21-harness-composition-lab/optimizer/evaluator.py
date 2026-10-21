"""Single candidate evaluator execution engine."""

import time
from typing import List, Tuple
from harness_lab.interfaces import (
    CandidateConfig,
    ExecutionResult,
    TaskInput,
    TaskOutput,
    ToolCall,
)
from harness_lab.dispatchers import DirectDispatcher, ClassificationDispatcher, ScoredDispatcher
from harness_lab.memory import NoneMemoryManager, SummaryMemoryManager, BoundedRetrievalMemoryManager
from harness_lab.verifiers import SchemaVerifier, DualCheckVerifier, TracePolicyVerifier
from harness_lab.permissions import FailClosedPermissionPolicy
from harness_lab.tracer import EventTracer, ReplayEngine


class TaskExecutor:
    """Executes a single benchmark task under a specified CandidateConfig."""

    @staticmethod
    def execute_task(task: TaskInput, config: CandidateConfig) -> ExecutionResult:
        tracer = EventTracer(candidate_id=config.candidate_id, task_id=task.task_id)
        tracer.record("start", {"config": config.to_dict(), "input_hash": task.input_hash})
        t0 = time.time()

        # Instantiate Memory Manager
        if config.memory_mode == "none":
            mem_mgr = NoneMemoryManager()
        elif config.memory_mode == "summary":
            mem_mgr = SummaryMemoryManager()
        elif config.memory_mode == "bounded-retrieval":
            mem_mgr = BoundedRetrievalMemoryManager()
        else:
            mem_mgr = NoneMemoryManager()

        memory_context = mem_mgr.prepare_context(task)
        tracer.record("memory_inject", {"memory_mode": config.memory_mode, "context_snippet": memory_context[:100]})

        # Instantiate Dispatcher
        if config.dispatcher == "direct":
            dispatcher = DirectDispatcher()
        elif config.dispatcher == "classification":
            dispatcher = ClassificationDispatcher()
        elif config.dispatcher == "scored":
            dispatcher = ScoredDispatcher()
        else:
            dispatcher = DirectDispatcher()

        # Instantiate Verifier
        if config.verifier == "schema":
            verifier = SchemaVerifier()
        elif config.verifier == "dual-check":
            verifier = DualCheckVerifier()
        elif config.verifier == "trace-policy":
            verifier = TracePolicyVerifier()
        else:
            verifier = SchemaVerifier()

        permission_policy = FailClosedPermissionPolicy()
        rejection_reasons = []
        unauthorized_count = 0
        retry_count = 0

        # Execute dispatch loop with optional retries
        max_attempts = 1 + config.bounded_retries
        final_output = None

        for attempt in range(max_attempts):
            if attempt > 0:
                retry_count += 1
                tracer.record("retry", {"attempt": attempt})

            tracer.record("dispatch", {"dispatcher": config.dispatcher, "attempt": attempt})
            output, requested_tool_calls = dispatcher.dispatch(task, memory_context, config)

            # Process tool calls through permission policy & mock execution
            for call in requested_tool_calls:
                is_allowed = permission_policy.check_call(call)
                if not is_allowed:
                    unauthorized_count += 1
                    tracer.record("tool_call", {
                        "tool_name": call.tool_name,
                        "arguments": call.arguments,
                        "status": "unauthorized",
                    })
                    rejection_reasons.append(f"Permission denied for tool '{call.tool_name}'")
                else:
                    tracer.record("tool_call", {
                        "tool_name": call.tool_name,
                        "arguments": call.arguments,
                        "status": "permitted",
                    })
                    # Mock tool execution behavior for failing_tool scenario
                    if task.category == "failing_tool" and attempt == 0:
                        tracer.record("tool_result", {"tool_name": call.tool_name, "success": False, "error": "mock_transient_failure"})
                    else:
                        tracer.record("tool_result", {"tool_name": call.tool_name, "success": True, "result": "ok"})

            final_output = output
            if task.category == "failing_tool" and attempt == 0 and config.bounded_retries > 0:
                # Retry triggered by transient tool error
                continue
            break

        # Verification step
        verify_result = verifier.verify(task, final_output, tracer.events)
        tracer.record("verify", {
            "passed": verify_result.passed,
            "score": verify_result.score,
            "reasons": verify_result.reasons,
            "safety_violation": verify_result.safety_violation,
        })

        passed_initial = verify_result.passed and not verify_result.safety_violation and (unauthorized_count == 0)
        if passed_initial:
            tracer.record("complete", {"status": "success"})
        else:
            tracer.record("error", {"status": "failed", "reasons": verify_result.reasons + rejection_reasons})

        # Replay integrity check
        integrity_ok, integrity_issues = ReplayEngine.verify_trace_integrity(tracer.events)
        if not integrity_ok:
            rejection_reasons.extend(integrity_issues)

        t1 = time.time()
        duration = max(0.0001, t1 - t0)

        success = passed_initial and integrity_ok
        safety_violation = verify_result.safety_violation or (unauthorized_count > 0)

        return ExecutionResult(
            candidate_id=config.candidate_id,
            task_id=task.task_id,
            success=success,
            accuracy_score=verify_result.score if not safety_violation else 0.0,
            duration_sec=duration,
            tool_call_count=len(tracer.events),
            retry_count=retry_count,
            safety_violation=safety_violation,
            unauthorized_tool_count=unauthorized_count,
            rejection_reasons=list(set(verify_result.reasons + rejection_reasons)),
            token_estimate=len(task.prompt) + len(memory_context) + len(final_output.content if final_output else ""),
            cost_estimate_usd=0.0,
            trace_events=tracer.events,
        )
