/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 *      
 */

             
                             
        
            
                              
                                                                      
                                                   

import {enableTransitionTracing} from 'shared/ReactFeatureFlags';
import {createCursor, push, pop} from './ReactFiberStack';
import {getWorkInProgressTransitions} from './ReactFiberWorkLoop';

                                                 

                                          
                                            
                                                                
                                               
                      
           
                                                                         
           
                        
           
                                                                   
           
                                                      
  

                          
               
                    
  

                                     
                
                     
                              
  

// TODO: Is there a way to not include the tag or name here?
                                     
                         
                                      
                                              
                                        
                      
  

                               
                                                      
                       
  

export const TransitionRoot = 0;
export const TransitionTracingMarker = 1;
                                     

                                                                     

export function processTransitionCallbacks(
  pendingTransitions                            ,
  endTime        ,
  callbacks                            ,
)       {
  if (enableTransitionTracing) {
    if (pendingTransitions !== null) {
      const transitionStart = pendingTransitions.transitionStart;
      const onTransitionStart = callbacks.onTransitionStart;
      if (transitionStart !== null && onTransitionStart != null) {
        transitionStart.forEach(transition =>
          onTransitionStart(transition.name, transition.startTime),
        );
      }

      const markerProgress = pendingTransitions.markerProgress;
      const onMarkerProgress = callbacks.onMarkerProgress;
      if (onMarkerProgress != null && markerProgress !== null) {
        markerProgress.forEach((markerInstance, markerName) => {
          if (markerInstance.transitions !== null) {
            // TODO: Clone the suspense object so users can't modify it
            const pending =
              markerInstance.pendingBoundaries !== null
                ? Array.from(markerInstance.pendingBoundaries.values())
                : [];
            markerInstance.transitions.forEach(transition => {
              onMarkerProgress(
                transition.name,
                markerName,
                transition.startTime,
                endTime,
                pending,
              );
            });
          }
        });
      }

      const markerComplete = pendingTransitions.markerComplete;
      const onMarkerComplete = callbacks.onMarkerComplete;
      if (markerComplete !== null && onMarkerComplete != null) {
        markerComplete.forEach((transitions, markerName) => {
          transitions.forEach(transition => {
            onMarkerComplete(
              transition.name,
              markerName,
              transition.startTime,
              endTime,
            );
          });
        });
      }

      const markerIncomplete = pendingTransitions.markerIncomplete;
      const onMarkerIncomplete = callbacks.onMarkerIncomplete;
      if (onMarkerIncomplete != null && markerIncomplete !== null) {
        markerIncomplete.forEach(({transitions, aborts}, markerName) => {
          transitions.forEach(transition => {
            const filteredAborts = [];
            aborts.forEach(abort => {
              switch (abort.reason) {
                case 'marker': {
                  filteredAborts.push({
                    type: 'marker',
                    name: abort.name,
                    endTime,
                  });
                  break;
                }
                case 'suspense': {
                  filteredAborts.push({
                    type: 'suspense',
                    name: abort.name,
                    endTime,
                  });
                  break;
                }
                default: {
                  break;
                }
              }
            });

            if (filteredAborts.length > 0) {
              onMarkerIncomplete(
                transition.name,
                markerName,
                transition.startTime,
                filteredAborts,
              );
            }
          });
        });
      }

      const transitionProgress = pendingTransitions.transitionProgress;
      const onTransitionProgress = callbacks.onTransitionProgress;
      if (onTransitionProgress != null && transitionProgress !== null) {
        transitionProgress.forEach((pending, transition) => {
          onTransitionProgress(
            transition.name,
            transition.startTime,
            endTime,
            Array.from(pending.values()),
          );
        });
      }

      const transitionComplete = pendingTransitions.transitionComplete;
      const onTransitionComplete = callbacks.onTransitionComplete;
      if (transitionComplete !== null && onTransitionComplete != null) {
        transitionComplete.forEach(transition =>
          onTransitionComplete(transition.name, transition.startTime, endTime),
        );
      }
    }
  }
}

// For every tracing marker, store a pointer to it. We will later access it
// to get the set of suspense boundaries that need to resolve before the
// tracing marker can be logged as complete
// This code lives separate from the ReactFiberTransition code because
// we push and pop on the tracing marker, not the suspense boundary
const markerInstanceStack                                                   =
  createCursor(null);

export function pushRootMarkerInstance(workInProgress       )       {
  if (enableTransitionTracing) {
    // On the root, every transition gets mapped to it's own map of
    // suspense boundaries. The transition is marked as complete when
    // the suspense boundaries map is empty. We do this because every
    // transition completes at different times and depends on different
    // suspense boundaries to complete. We store all the transitions
    // along with its map of suspense boundaries in the root incomplete
    // transitions map. Each entry in this map functions like a tracing
    // marker does, so we can push it onto the marker instance stack
    const transitions = getWorkInProgressTransitions();
    const root            = workInProgress.stateNode;

    if (transitions !== null) {
      transitions.forEach(transition => {
        if (!root.incompleteTransitions.has(transition)) {
          const markerInstance                        = {
            tag: TransitionRoot,
            transitions: new Set([transition]),
            pendingBoundaries: null,
            aborts: null,
            name: null,
          };
          root.incompleteTransitions.set(transition, markerInstance);
        }
      });
    }

    const markerInstances = [];
    // For ever transition on the suspense boundary, we push the transition
    // along with its map of pending suspense boundaries onto the marker
    // instance stack.
    root.incompleteTransitions.forEach(markerInstance => {
      markerInstances.push(markerInstance);
    });
    push(markerInstanceStack, markerInstances, workInProgress);
  }
}

export function popRootMarkerInstance(workInProgress       ) {
  if (enableTransitionTracing) {
    pop(markerInstanceStack, workInProgress);
  }
}

export function pushMarkerInstance(
  workInProgress       ,
  markerInstance                       ,
)       {
  if (enableTransitionTracing) {
    if (markerInstanceStack.current === null) {
      push(markerInstanceStack, [markerInstance], workInProgress);
    } else {
      push(
        markerInstanceStack,
        markerInstanceStack.current.concat(markerInstance),
        workInProgress,
      );
    }
  }
}

export function popMarkerInstance(workInProgress       )       {
  if (enableTransitionTracing) {
    pop(markerInstanceStack, workInProgress);
  }
}

export function getMarkerInstances()                                      {
  if (enableTransitionTracing) {
    return markerInstanceStack.current;
  }
  return null;
}
