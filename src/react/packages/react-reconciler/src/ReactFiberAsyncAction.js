/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 *      
 */

             
           
                  
                    
                   
                           
                                           

import {requestTransitionLane} from './ReactFiberRootScheduler';
import {NoLane} from './ReactFiberLane';

// If there are multiple, concurrent async actions, they are entangled. All
// transition updates that occur while the async action is still in progress
// are treated as part of the action.
//
// The ideal behavior would be to treat each async function as an independent
// action. However, without a mechanism like AsyncContext, we can't tell which
// action an update corresponds to. So instead, we entangle them all into one.

// The listeners to notify once the entangled scope completes.
let currentEntangledListeners                            = null;
// The number of pending async actions in the entangled scope.
let currentEntangledPendingCount         = 0;
// The transition lane shared by all updates in the entangled scope.
let currentEntangledLane       = NoLane;

export function requestAsyncActionContext   (
  actionReturnValue       ,
  finishedState   ,
)                  {
  if (
    actionReturnValue !== null &&
    typeof actionReturnValue === 'object' &&
    typeof actionReturnValue.then === 'function'
  ) {
    // This is an async action.
    //
    // Return a thenable that resolves once the action scope (i.e. the async
    // function passed to startTransition) has finished running.

    const thenable                  = (actionReturnValue     );
    let entangledListeners;
    if (currentEntangledListeners === null) {
      // There's no outer async action scope. Create a new one.
      entangledListeners = currentEntangledListeners = [];
      currentEntangledPendingCount = 0;
      currentEntangledLane = requestTransitionLane();
    } else {
      entangledListeners = currentEntangledListeners;
    }

    currentEntangledPendingCount++;
    let resultStatus = 'pending';
    let rejectedReason;
    thenable.then(
      () => {
        resultStatus = 'fulfilled';
        pingEngtangledActionScope();
      },
      error => {
        resultStatus = 'rejected';
        rejectedReason = error;
        pingEngtangledActionScope();
      },
    );

    // Create a thenable that represents the result of this action, but doesn't
    // resolve until the entire entangled scope has finished.
    //
    // Expressed using promises:
    //   const [thisResult] = await Promise.all([thisAction, entangledAction]);
    //   return thisResult;
    const resultThenable = createResultThenable   (entangledListeners);

    // Attach a listener to fill in the result.
    entangledListeners.push(() => {
      switch (resultStatus) {
        case 'fulfilled': {
          const fulfilledThenable                       = (resultThenable     );
          fulfilledThenable.status = 'fulfilled';
          fulfilledThenable.value = finishedState;
          break;
        }
        case 'rejected': {
          const rejectedThenable                      = (resultThenable     );
          rejectedThenable.status = 'rejected';
          rejectedThenable.reason = rejectedReason;
          break;
        }
        case 'pending':
        default: {
          // The listener above should have been called first, so `resultStatus`
          // should already be set to the correct value.
          throw new Error(
            'Thenable should have already resolved. This ' +
              'is a bug in React.',
          );
        }
      }
    });

    return resultThenable;
  } else {
    // This is not an async action, but it may be part of an outer async action.
    if (currentEntangledListeners === null) {
      return finishedState;
    } else {
      // Return a thenable that does not resolve until the entangled actions
      // have finished.
      const entangledListeners = currentEntangledListeners;
      const resultThenable = createResultThenable   (entangledListeners);
      entangledListeners.push(() => {
        const fulfilledThenable                       = (resultThenable     );
        fulfilledThenable.status = 'fulfilled';
        fulfilledThenable.value = finishedState;
      });
      return resultThenable;
    }
  }
}

function pingEngtangledActionScope() {
  if (
    currentEntangledListeners !== null &&
    --currentEntangledPendingCount === 0
  ) {
    // All the actions have finished. Close the entangled async action scope
    // and notify all the listeners.
    const listeners = currentEntangledListeners;
    currentEntangledListeners = null;
    currentEntangledLane = NoLane;
    for (let i = 0; i < listeners.length; i++) {
      const listener = listeners[i];
      listener();
    }
  }
}

function createResultThenable   (
  entangledListeners                    ,
)              {
  // Waits for the entangled async action to complete, then resolves to the
  // result of an individual action.
  const resultThenable                     = {
    status: 'pending',
    value: null,
    reason: null,
    then(resolve            ) {
      // This is a bit of a cheat. `resolve` expects a value of type `S` to be
      // passed, but because we're instrumenting the `status` field ourselves,
      // and we know this thenable will only be used by React, we also know
      // the value isn't actually needed. So we add the resolve function
      // directly to the entangled listeners.
      //
      // This is also why we don't need to check if the thenable is still
      // pending; the Suspense implementation already performs that check.
      const ping              = (resolve     );
      entangledListeners.push(ping);
    },
  };
  return resultThenable;
}

export function peekEntangledActionLane()       {
  return currentEntangledLane;
}
