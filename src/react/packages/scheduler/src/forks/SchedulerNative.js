/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 *       strict
 */

import * as Scheduler from './Scheduler';
                                                
                                                          
                                                           
                                                                       

// This type is supposed to reflect the actual methods and arguments currently supported by the C++ implementation:
// https://github.com/facebook/react-native/blob/main/packages/react-native/ReactCommon/react/renderer/runtimescheduler/RuntimeSchedulerBinding.cpp
                            
                                            
                                               
                                         
                                       
                                      
                              
                                 
                       
            
                                                
                                                        
                                      
                                    
                                          
  

                                                               

export const unstable_UserBlockingPriority                =
  typeof nativeRuntimeScheduler !== 'undefined'
    ? nativeRuntimeScheduler.unstable_UserBlockingPriority
    : Scheduler.unstable_UserBlockingPriority;

export const unstable_NormalPriority                =
  typeof nativeRuntimeScheduler !== 'undefined'
    ? nativeRuntimeScheduler.unstable_NormalPriority
    : Scheduler.unstable_NormalPriority;

export const unstable_IdlePriority                =
  typeof nativeRuntimeScheduler !== 'undefined'
    ? nativeRuntimeScheduler.unstable_IdlePriority
    : Scheduler.unstable_IdlePriority;

export const unstable_LowPriority                =
  typeof nativeRuntimeScheduler !== 'undefined'
    ? nativeRuntimeScheduler.unstable_LowPriority
    : Scheduler.unstable_LowPriority;

export const unstable_ImmediatePriority                =
  typeof nativeRuntimeScheduler !== 'undefined'
    ? nativeRuntimeScheduler.unstable_ImmediatePriority
    : Scheduler.unstable_ImmediatePriority;

export const unstable_scheduleCallback   
                               
                     
          =
  typeof nativeRuntimeScheduler !== 'undefined'
    ? nativeRuntimeScheduler.unstable_scheduleCallback
    : Scheduler.unstable_scheduleCallback;

export const unstable_cancelCallback                       =
  typeof nativeRuntimeScheduler !== 'undefined'
    ? nativeRuntimeScheduler.unstable_cancelCallback
    : Scheduler.unstable_cancelCallback;

export const unstable_getCurrentPriorityLevel                      =
  typeof nativeRuntimeScheduler !== 'undefined'
    ? nativeRuntimeScheduler.unstable_getCurrentPriorityLevel
    : Scheduler.unstable_getCurrentPriorityLevel;

export const unstable_shouldYield                =
  typeof nativeRuntimeScheduler !== 'undefined'
    ? nativeRuntimeScheduler.unstable_shouldYield
    : Scheduler.unstable_shouldYield;

export const unstable_requestPaint             =
  typeof nativeRuntimeScheduler !== 'undefined'
    ? nativeRuntimeScheduler.unstable_requestPaint
    : Scheduler.unstable_requestPaint;

export const unstable_now                                     =
  typeof nativeRuntimeScheduler !== 'undefined'
    ? nativeRuntimeScheduler.unstable_now
    : Scheduler.unstable_now;

// These were never implemented on the native scheduler because React never calls them.
// For consistency, let's disable them altogether and make them throw.
export const unstable_next      = throwNotImplemented;
export const unstable_runWithPriority      = throwNotImplemented;
export const unstable_wrapCallback      = throwNotImplemented;
export const unstable_continueExecution      = throwNotImplemented;
export const unstable_pauseExecution      = throwNotImplemented;
export const unstable_getFirstCallbackNode      = throwNotImplemented;
export const unstable_forceFrameRate      = throwNotImplemented;
export const unstable_Profiling      = null;

function throwNotImplemented() {
  throw Error('Not implemented.');
}

// Flow magic to verify the exports of this file match the original version.
                             
((((null     )                      )                            )                      );
