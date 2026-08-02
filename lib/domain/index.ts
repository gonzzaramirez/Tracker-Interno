/**
 * Domain barrel — re-exports every pure type of the tracker.
 *
 * `lib/domain/*` has zero dependencies by design (REQ-CC-001):
 * importing types from here is always safe, server or client.
 */

export * from "./member"
export * from "./task"
export * from "./progress"
export * from "./feedback"
export * from "./snippet"
export * from "./timeoff"