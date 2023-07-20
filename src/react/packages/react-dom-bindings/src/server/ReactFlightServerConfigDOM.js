/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 *      
 */

             
                     
                    
                 
                 
                                            

import ReactDOMSharedInternals from 'shared/ReactDOMSharedInternals';
const ReactDOMCurrentDispatcher = ReactDOMSharedInternals.Dispatcher;

import {ReactDOMFlightServerDispatcher} from './ReactDOMFlightServerHostDispatcher';

export function prepareHostDispatcher()       {
  ReactDOMCurrentDispatcher.current = ReactDOMFlightServerDispatcher;
}

// Used to distinguish these contexts from ones used in other renderers.
// E.g. this can be used to distinguish legacy renderers from this modern one.
export const isPrimaryRenderer = true;

                       
          
     
             
                                                                               
      

                                

export function createHints()        {
  return new Set();
}
