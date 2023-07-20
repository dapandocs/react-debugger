/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 *      
 */

                                                              
                                                     
                                     
                                                                                                
                                                                              

import ReactVersion from 'shared/ReactVersion';

import {
  createRequest,
  startWork,
  startFlowing,
  abort,
} from 'react-server/src/ReactFizzServer';

import {
  createResources,
  createResponseState,
  createRootFormatContext,
} from 'react-dom-bindings/src/server/ReactFizzConfigDOM';

function createDrainHandler(destination             , request         ) {
  return () => startFlowing(request, destination);
}

function createAbortHandler(request         , reason        ) {
  // eslint-disable-next-line react-internal/prod-error-codes
  return () => abort(request, new Error(reason));
}

                
                            
                        
                 
                                  
                                                               
                                                               
                                
                            
                                        
                          
                                      
                                                                   
  

                       
                                                           
                          
                             
                                       
  

function createRequestImpl(children               , options                ) {
  const resources = createResources();
  return createRequest(
    children,
    resources,
    createResponseState(
      resources,
      options ? options.identifierPrefix : undefined,
      options ? options.nonce : undefined,
      options ? options.bootstrapScriptContent : undefined,
      options ? options.bootstrapScripts : undefined,
      options ? options.bootstrapModules : undefined,
      options ? options.unstable_externalRuntimeSrc : undefined,
    ),
    createRootFormatContext(options ? options.namespaceURI : undefined),
    options ? options.progressiveChunkSize : undefined,
    options ? options.onError : undefined,
    options ? options.onAllReady : undefined,
    options ? options.onShellReady : undefined,
    options ? options.onShellError : undefined,
    undefined,
  );
}

function renderToPipeableStream(
  children               ,
  options          ,
)                 {
  const request = createRequestImpl(children, options);
  let hasStartedFlowing = false;
  startWork(request);
  return {
    pipe             (destination   )    {
      if (hasStartedFlowing) {
        throw new Error(
          'React currently only supports piping to one writable stream.',
        );
      }
      hasStartedFlowing = true;
      startFlowing(request, destination);
      destination.on('drain', createDrainHandler(destination, request));
      destination.on(
        'error',
        createAbortHandler(
          request,
          'The destination stream errored while writing data.',
        ),
      );
      destination.on(
        'close',
        createAbortHandler(request, 'The destination stream closed early.'),
      );
      return destination;
    },
    abort(reason       ) {
      abort(request, reason);
    },
  };
}

export {renderToPipeableStream, ReactVersion as version};
