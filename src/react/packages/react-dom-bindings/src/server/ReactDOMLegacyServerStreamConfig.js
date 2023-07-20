/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 *      
 */

                              
                                      
                               
 

                                             
                                  
                                        

export function scheduleWork(callback            ) {
  callback();
}

export function flushBuffered(destination             ) {}

export function beginWriting(destination             ) {}

export function writeChunk(
  destination             ,
  chunk                                        ,
)       {
  writeChunkAndReturn(destination, chunk);
}

export function writeChunkAndReturn(
  destination             ,
  chunk                                        ,
)          {
  return destination.push(chunk);
}

export function completeWriting(destination             ) {}

export function close(destination             ) {
  destination.push(null);
}

export function stringToChunk(content        )        {
  return content;
}

export function stringToPrecomputedChunk(content        )                   {
  return content;
}

export function typedArrayToBinaryChunk(
  content                  ,
)              {
  throw new Error('Not implemented.');
}

export function clonePrecomputedChunk(
  chunk                  ,
)                   {
  return chunk;
}

export function byteLengthOfChunk(chunk                          )         {
  throw new Error('Not implemented.');
}

export function byteLengthOfBinaryChunk(chunk             )         {
  throw new Error('Not implemented.');
}

export function closeWithError(destination             , error       )       {
  // $FlowFixMe[incompatible-call]: This is an Error object or the destination accepts other types.
  destination.destroy(error);
}
