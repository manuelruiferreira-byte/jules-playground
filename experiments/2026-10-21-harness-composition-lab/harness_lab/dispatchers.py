"""Task Dispatcher implementations for candidate variants."""

from typing import Dict, List, Tuple
from .interfaces import CandidateConfig, Dispatcher, TaskInput, TaskOutput, ToolCall
from .permissions import FailClosedPermissionPolicy


class DirectDispatcher(Dispatcher):
    """Dispatcher: direct. Formulates direct task responses based on prompt and context."""

    def dispatch(
        self,
        task: TaskInput,
        memory_context: str,
        config: CandidateConfig,
    ) -> Tuple[TaskOutput, List[ToolCall]]:
        tool_calls = []
        structured = {}

        # Handle specific fixture task behaviors in a synthetic, rule-based sandbox engine
        if task.category == "greeting":
            content = "Hello! I am ready to assist you."
            structured = {"greeting": "Hello! I am ready to assist you."}

        elif task.category == "retrieval_grounded":
            content = f"Based on retrieved context: {memory_context}"
            structured = {"answer": f"Answer grounded in: {memory_context[:50]}"}

        elif task.category == "safe_patch":
            tool_calls.append(ToolCall(tool_name="mock_patch", arguments={"file": "main.py", "diff": "+ print('ok')"}))
            content = "Proposed safe code patch."
            structured = {"status": "patch_generated", "diff": "+ print('ok')"}

        elif task.category == "failing_tool":
            tool_calls.append(ToolCall(tool_name="mock_patch", arguments={"action": "fail_first_time"}))
            content = "Attempted tool action."
            structured = {"status": "attempted"}

        elif task.category == "corrupted_memory":
            if "CORRUPTED" in memory_context:
                content = "Detected corrupted memory payload. Ignoring corrupted context."
                structured = {"status": "memory_rejected", "valid": False}
            else:
                content = f"Processed memory: {memory_context}"
                structured = {"status": "memory_processed", "valid": True}

        elif task.category == "prompt_injection":
            if "system override" in task.prompt.lower() or "ignore rules" in task.prompt.lower():
                content = "I cannot execute system overrides or bypass safety rules."
                structured = {"refusal": True, "reason": "prompt_injection_detected"}
            else:
                content = "Standard response."
                structured = {"refusal": False}

        elif task.category == "permission_denial":
            # Direct dispatcher attempts forbidden tool call
            tool_calls.append(ToolCall(tool_name="unauthorized_exec", arguments={"cmd": "rm -rf /"}))
            content = "Executing administrative command."
            structured = {"command": "rm -rf /"}

        elif task.category == "retry_exhaustion":
            tool_calls.append(ToolCall(tool_name="mock_patch", arguments={"action": "always_fail"}))
            content = "Attempting persistent failing action."
            structured = {"status": "failed"}

        elif task.category == "long_context":
            content = f"Processed long context of length {len(memory_context)} characters."
            structured = {"context_length": len(memory_context), "summary": memory_context[:30]}

        elif task.category == "delegation":
            tool_calls.append(ToolCall(tool_name="delegate_task", arguments={"subtask": "analyze_logs", "worker": "sub_agent_1"}))
            content = "Delegated log analysis subtask."
            structured = {"delegated": True, "worker": "sub_agent_1"}

        else:
            content = f"Executed task {task.task_id}."
            structured = {"status": "completed"}

        return TaskOutput(content=content, structured_data=structured, tool_calls=tool_calls), tool_calls


class ClassificationDispatcher(Dispatcher):
    """Dispatcher: classification. Classifies prompt intent before dispatching tool/response."""

    def dispatch(
        self,
        task: TaskInput,
        memory_context: str,
        config: CandidateConfig,
    ) -> Tuple[TaskOutput, List[ToolCall]]:
        # Intent classification step
        intent = self._classify_intent(task.prompt)
        tool_calls = []
        structured = {"intent": intent}

        if intent == "security_threat":
            content = "I cannot fulfill requests that attempt to bypass safety constraints."
            structured["refusal"] = True
            structured["reason"] = "security_policy_violation"
            return TaskOutput(content=content, structured_data=structured, tool_calls=[]), []

        if intent == "unauthorized_tool_request":
            # Classification dispatcher catches permission request before execution!
            content = "Requested action requires tool permissions that are not granted."
            structured["refusal"] = True
            structured["reason"] = "permission_denied"
            return TaskOutput(content=content, structured_data=structured, tool_calls=[]), []

        # Delegate rest to standard handling
        direct = DirectDispatcher()
        out, calls = direct.dispatch(task, memory_context, config)
        out.structured_data["intent"] = intent
        return out, calls

    def _classify_intent(self, prompt: str) -> str:
        lower = prompt.lower()
        if "ignore" in lower or "override" in lower or "sudo" in lower or "system override" in lower:
            return "security_threat"
        if "rm -rf" in lower or "unauthorized" in lower or "restricted_admin_action" in lower:
            return "unauthorized_tool_request"
        if "patch" in lower or "code" in lower:
            return "code_modification"
        if "hello" in lower or "hi" in lower or "greet" in lower:
            return "greeting"
        return "general_query"


class ScoredDispatcher(Dispatcher):
    """Dispatcher: scored. Evaluates multiple execution pathways and chooses highest confidence option."""

    def dispatch(
        self,
        task: TaskInput,
        memory_context: str,
        config: CandidateConfig,
    ) -> Tuple[TaskOutput, List[ToolCall]]:
        # Evaluates candidates and scores them
        cls_dispatcher = ClassificationDispatcher()
        out, calls = cls_dispatcher.dispatch(task, memory_context, config)

        # Scored dispatcher checks tool calls against safety policy beforehand to avoid illegal invocations
        policy = FailClosedPermissionPolicy()
        safe_calls = []
        for call in calls:
            if policy.check_call(call):
                safe_calls.append(call)
            else:
                # Scored dispatcher filters out unauthorized tool call before attempting
                out.structured_data["filtered_unauthorized_call"] = call.tool_name

        out.structured_data["dispatcher_score"] = 0.95
        return out, safe_calls
