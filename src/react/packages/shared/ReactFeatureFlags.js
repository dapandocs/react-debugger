/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 *       strict
 */

// -----------------------------------------------------------------------------
// Land or remove (zero effort)
//
// Flags that can likely be deleted or landed without consequences
// -----------------------------------------------------------------------------

export const enableComponentStackLocations = true;

// -----------------------------------------------------------------------------
// Killswitch
//
// Flags that exist solely to turn off a change in case it causes a regression
// when it rolls out to prod. We should remove these as soon as possible.
// -----------------------------------------------------------------------------

// -----------------------------------------------------------------------------
// Land or remove (moderate effort)
//
// Flags that can be probably deleted or landed, but might require extra effort
// like migrating internal callers or performance testing.
// -----------------------------------------------------------------------------

// TODO: Finish rolling out in www
export const enableClientRenderFallbackOnTextMismatch = true;

// Not sure if www still uses this. We don't have a replacement but whatever we
// replace it with will likely be different than what's already there, so we
// probably should just delete it as long as nothing in www relies on it.
export const enableSchedulerDebugging = false;

// Need to remove didTimeout argument from Scheduler before landing
export const disableSchedulerTimeoutInWorkLoop = false;

// This will break some internal tests at Meta so we need to gate this until
// those can be fixed.
export const enableDeferRootSchedulingToMicrotask = true;

// -----------------------------------------------------------------------------
// Slated for removal in the future (significant effort)
//
// These are experiments that didn't work out, and never shipped, but we can't
// delete from the codebase until we migrate internal callers.
// -----------------------------------------------------------------------------

// Add a callback property to suspense to notify which promises are currently
// in the update queue. This allows reporting and tracing of what is causing
// the user to see a loading state.
//
// Also allows hydration callbacks to fire when a dehydrated boundary gets
// hydrated or deleted.
//
// This will eventually be replaced by the Transition Tracing proposal.
export const enableSuspenseCallback = false;

// Experimental Scope support.
export const enableScopeAPI = false;

// Experimental Create Event Handle API.
export const enableCreateEventHandleAPI = false;

// Support legacy Primer support on internal FB www
export const enableLegacyFBSupport = false;

// -----------------------------------------------------------------------------
// Ongoing experiments
//
// These are features that we're either actively exploring or are reasonably
// likely to include in an upcoming release.
// -----------------------------------------------------------------------------

export const enableCache = true;
export const enableLegacyCache = __EXPERIMENTAL__;
export const enableCacheElement = __EXPERIMENTAL__;
export const enableFetchInstrumentation = true;

export const enableFormActions = __EXPERIMENTAL__;

export const enableBinaryFlight = __EXPERIMENTAL__;

export const enableTransitionTracing = false;

// No known bugs, but needs performance testing
export const enableLazyContextPropagation = false;

// FB-only usage. The new API has different semantics.
export const enableLegacyHidden = false;

// Enables unstable_avoidThisFallback feature in Fiber
export const enableSuspenseAvoidThisFallback = false;
// Enables unstable_avoidThisFallback feature in Fizz
export const enableSuspenseAvoidThisFallbackFizz = false;

export const enableCPUSuspense = __EXPERIMENTAL__;

export const enableHostSingletons = true;

export const enableFloat = true;

// Enables unstable_useMemoCache hook, intended as a compilation target for
// auto-memoization.
export const enableUseMemoCacheHook = __EXPERIMENTAL__;

export const enableUseEffectEventHook = __EXPERIMENTAL__;

// Test in www before enabling in open source.
// Enables DOM-server to stream its instruction set as data-attributes
// (handled with an MutationObserver) instead of inline-scripts
export const enableFizzExternalRuntime = true;

// Performance related test
export const diffInCommitPhase = __EXPERIMENTAL__;

export const enableAsyncActions = __EXPERIMENTAL__;

export const alwaysThrottleRetries = true;

// -----------------------------------------------------------------------------
// Chopping Block
//
// Planned feature deprecations and breaking changes. Sorted roughly in order of
// when we plan to enable them.
// -----------------------------------------------------------------------------

