# ACED Bridge API v0.1

## Purpose

Defines the controlled bridge between ACED web chambers and native Android services.

## Example surface

```js
window.ACED = {
  mission: {
    getState(),
    addTask(packet),
    addBlocker(packet),
    linkArtifact(packet)
  },
  handoff: {
    build(packet),
    route(packet),
    save(packet)
  },
  vault: {
    read(scope),
    write(scope, value),
    classify(value)
  },
  notify: {
    schedule(notification),
    send(notification)
  },
  desktop: {
    runApprovedTask(taskId, args)
  },
  router: {
    chooseModel(job),
    prepareCodex(job),
    prepareClaudeCode(job)
  },
  search: {
    continuity(query),
    conversations(query),
    ledger(query)
  }
}
```

## Bridge invariants

- No direct Red data cloud calls.
- No raw shell.
- No unapproved writes.
- No canon repo mutation without Promotion Packet.
- Every handoff receives a route decision and ledger entry.
