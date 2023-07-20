/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 *      
 */

             
                 
                     
                    
                 
                 
                                            

import {enableFloat} from 'shared/ReactFeatureFlags';

import {
  emitHint,
  getHints,
  resolveRequest,
} from 'react-server/src/ReactFlightServer';

export const ReactDOMFlightServerDispatcher                 = {
  prefetchDNS,
  preconnect,
  preload,
  preinit,
};

function prefetchDNS(href        , options                      ) {
  if (enableFloat) {
    if (typeof href === 'string') {
      const request = resolveRequest();
      if (request) {
        const hints = getHints(request);
        const key = 'D' + href;
        if (hints.has(key)) {
          // duplicate hint
          return;
        }
        hints.add(key);
        if (options) {
          emitHint(request, 'D', [href, options]);
        } else {
          emitHint(request, 'D', href);
        }
      }
    }
  }
}

function preconnect(href        , options                     ) {
  if (enableFloat) {
    if (typeof href === 'string') {
      const request = resolveRequest();
      if (request) {
        const hints = getHints(request);
        const crossOrigin =
          options == null || typeof options.crossOrigin !== 'string'
            ? null
            : options.crossOrigin === 'use-credentials'
            ? 'use-credentials'
            : '';

        const key = `C${crossOrigin === null ? 'null' : crossOrigin}|${href}`;
        if (hints.has(key)) {
          // duplicate hint
          return;
        }
        hints.add(key);
        if (options) {
          emitHint(request, 'C', [href, options]);
        } else {
          emitHint(request, 'C', href);
        }
      }
    }
  }
}

function preload(href        , options                ) {
  if (enableFloat) {
    if (typeof href === 'string') {
      const request = resolveRequest();
      if (request) {
        const hints = getHints(request);
        const key = 'L' + href;
        if (hints.has(key)) {
          // duplicate hint
          return;
        }
        hints.add(key);
        emitHint(request, 'L', [href, options]);
      }
    }
  }
}

function preinit(href        , options                ) {
  if (enableFloat) {
    if (typeof href === 'string') {
      const request = resolveRequest();
      if (request) {
        const hints = getHints(request);
        const key = 'I' + href;
        if (hints.has(key)) {
          // duplicate hint
          return;
        }
        hints.add(key);
        emitHint(request, 'I', [href, options]);
      }
    }
  }
}