// This flag enables Strict Effects by default. We're not turning this on until
// after 18 because it requires migration work. Recommendation is to use
// <StrictMode /> to gradually upgrade components.
// If TRUE, trees rendered with createRoot will be StrictEffectsMode.
// If FALSE, these trees will be StrictLegacyMode.
export const createRootStrictEffectsByDefault = false;

export const disableModulePatternComponents = false;

export const disableLegacyContext = false;

export const enableUseRefAccessWarning = false;

// Enables time slicing for updates that aren't wrapped in startTransition.
export const forceConcurrentByDefaultForTesting = false;

export const enableUnifiedSyncLane = __EXPERIMENTAL__;

// Adds an opt-in to time slicing for updates that aren't wrapped in startTransition.
export const allowConcurrentByDefault = false;

// -----------------------------------------------------------------------------
// React DOM Chopping Block
//
// Similar to main Chopping Block but only flags related to React DOM. These are
// grouped because we will likely batch all of them into a single major release.
// -----------------------------------------------------------------------------

// Disable support for comment nodes as React DOM containers. Already disabled
// in open source, but www codebase still relies on it. Need to remove.
export const disableCommentsAsDOMContainers = true;

// Disable javascript: URL strings in href for XSS protection.
export const disableJavaScriptURLs = false;

export const enableTrustedTypesIntegration = false;

// Prevent the value and checked attributes from syncing with their related
// DOM properties
export const disableInputAttributeSyncing = false;

// Remove IE and MsApp specific workarounds for innerHTML
export const disableIEWorkarounds = __EXPERIMENTAL__;

// Filter certain DOM attributes (e.g. src, href) if their values are empty
// strings. This prevents e.g. <img src=""> from making an unnecessary HTTP
// request for certain browsers.
export const enableFilterEmptyStringAttributesDOM = __EXPERIMENTAL__;

// Changes the behavior for rendering custom elements in both server rendering
// and client rendering, mostly to allow JSX attributes to apply to the custom
// element's object properties instead of only HTML attributes.
// https://github.com/facebook/react/issues/11347
export const enableCustomElementPropertySupport = __EXPERIMENTAL__;

// Disables children for <textarea> elements
export const disableTextareaChildren = false;

// -----------------------------------------------------------------------------
// Debugging and DevTools
// -----------------------------------------------------------------------------

// Adds user timing marks for e.g. state updates, suspense, and work loop stuff,
// for an experimental timeline tool.
export const enableSchedulingProfiler = __PROFILE__;

// Helps identify side effects in render-phase lifecycle hooks and setState
// reducers by double invoking them in StrictLegacyMode.
export const debugRenderPhaseSideEffectsForStrictMode = __DEV__;

// To preserve the "Pause on caught exceptions" behavior of the debugger, we
// replay the begin phase of a failed component inside invokeGuardedCallback.
export const replayFailedUnitOfWorkWithInvokeGuardedCallback = __DEV__;

// Gather advanced timing metrics for Profiler subtrees.
export const enableProfilerTimer = __PROFILE__;

// Record durations for commit and passive effects phases.
export const enableProfilerCommitHooks = __PROFILE__;

// Phase param passed to onRender callback differentiates between an "update" and a "cascading-update".
export const enableProfilerNestedUpdatePhase = __PROFILE__;

// Adds verbose console logging for e.g. state updates, suspense, and work loop
// stuff. Intended to enable React core members to more easily debug scheduling
// issues in DEV builds.
export const enableDebugTracing = false;

// Track which Fiber(s) schedule render work.
export const enableUpdaterTracking = __PROFILE__;

export const enableServerContext = true;

// Internal only.
export const enableGetInspectorDataForInstanceInProduction = false;

// Profiler API accepts a function to be called when a nested update is scheduled.
// This callback accepts the component type (class instance or function) the update is scheduled for.
export const enableProfilerNestedUpdateScheduledHook = false;

export const consoleManagedByDevToolsDuringStrictMode = true;

// Modern <StrictMode /> behaviour aligns more with what components
// components will encounter in production, especially when used With <Offscreen />.
// TODO: clean up legacy <StrictMode /> once tests pass WWW.
export const useModernStrictMode = false;
export const enableDO_NOT_USE_disableStrictPassiveEffect = false;
