/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 *      
 */

                                                     

                                                              

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
} from 'react-dom-bindings/src/server/ReactFizzConfigDOMLegacy';

import {Readable} from 'stream';

                      
                            
  

class ReactMarkupReadableStream extends Readable {
  request         ;
  startedFlowing         ;
  constructor() {
    // Calls the stream.Readable(options) constructor. Consider exposing built-in
    // features like highWaterMark in the future.
    super({});
    this.request = (null     );
    this.startedFlowing = false;
  }

  // $FlowFixMe[missing-local-annot]
  _destroy(err, callback) {
    abort(this.request);
    callback(err);
  }

  // $FlowFixMe[missing-local-annot]
  _read(size) {
    if (this.startedFlowing) {
      startFlowing(this.request, this);
    }
  }
}

function onError() {
  // Non-fatal errors are ignored.
}

function renderToNodeStreamImpl(
  children               ,
  options                      ,
  generateStaticMarkup         ,
)           {
  function onAllReady() {
    // We wait until everything has loaded before starting to write.
    // That way we only end up with fully resolved HTML even if we suspend.
    destination.startedFlowing = true;
    startFlowing(request, destination);
  }
  const destination = new ReactMarkupReadableStream();
  const resources = createResources();
  const request = createRequest(
    children,
    resources,
    createResponseState(
      resources,
      false,
      options ? options.identifierPrefix : undefined,
    ),
    createRootFormatContext(),
    Infinity,
    onError,
    onAllReady,
    undefined,
    undefined,
  );
  destination.request = request;
  startWork(request);
  return destination;
}

function renderToNodeStream(
  children               ,
  options                ,
)           {
  if (__DEV__) {
    console.error(
      'renderToNodeStream is deprecated. Use renderToPipeableStream instead.',
    );
  }
  return renderToNodeStreamImpl(children, options, false);
}

function renderToStaticNodeStream(
  children               ,
  options                ,
)           {
  return renderToNodeStreamImpl(children, options, true);
}

export {renderToNodeStream, renderToStaticNodeStream};
