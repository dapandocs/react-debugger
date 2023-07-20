/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 *      
 */

                                                                       
                                                                             
                                                          
                                                                              
             
               
                              
                              
                                                 
                                                          
                                                          
                                                                                  
             
                     
                    
                 
                 
                                            

import {NotPending} from 'react-dom-bindings/src/shared/ReactDOMFormActions';
import {getCurrentRootHostContainer} from 'react-reconciler/src/ReactFiberHostContext';
import {DefaultEventPriority} from 'react-reconciler/src/ReactEventPriorities';
// TODO: Remove this deep import when we delete the legacy root API
import {ConcurrentMode, NoMode} from 'react-reconciler/src/ReactTypeOfMode';

import hasOwnProperty from 'shared/hasOwnProperty';
import {checkAttributeStringCoercion} from 'shared/CheckStringCoercion';

import {
  precacheFiberNode,
  updateFiberProps,
  getClosestInstanceFromNode,
  getFiberFromScopeInstance,
  getInstanceFromNode as getInstanceFromNodeDOMTree,
  isContainerMarkedAsRoot,
  detachDeletedInstance,
  getResourcesFromRoot,
  isMarkedHoistable,
  markNodeAsHoistable,
  isOwnedInstance,
} from './ReactDOMComponentTree';
export {detachDeletedInstance};
import {hasRole} from './DOMAccessibilityRoles';
import {
  setInitialProperties,
  diffProperties,
  updateProperties,
  updatePropertiesWithDiff,
  diffHydratedProperties,
  diffHydratedText,
  trapClickOnNonInteractiveElement,
  checkForUnmatchedText,
  warnForDeletedHydratableElement,
  warnForDeletedHydratableText,
  warnForInsertedHydratedElement,
  warnForInsertedHydratedText,
} from './ReactDOMComponent';
import {getSelectionInformation, restoreSelection} from './ReactInputSelection';
import setTextContent from './setTextContent';
import {
  validateDOMNesting,
  validateTextNesting,
  updatedAncestorInfoDev,
} from './validateDOMNesting';
import {
  isEnabled as ReactBrowserEventEmitterIsEnabled,
  setEnabled as ReactBrowserEventEmitterSetEnabled,
  getEventPriority,
} from '../events/ReactDOMEventListener';
import {SVG_NAMESPACE, MATH_NAMESPACE} from './DOMNamespaces';
import {
  ELEMENT_NODE,
  TEXT_NODE,
  COMMENT_NODE,
  DOCUMENT_NODE,
  DOCUMENT_TYPE_NODE,
  DOCUMENT_FRAGMENT_NODE,
} from './HTMLNodeType';

import {retryIfBlockedOn} from '../events/ReactDOMEventReplaying';

import {
  enableCreateEventHandleAPI,
  enableScopeAPI,
  enableFloat,
  enableHostSingletons,
  enableTrustedTypesIntegration,
  diffInCommitPhase,
  enableFormActions,
} from 'shared/ReactFeatureFlags';
import {
  HostComponent,
  HostHoistable,
  HostText,
  HostSingleton,
} from 'react-reconciler/src/ReactWorkTags';
import {listenToAllSupportedEvents} from '../events/DOMPluginEventSystem';
import {
  validatePreinitArguments,
  validateLinkPropsForStyleResource,
  getValueDescriptorExpectingObjectForWarning,
  getValueDescriptorExpectingEnumForWarning,
} from '../shared/ReactDOMResourceValidation';
import escapeSelectorAttributeValueInsideDoubleQuotes from './escapeSelectorAttributeValueInsideDoubleQuotes';

                          
                     
                      
                   
                     
                   
                                     
                                  
                                  
                         
                       
                        
                      
              
                
                     
     
  
                 
                  
  
                                       
               
                 
             
                        
                      
                      
                    
                     
                   
         
      
       
    
     
  
                       
                                                               
                                                                
                                                                         
                               
                                
                                                   
                           
 
                                                                            
                                            
                              
                           
                                
  
                                            
                                                           
                                         
                             // Unused
                                      
                           
                                                     

                                          

                             
                                  
                        
  

const SUPPRESS_HYDRATION_WARNING = 'suppressHydrationWarning';

const SUSPENSE_START_DATA = '$';
const SUSPENSE_END_DATA = '/$';
const SUSPENSE_PENDING_START_DATA = '$?';
const SUSPENSE_FALLBACK_START_DATA = '$!';

const STYLE = 'style';

                                             
export const HostContextNamespaceNone                       = 0;
const HostContextNamespaceSvg                       = 1;
const HostContextNamespaceMath                       = 2;

let eventsEnabled           = null;
let selectionInformation                              = null;

export * from 'react-reconciler/src/ReactFiberConfigWithNoPersistence';

function getOwnerDocumentFromRootContainer(
  rootContainerElement                                       ,
)           {
  return rootContainerElement.nodeType === DOCUMENT_NODE
    ? (rootContainerElement     )
    : rootContainerElement.ownerDocument;
}

export function getRootHostContext(
  rootContainerInstance           ,
)              {
  let type;
  let context                 ;
  const nodeType = rootContainerInstance.nodeType;
  switch (nodeType) {
    case DOCUMENT_NODE:
    case DOCUMENT_FRAGMENT_NODE: {
      type = nodeType === DOCUMENT_NODE ? '#document' : '#fragment';
      const root = (rootContainerInstance     ).documentElement;
      if (root) {
        const namespaceURI = root.namespaceURI;
        context = namespaceURI
          ? getOwnHostContext(namespaceURI)
          : HostContextNamespaceNone;
      } else {
        context = HostContextNamespaceNone;
      }
      break;
    }
    default: {
      const container      =
        nodeType === COMMENT_NODE
          ? rootContainerInstance.parentNode
          : rootContainerInstance;
      type = container.tagName;
      const namespaceURI = container.namespaceURI;
      if (!namespaceURI) {
        switch (type) {
          case 'svg':
            context = HostContextNamespaceSvg;
            break;
          case 'math':
            context = HostContextNamespaceMath;
            break;
          default:
            context = HostContextNamespaceNone;
            break;
        }
      } else {
        const ownContext = getOwnHostContext(namespaceURI);
        context = getChildHostContextProd(ownContext, type);
      }
      break;
    }
  }
  if (__DEV__) {
    const validatedTag = type.toLowerCase();
    const ancestorInfo = updatedAncestorInfoDev(null, validatedTag);
    return {context, ancestorInfo};
  }
  return context;
}

function getOwnHostContext(namespaceURI        )                       {
  switch (namespaceURI) {
    case SVG_NAMESPACE:
      return HostContextNamespaceSvg;
    case MATH_NAMESPACE:
      return HostContextNamespaceMath;
    default:
      return HostContextNamespaceNone;
  }
}

function getChildHostContextProd(
  parentNamespace                      ,
  type        ,
)                       {
  if (parentNamespace === HostContextNamespaceNone) {
    // No (or default) parent namespace: potential entry point.
    switch (type) {
      case 'svg':
        return HostContextNamespaceSvg;
      case 'math':
        return HostContextNamespaceMath;
      default:
        return HostContextNamespaceNone;
    }
  }
  if (parentNamespace === HostContextNamespaceSvg && type === 'foreignObject') {
    // We're leaving SVG.
    return HostContextNamespaceNone;
  }
  // By default, pass namespace below.
  return parentNamespace;
}

export function getChildHostContext(
  parentHostContext             ,
  type        ,
)              {
  if (__DEV__) {
    const parentHostContextDev = ((parentHostContext     )                );
    const context = getChildHostContextProd(parentHostContextDev.context, type);
    const ancestorInfo = updatedAncestorInfoDev(
      parentHostContextDev.ancestorInfo,
      type,
    );
    return {context, ancestorInfo};
  }
  const parentNamespace = ((parentHostContext     )                 );
  return getChildHostContextProd(parentNamespace, type);
}

export function getPublicInstance(instance          )           {
  return instance;
}

export function prepareForCommit(containerInfo           )                {
  eventsEnabled = ReactBrowserEventEmitterIsEnabled();
  selectionInformation = getSelectionInformation();
  let activeInstance = null;
  if (enableCreateEventHandleAPI) {
    const focusedElem = selectionInformation.focusedElem;
    if (focusedElem !== null) {
      activeInstance = getClosestInstanceFromNode(focusedElem);
    }
  }
  ReactBrowserEventEmitterSetEnabled(false);
  return activeInstance;
}

export function beforeActiveInstanceBlur(internalInstanceHandle        )       {
  if (enableCreateEventHandleAPI) {
    ReactBrowserEventEmitterSetEnabled(true);
    dispatchBeforeDetachedBlur(
      (selectionInformation     ).focusedElem,
      internalInstanceHandle,
    );
    ReactBrowserEventEmitterSetEnabled(false);
  }
}

export function afterActiveInstanceBlur()       {
  if (enableCreateEventHandleAPI) {
    ReactBrowserEventEmitterSetEnabled(true);
    dispatchAfterDetachedBlur((selectionInformation     ).focusedElem);
    ReactBrowserEventEmitterSetEnabled(false);
  }
}

export function resetAfterCommit(containerInfo           )       {
  restoreSelection(selectionInformation);
  ReactBrowserEventEmitterSetEnabled(eventsEnabled);
  eventsEnabled = null;
  selectionInformation = null;
}

export function createHoistableInstance(
  type        ,
  props       ,
  rootContainerInstance           ,
  internalInstanceHandle        ,
)           {
  const ownerDocument = getOwnerDocumentFromRootContainer(
    rootContainerInstance,
  );

  const domElement           = ownerDocument.createElement(type);
  precacheFiberNode(internalInstanceHandle, domElement);
  updateFiberProps(domElement, props);
  setInitialProperties(domElement, type, props);
  markNodeAsHoistable(domElement);
  return domElement;
}

let didWarnScriptTags = false;
const warnedUnknownTags   
                         
  = {
  // There are working polyfills for <dialog>. Let people use it.
  dialog: true,
  // Electron ships a custom <webview> tag to display external web content in
  // an isolated frame and process.
  // This tag is not present in non Electron environments such as JSDom which
  // is often used for testing purposes.
  // @see https://electronjs.org/docs/api/webview-tag
  webview: true,
};

export function createInstance(
  type        ,
  props       ,
  rootContainerInstance           ,
  hostContext             ,
  internalInstanceHandle        ,
)           {
  let hostContextProd                 ;
  if (__DEV__) {
    // TODO: take namespace into account when validating.
    const hostContextDev                 = (hostContext     );
    validateDOMNesting(type, hostContextDev.ancestorInfo);
    hostContextProd = hostContextDev.context;
  } else {
    hostContextProd = (hostContext     );
  }

  const ownerDocument = getOwnerDocumentFromRootContainer(
    rootContainerInstance,
  );

  let domElement          ;
  switch (hostContextProd) {
    case HostContextNamespaceSvg:
      domElement = ownerDocument.createElementNS(SVG_NAMESPACE, type);
      break;
    case HostContextNamespaceMath:
      domElement = ownerDocument.createElementNS(MATH_NAMESPACE, type);
      break;
    default:
      switch (type) {
        case 'svg': {
          domElement = ownerDocument.createElementNS(SVG_NAMESPACE, type);
          break;
        }
        case 'math': {
          domElement = ownerDocument.createElementNS(MATH_NAMESPACE, type);
          break;
        }
        case 'script': {
          // Create the script via .innerHTML so its "parser-inserted" flag is
          // set to true and it does not execute
          const div = ownerDocument.createElement('div');
          if (__DEV__) {
            if (enableTrustedTypesIntegration && !didWarnScriptTags) {
              console.error(
                'Encountered a script tag while rendering React component. ' +
                  'Scripts inside React components are never executed when rendering ' +
                  'on the client. Consider using template tag instead ' +
                  '(https://developer.mozilla.org/en-US/docs/Web/HTML/Element/template).',
              );
              didWarnScriptTags = true;
            }
          }
          div.innerHTML = '<script><' + '/script>'; // eslint-disable-line
          // This is guaranteed to yield a script element.
          const firstChild = ((div.firstChild     )                   );
          domElement = div.removeChild(firstChild);
          break;
        }
        case 'select': {
          if (typeof props.is === 'string') {
            domElement = ownerDocument.createElement('select', {is: props.is});
          } else {
            // Separate else branch instead of using `props.is || undefined` above because of a Firefox bug.
            // See discussion in https://github.com/facebook/react/pull/6896
            // and discussion in https://bugzilla.mozilla.org/show_bug.cgi?id=1276240
            domElement = ownerDocument.createElement('select');
          }
          if (props.multiple) {
            domElement.multiple = true;
          } else if (props.size) {
            // Setting a size greater than 1 causes a select to behave like `multiple=true`, where
            // it is possible that no option is selected.
            //
            // This is only necessary when a select in "single selection mode".
            domElement.size = props.size;
          }
          break;
        }
        default: {
          if (typeof props.is === 'string') {
            domElement = ownerDocument.createElement(type, {is: props.is});
          } else {
            // Separate else branch instead of using `props.is || undefined` above because of a Firefox bug.
            // See discussion in https://github.com/facebook/react/pull/6896
            // and discussion in https://bugzilla.mozilla.org/show_bug.cgi?id=1276240
            domElement = ownerDocument.createElement(type);
          }

          if (__DEV__) {
            if (type.indexOf('-') === -1) {
              // We're not SVG/MathML and we don't have a dash, so we're not a custom element
              // Even if you use `is`, these should be of known type and lower case.
              if (type !== type.toLowerCase()) {
                console.error(
                  '<%s /> is using incorrect casing. ' +
                    'Use PascalCase for React components, ' +
                    'or lowercase for HTML elements.',
                  type,
                );
              }
              if (
                // $FlowFixMe[method-unbinding]
                Object.prototype.toString.call(domElement) ===
                  '[object HTMLUnknownElement]' &&
                !hasOwnProperty.call(warnedUnknownTags, type)
              ) {
                warnedUnknownTags[type] = true;
                console.error(
                  'The tag <%s> is unrecognized in this browser. ' +
                    'If you meant to render a React component, start its name with ' +
                    'an uppercase letter.',
                  type,
                );
              }
            }
          }
        }
      }
  }
  precacheFiberNode(internalInstanceHandle, domElement);
  updateFiberProps(domElement, props);
  return domElement;
}

export function appendInitialChild(
  parentInstance          ,
  child                         ,
)       {
  parentInstance.appendChild(child);
}

export function finalizeInitialChildren(
  domElement          ,
  type        ,
  props       ,
  hostContext             ,
)          {
  setInitialProperties(domElement, type, props);
  switch (type) {
    case 'button':
    case 'input':
    case 'select':
    case 'textarea':
      return !!props.autoFocus;
    case 'img':
      return true;
    default:
      return false;
  }
}

export function prepareUpdate(
  domElement          ,
  type        ,
  oldProps       ,
  newProps       ,
  hostContext             ,
)                      {
  if (diffInCommitPhase) {
    // TODO: Figure out how to validateDOMNesting when children turn into a string.
    return null;
  }
  return diffProperties(domElement, type, oldProps, newProps);
}

export function shouldSetTextContent(type        , props       )          {
  return (
    type === 'textarea' ||
    type === 'noscript' ||
    typeof props.children === 'string' ||
    typeof props.children === 'number' ||
    (typeof props.dangerouslySetInnerHTML === 'object' &&
      props.dangerouslySetInnerHTML !== null &&
      props.dangerouslySetInnerHTML.__html != null)
  );
}

export function createTextInstance(
  text        ,
  rootContainerInstance           ,
  hostContext             ,
  internalInstanceHandle        ,
)               {
  if (__DEV__) {
    const hostContextDev = ((hostContext     )                );
    const ancestor = hostContextDev.ancestorInfo.current;
    if (ancestor != null) {
      validateTextNesting(text, ancestor.tag);
    }
  }
  const textNode               = getOwnerDocumentFromRootContainer(
    rootContainerInstance,
  ).createTextNode(text);
  precacheFiberNode(internalInstanceHandle, textNode);
  return textNode;
}

export function getCurrentEventPriority()                {
  const currentEvent = window.event;
  if (currentEvent === undefined) {
    return DefaultEventPriority;
  }
  return getEventPriority(currentEvent.type);
}

export function shouldAttemptEagerTransition()          {
  return window.event && window.event.type === 'popstate';
}

export const isPrimaryRenderer = true;
export const warnsIfNotActing = true;
// This initialization code may run even on server environments
// if a component just imports ReactDOM (e.g. for findDOMNode).
// Some environments might not have setTimeout or clearTimeout.
export const scheduleTimeout      =
  typeof setTimeout === 'function' ? setTimeout : (undefined     );
export const cancelTimeout      =
  typeof clearTimeout === 'function' ? clearTimeout : (undefined     );
export const noTimeout = -1;
const localPromise = typeof Promise === 'function' ? Promise : undefined;
const localRequestAnimationFrame =
  typeof requestAnimationFrame === 'function'
    ? requestAnimationFrame
    : scheduleTimeout;

export function getInstanceFromNode(node             )                {
  return getClosestInstanceFromNode(node) || null;
}

export function preparePortalMount(portalInstance          )       {
  listenToAllSupportedEvents(portalInstance);
}

export function prepareScopeUpdate(
  scopeInstance                    ,
  internalInstanceHandle        ,
)       {
  if (enableScopeAPI) {
    precacheFiberNode(internalInstanceHandle, scopeInstance);
  }
}

export function getInstanceFromScope(
  scopeInstance                    ,
)                {
  if (enableScopeAPI) {
    return getFiberFromScopeInstance(scopeInstance);
  }
  return null;
}

// -------------------
//     Microtasks
// -------------------
export const supportsMicrotasks = true;
export const scheduleMicrotask      =
  typeof queueMicrotask === 'function'
    ? queueMicrotask
    : typeof localPromise !== 'undefined'
    ? callback =>
        localPromise.resolve(null).then(callback).catch(handleErrorInNextTick)
    : scheduleTimeout; // TODO: Determine the best fallback here.

function handleErrorInNextTick(error     ) {
  setTimeout(() => {
    throw error;
  });
}

// -------------------
//     Mutation
// -------------------

export const supportsMutation = true;

export function commitMount(
  domElement          ,
  type        ,
  newProps       ,
  internalInstanceHandle        ,
)       {
  // Despite the naming that might imply otherwise, this method only
  // fires if there is an `Update` effect scheduled during mounting.
  // This happens if `finalizeInitialChildren` returns `true` (which it
  // does to implement the `autoFocus` attribute on the client). But
  // there are also other cases when this might happen (such as patching
  // up text content during hydration mismatch). So we'll check this again.
  switch (type) {
    case 'button':
    case 'input':
    case 'select':
    case 'textarea':
      if (newProps.autoFocus) {
        ((domElement     ) 
                             
                            
                             
                               ).focus();
      }
      return;
    case 'img': {
      if ((newProps     ).src) {
        ((domElement     )                  ).src = (newProps     ).src;
      }
      return;
    }
  }
}

export function commitUpdate(
  domElement          ,
  updatePayload     ,
  type        ,
  oldProps       ,
  newProps       ,
  internalInstanceHandle        ,
)       {
  if (diffInCommitPhase) {
    // Diff and update the properties.
    updateProperties(domElement, type, oldProps, newProps);
  } else {
    // Apply the diff to the DOM node.
    updatePropertiesWithDiff(
      domElement,
      updatePayload,
      type,
      oldProps,
      newProps,
    );
  }

  // Update the props handle so that we know which props are the ones with
  // with current event handlers.
  updateFiberProps(domElement, newProps);
}

export function resetTextContent(domElement          )       {
  setTextContent(domElement, '');
}

export function commitTextUpdate(
  textInstance              ,
  oldText        ,
  newText        ,
)       {
  textInstance.nodeValue = newText;
}

export function appendChild(
  parentInstance          ,
  child                         ,
)       {
  parentInstance.appendChild(child);
}

export function appendChildToContainer(
  container           ,
  child                         ,
)       {
  let parentNode;
  if (container.nodeType === COMMENT_NODE) {
    parentNode = (container.parentNode     );
    parentNode.insertBefore(child, container);
  } else {
    parentNode = container;
    parentNode.appendChild(child);
  }
  // This container might be used for a portal.
  // If something inside a portal is clicked, that click should bubble
  // through the React tree. However, on Mobile Safari the click would
  // never bubble through the *DOM* tree unless an ancestor with onclick
  // event exists. So we wouldn't see it and dispatch it.
  // This is why we ensure that non React root containers have inline onclick
  // defined.
  // https://github.com/facebook/react/issues/11918
  const reactRootContainer = container._reactRootContainer;
  if (
    (reactRootContainer === null || reactRootContainer === undefined) &&
    parentNode.onclick === null
  ) {
    // TODO: This cast may not be sound for SVG, MathML or custom elements.
    trapClickOnNonInteractiveElement(((parentNode     )             ));
  }
}

export function insertBefore(
  parentInstance          ,
  child                         ,
  beforeChild                                            ,
)       {
  parentInstance.insertBefore(child, beforeChild);
}

export function insertInContainerBefore(
  container           ,
  child                         ,
  beforeChild                                            ,
)       {
  if (container.nodeType === COMMENT_NODE) {
    (container.parentNode     ).insertBefore(child, beforeChild);
  } else {
    container.insertBefore(child, beforeChild);
  }
}

function createEvent(type              , bubbles         )        {
  const event = document.createEvent('Event');
  event.initEvent(((type     )        ), bubbles, false);
  return event;
}

function dispatchBeforeDetachedBlur(
  target             ,
  internalInstanceHandle        ,
)       {
  if (enableCreateEventHandleAPI) {
    const event = createEvent('beforeblur', true);
    // Dispatch "beforeblur" directly on the target,
    // so it gets picked up by the event system and
    // can propagate through the React internal tree.
    // $FlowFixMe[prop-missing]: internal field
    event._detachedInterceptFiber = internalInstanceHandle;
    target.dispatchEvent(event);
  }
}

function dispatchAfterDetachedBlur(target             )       {
  if (enableCreateEventHandleAPI) {
    const event = createEvent('afterblur', false);
    // So we know what was detached, make the relatedTarget the
    // detached target on the "afterblur" event.
    (event     ).relatedTarget = target;
    // Dispatch the event on the document.
    document.dispatchEvent(event);
  }
}

export function removeChild(
  parentInstance          ,
  child                                            ,
)       {
  parentInstance.removeChild(child);
}

export function removeChildFromContainer(
  container           ,
  child                                            ,
)       {
  if (container.nodeType === COMMENT_NODE) {
    (container.parentNode     ).removeChild(child);
  } else {
    container.removeChild(child);
  }
}

export function clearSuspenseBoundary(
  parentInstance          ,
  suspenseInstance                  ,
)       {
  let node       = suspenseInstance;
  // Delete all nodes within this suspense boundary.
  // There might be nested nodes so we need to keep track of how
  // deep we are and only break out when we're back on top.
  let depth = 0;
  do {
    const nextNode = node.nextSibling;
    parentInstance.removeChild(node);
    if (nextNode && nextNode.nodeType === COMMENT_NODE) {
      const data = ((nextNode     ).data        );
      if (data === SUSPENSE_END_DATA) {
        if (depth === 0) {
          parentInstance.removeChild(nextNode);
          // Retry if any event replaying was blocked on this.
          retryIfBlockedOn(suspenseInstance);
          return;
        } else {
          depth--;
        }
      } else if (
        data === SUSPENSE_START_DATA ||
        data === SUSPENSE_PENDING_START_DATA ||
        data === SUSPENSE_FALLBACK_START_DATA
      ) {
        depth++;
      }
    }
    // $FlowFixMe[incompatible-type] we bail out when we get a null
    node = nextNode;
  } while (node);
  // TODO: Warn, we didn't find the end comment boundary.
  // Retry if any event replaying was blocked on this.
  retryIfBlockedOn(suspenseInstance);
}

export function clearSuspenseBoundaryFromContainer(
  container           ,
  suspenseInstance                  ,
)       {
  if (container.nodeType === COMMENT_NODE) {
    clearSuspenseBoundary((container.parentNode     ), suspenseInstance);
  } else if (container.nodeType === ELEMENT_NODE) {
    clearSuspenseBoundary((container     ), suspenseInstance);
  } else {
    // Document nodes should never contain suspense boundaries.
  }
  // Retry if any event replaying was blocked on this.
  retryIfBlockedOn(container);
}

export function hideInstance(instance          )       {
  // TODO: Does this work for all element types? What about MathML? Should we
  // pass host context to this method?
  instance = ((instance     )             );
  const style = instance.style;
  // $FlowFixMe[method-unbinding]
  if (typeof style.setProperty === 'function') {
    style.setProperty('display', 'none', 'important');
  } else {
    style.display = 'none';
  }
}

export function hideTextInstance(textInstance              )       {
  textInstance.nodeValue = '';
}

export function unhideInstance(instance          , props       )       {
  instance = ((instance     )             );
  const styleProp = props[STYLE];
  const display =
    styleProp !== undefined &&
    styleProp !== null &&
    styleProp.hasOwnProperty('display')
      ? styleProp.display
      : null;
  instance.style.display =
    display == null || typeof display === 'boolean'
      ? ''
      : // The value would've errored already if it wasn't safe.
        // eslint-disable-next-line react-internal/safe-string-coercion
        ('' + display).trim();
}

export function unhideTextInstance(
  textInstance              ,
  text        ,
)       {
  textInstance.nodeValue = text;
}

export function clearContainer(container           )       {
  if (enableHostSingletons) {
    const nodeType = container.nodeType;
    if (nodeType === DOCUMENT_NODE) {
      clearContainerSparingly(container);
    } else if (nodeType === ELEMENT_NODE) {
      switch (container.nodeName) {
        case 'HEAD':
        case 'HTML':
        case 'BODY':
          clearContainerSparingly(container);
          return;
        default: {
          container.textContent = '';
        }
      }
    }
  } else {
    if (container.nodeType === ELEMENT_NODE) {
      // We have refined the container to Element type
      const element          = (container     );
      element.textContent = '';
    } else if (container.nodeType === DOCUMENT_NODE) {
      // We have refined the container to Document type
      const doc           = (container     );
      if (doc.documentElement) {
        doc.removeChild(doc.documentElement);
      }
    }
  }
}

function clearContainerSparingly(container      ) {
  let node;
  let nextNode        = container.firstChild;
  if (nextNode && nextNode.nodeType === DOCUMENT_TYPE_NODE) {
    nextNode = nextNode.nextSibling;
  }
  while (nextNode) {
    node = nextNode;
    nextNode = nextNode.nextSibling;
    switch (node.nodeName) {
      case 'HTML':
      case 'HEAD':
      case 'BODY': {
        const element          = (node     );
        clearContainerSparingly(element);
        // If these singleton instances had previously been rendered with React they
        // may still hold on to references to the previous fiber tree. We detatch them
        // prospectively to reset them to a baseline starting state since we cannot create
        // new instances.
        detachDeletedInstance(element);
        continue;
      }
      // Script tags are retained to avoid an edge case bug. Normally scripts will execute if they
      // are ever inserted into the DOM. However when streaming if a script tag is opened but not
      // yet closed some browsers create and insert the script DOM Node but the script cannot execute
      // yet until the closing tag is parsed. If something causes React to call clearContainer while
      // this DOM node is in the document but not yet executable the DOM node will be removed from the
      // document and when the script closing tag comes in the script will not end up running. This seems
      // to happen in Chrome/Firefox but not Safari at the moment though this is not necessarily specified
      // behavior so it could change in future versions of browsers. While leaving all scripts is broader
      // than strictly necessary this is the least amount of additional code to avoid this breaking
      // edge case.
      //
      // Style tags are retained because they may likely come from 3rd party scripts and extensions
      case 'SCRIPT':
      case 'STYLE': {
        continue;
      }
      // Stylesheet tags are retained because tehy may likely come from 3rd party scripts and extensions
      case 'LINK': {
        if (((node     )                 ).rel.toLowerCase() === 'stylesheet') {
          continue;
        }
      }
    }
    container.removeChild(node);
  }
  return;
}

// Making this so we can eventually move all of the instance caching to the commit phase.
// Currently this is only used to associate fiber and props to instances for hydrating
// HostSingletons. The reason we need it here is we only want to make this binding on commit
// because only one fiber can own the instance at a time and render can fail/restart
export function bindInstance(
  instance          ,
  props       ,
  internalInstanceHandle       ,
) {
  precacheFiberNode((internalInstanceHandle     ), instance);
  updateFiberProps(instance, props);
}

// -------------------
//     Hydration
// -------------------

export const supportsHydration = true;

export function isHydratableText(text        )          {
  return text !== '';
}

export function canHydrateInstance(
  instance                    ,
  type        ,
  props       ,
  inRootOrSingleton         ,
)                  {
  while (instance.nodeType === ELEMENT_NODE) {
    const element          = (instance     );
    const anyProps = (props     );
    if (element.nodeName.toLowerCase() !== type.toLowerCase()) {
      if (!inRootOrSingleton || !enableHostSingletons) {
        // Usually we error for mismatched tags.
        if (
          enableFormActions &&
          element.nodeName === 'INPUT' &&
          (element     ).type === 'hidden'
        ) {
          // If we have extra hidden inputs, we don't mismatch. This allows us to embed
          // extra form data in the original form.
        } else {
          return null;
        }
      }
      // In root or singleton parents we skip past mismatched instances.
    } else if (!inRootOrSingleton || !enableHostSingletons) {
      // Match
      if (
        enableFormActions &&
        type === 'input' &&
        (element     ).type === 'hidden'
      ) {
        if (__DEV__) {
          checkAttributeStringCoercion(anyProps.name, 'name');
        }
        const name = anyProps.name == null ? null : '' + anyProps.name;
        if (
          anyProps.type !== 'hidden' ||
          element.getAttribute('name') !== name
        ) {
          // Skip past hidden inputs unless that's what we're looking for. This allows us
          // embed extra form data in the original form.
        } else {
          return element;
        }
      } else {
        return element;
      }
    } else if (isMarkedHoistable(element)) {
      // We've already claimed this as a hoistable which isn't hydrated this way so we skip past it.
    } else {
      // We have an Element with the right type.

      // We are going to try to exclude it if we can definitely identify it as a hoisted Node or if
      // we can guess that the node is likely hoisted or was inserted by a 3rd party script or browser extension
      // using high entropy attributes for certain types. This technique will fail for strange insertions like
      // extension prepending <div> in the <body> but that already breaks before and that is an edge case.
      switch (type) {
        // case 'title':
        //We assume all titles are matchable. You should only have one in the Document, at least in a hoistable scope
        // and if you are a HostComponent with type title we must either be in an <svg> context or this title must have an `itemProp` prop.
        case 'meta': {
          // The only way to opt out of hoisting meta tags is to give it an itemprop attribute. We assume there will be
          // not 3rd party meta tags that are prepended, accepting the cases where this isn't true because meta tags
          // are usually only functional for SSR so even in a rare case where we did bind to an injected tag the runtime
          // implications are minimal
          if (!element.hasAttribute('itemprop')) {
            // This is a Hoistable
            break;
          }
          return element;
        }
        case 'link': {
          // Links come in many forms and we do expect 3rd parties to inject them into <head> / <body>. We exclude known resources
          // and then use high-entroy attributes like href which are almost always used and almost always unique to filter out unlikely
          // matches.
          const rel = element.getAttribute('rel');
          if (rel === 'stylesheet' && element.hasAttribute('data-precedence')) {
            // This is a stylesheet resource
            break;
          } else if (
            rel !== anyProps.rel ||
            element.getAttribute('href') !==
              (anyProps.href == null ? null : anyProps.href) ||
            element.getAttribute('crossorigin') !==
              (anyProps.crossOrigin == null ? null : anyProps.crossOrigin) ||
            element.getAttribute('title') !==
              (anyProps.title == null ? null : anyProps.title)
          ) {
            // rel + href should usually be enough to uniquely identify a link however crossOrigin can vary for rel preconnect
            // and title could vary for rel alternate
            break;
          }
          return element;
        }
        case 'style': {
          // Styles are hard to match correctly. We can exclude known resources but otherwise we accept the fact that a non-hoisted style tags
          // in <head> or <body> are likely never going to be unmounted given their position in the document and the fact they likely hold global styles
          if (element.hasAttribute('data-precedence')) {
            // This is a style resource
            break;
          }
          return element;
        }
        case 'script': {
          // Scripts are a little tricky, we exclude known resources and then similar to links try to use high-entropy attributes
          // to reject poor matches. One challenge with scripts are inline scripts. We don't attempt to check text content which could
          // in theory lead to a hydration error later if a 3rd party injected an inline script before the React rendered nodes.
          // Falling back to client rendering if this happens should be seemless though so we will try this hueristic and revisit later
          // if we learn it is problematic
          const srcAttr = element.getAttribute('src');
          if (
            srcAttr !== (anyProps.src == null ? null : anyProps.src) ||
            element.getAttribute('type') !==
              (anyProps.type == null ? null : anyProps.type) ||
            element.getAttribute('crossorigin') !==
              (anyProps.crossOrigin == null ? null : anyProps.crossOrigin)
          ) {
            // This script is for a different src/type/crossOrigin. It may be a script resource
            // or it may just be a mistmatch
            if (
              srcAttr &&
              element.hasAttribute('async') &&
              !element.hasAttribute('itemprop')
            ) {
              // This is an async script resource
              break;
            }
          }
          return element;
        }
        default: {
          // We have excluded the most likely cases of mismatch between hoistable tags, 3rd party script inserted tags,
          // and browser extension inserted tags. While it is possible this is not the right match it is a decent hueristic
          // that should work in the vast majority of cases.
          return element;
        }
      }
    }
    const nextInstance = getNextHydratableSibling(element);
    if (nextInstance === null) {
      break;
    }
    instance = nextInstance;
  }
  // This is a suspense boundary or Text node or we got the end.
  // Suspense Boundaries are never expected to be injected by 3rd parties. If we see one it should be matched
  // and this is a hydration error.
  // Text Nodes are also not expected to be injected by 3rd parties. This is less of a guarantee for <body>
  // but it seems reasonable and conservative to reject this as a hydration error as well
  return null;
}

export function canHydrateTextInstance(
  instance                    ,
  text        ,
  inRootOrSingleton         ,
)                      {
  // Empty strings are not parsed by HTML so there won't be a correct match here.
  if (text === '') return null;

  while (instance.nodeType !== TEXT_NODE) {
    if (!inRootOrSingleton || !enableHostSingletons) {
      return null;
    }
    const nextInstance = getNextHydratableSibling(instance);
    if (nextInstance === null) {
      return null;
    }
    instance = nextInstance;
  }
  // This has now been refined to a text node.
  return ((instance     )              );
}

export function canHydrateSuspenseInstance(
  instance                    ,
  inRootOrSingleton         ,
)                          {
  while (instance.nodeType !== COMMENT_NODE) {
    if (!inRootOrSingleton || !enableHostSingletons) {
      return null;
    }
    const nextInstance = getNextHydratableSibling(instance);
    if (nextInstance === null) {
      return null;
    }
    instance = nextInstance;
  }
  // This has now been refined to a suspense node.
  return ((instance     )                  );
}

export function isSuspenseInstancePending(instance                  )          {
  return instance.data === SUSPENSE_PENDING_START_DATA;
}

export function isSuspenseInstanceFallback(
  instance                  ,
)          {
  return instance.data === SUSPENSE_FALLBACK_START_DATA;
}

export function getSuspenseInstanceFallbackErrorDetails(
  instance                  ,
)                                                      {
  const dataset =
    instance.nextSibling && ((instance.nextSibling     )             ).dataset;
  let digest, message, stack;
  if (dataset) {
    digest = dataset.dgst;
    if (__DEV__) {
      message = dataset.msg;
      stack = dataset.stck;
    }
  }
  if (__DEV__) {
    return {
      message,
      digest,
      stack,
    };
  } else {
    // Object gets DCE'd if constructed in tail position and matches callsite destructuring
    return {
      digest,
    };
  }
}

export function registerSuspenseInstanceRetry(
  instance                  ,
  callback            ,
) {
  instance._reactRetry = callback;
}

function getNextHydratable(node       ) {
  // Skip non-hydratable nodes.
  for (; node != null; node = ((node     )      ).nextSibling) {
    const nodeType = node.nodeType;
    if (nodeType === ELEMENT_NODE || nodeType === TEXT_NODE) {
      break;
    }
    if (nodeType === COMMENT_NODE) {
      const nodeData = (node     ).data;
      if (
        nodeData === SUSPENSE_START_DATA ||
        nodeData === SUSPENSE_FALLBACK_START_DATA ||
        nodeData === SUSPENSE_PENDING_START_DATA
      ) {
        break;
      }
      if (nodeData === SUSPENSE_END_DATA) {
        return null;
      }
    }
  }
  return (node     );
}

export function getNextHydratableSibling(
  instance                    ,
)                            {
  return getNextHydratable(instance.nextSibling);
}

export function getFirstHydratableChild(
  parentInstance          ,
)                            {
  return getNextHydratable(parentInstance.firstChild);
}

export function getFirstHydratableChildWithinContainer(
  parentContainer           ,
)                            {
  return getNextHydratable(parentContainer.firstChild);
}

export function getFirstHydratableChildWithinSuspenseInstance(
  parentInstance                  ,
)                            {
  return getNextHydratable(parentInstance.nextSibling);
}

export function hydrateInstance(
  instance          ,
  type        ,
  props       ,
  hostContext             ,
  internalInstanceHandle        ,
  shouldWarnDev         ,
)                      {
  precacheFiberNode(internalInstanceHandle, instance);
  // TODO: Possibly defer this until the commit phase where all the events
  // get attached.
  updateFiberProps(instance, props);

  // TODO: Temporary hack to check if we're in a concurrent root. We can delete
  // when the legacy root API is removed.
  const isConcurrentMode =
    ((internalInstanceHandle       ).mode & ConcurrentMode) !== NoMode;

  return diffHydratedProperties(
    instance,
    type,
    props,
    isConcurrentMode,
    shouldWarnDev,
    hostContext,
  );
}

export function hydrateTextInstance(
  textInstance              ,
  text        ,
  internalInstanceHandle        ,
  shouldWarnDev         ,
)          {
  precacheFiberNode(internalInstanceHandle, textInstance);

  // TODO: Temporary hack to check if we're in a concurrent root. We can delete
  // when the legacy root API is removed.
  const isConcurrentMode =
    ((internalInstanceHandle       ).mode & ConcurrentMode) !== NoMode;

  return diffHydratedText(textInstance, text, isConcurrentMode);
}

export function hydrateSuspenseInstance(
  suspenseInstance                  ,
  internalInstanceHandle        ,
) {
  precacheFiberNode(internalInstanceHandle, suspenseInstance);
}

export function getNextHydratableInstanceAfterSuspenseInstance(
  suspenseInstance                  ,
)                            {
  let node = suspenseInstance.nextSibling;
  // Skip past all nodes within this suspense boundary.
  // There might be nested nodes so we need to keep track of how
  // deep we are and only break out when we're back on top.
  let depth = 0;
  while (node) {
    if (node.nodeType === COMMENT_NODE) {
      const data = ((node     ).data        );
      if (data === SUSPENSE_END_DATA) {
        if (depth === 0) {
          return getNextHydratableSibling((node     ));
        } else {
          depth--;
        }
      } else if (
        data === SUSPENSE_START_DATA ||
        data === SUSPENSE_FALLBACK_START_DATA ||
        data === SUSPENSE_PENDING_START_DATA
      ) {
        depth++;
      }
    }
    node = node.nextSibling;
  }
  // TODO: Warn, we didn't find the end comment boundary.
  return null;
}

// Returns the SuspenseInstance if this node is a direct child of a
// SuspenseInstance. I.e. if its previous sibling is a Comment with
// SUSPENSE_x_START_DATA. Otherwise, null.
export function getParentSuspenseInstance(
  targetInstance      ,
)                          {
  let node = targetInstance.previousSibling;
  // Skip past all nodes within this suspense boundary.
  // There might be nested nodes so we need to keep track of how
  // deep we are and only break out when we're back on top.
  let depth = 0;
  while (node) {
    if (node.nodeType === COMMENT_NODE) {
      const data = ((node     ).data        );
      if (
        data === SUSPENSE_START_DATA ||
        data === SUSPENSE_FALLBACK_START_DATA ||
        data === SUSPENSE_PENDING_START_DATA
      ) {
        if (depth === 0) {
          return ((node     )                  );
        } else {
          depth--;
        }
      } else if (data === SUSPENSE_END_DATA) {
        depth++;
      }
    }
    node = node.previousSibling;
  }
  return null;
}

export function commitHydratedContainer(container           )       {
  // Retry if any event replaying was blocked on this.
  retryIfBlockedOn(container);
}

export function commitHydratedSuspenseInstance(
  suspenseInstance                  ,
)       {
  // Retry if any event replaying was blocked on this.
  retryIfBlockedOn(suspenseInstance);
}

export function shouldDeleteUnhydratedTailInstances(
  parentType        ,
)          {
  return (
    (enableHostSingletons ||
      (parentType !== 'head' && parentType !== 'body')) &&
    (!enableFormActions || (parentType !== 'form' && parentType !== 'button'))
  );
}

export function didNotMatchHydratedContainerTextInstance(
  parentContainer           ,
  textInstance              ,
  text        ,
  isConcurrentMode         ,
  shouldWarnDev         ,
) {
  checkForUnmatchedText(
    textInstance.nodeValue,
    text,
    isConcurrentMode,
    shouldWarnDev,
  );
}

export function didNotMatchHydratedTextInstance(
  parentType        ,
  parentProps       ,
  parentInstance          ,
  textInstance              ,
  text        ,
  isConcurrentMode         ,
  shouldWarnDev         ,
) {
  if (parentProps[SUPPRESS_HYDRATION_WARNING] !== true) {
    checkForUnmatchedText(
      textInstance.nodeValue,
      text,
      isConcurrentMode,
      shouldWarnDev,
    );
  }
}

export function didNotHydrateInstanceWithinContainer(
  parentContainer           ,
  instance                    ,
) {
  if (__DEV__) {
    if (instance.nodeType === ELEMENT_NODE) {
      warnForDeletedHydratableElement(parentContainer, (instance     ));
    } else if (instance.nodeType === COMMENT_NODE) {
      // TODO: warnForDeletedHydratableSuspenseBoundary
    } else {
      warnForDeletedHydratableText(parentContainer, (instance     ));
    }
  }
}

export function didNotHydrateInstanceWithinSuspenseInstance(
  parentInstance                  ,
  instance                    ,
) {
  if (__DEV__) {
    // $FlowFixMe[incompatible-type]: Only Element or Document can be parent nodes.
    const parentNode                            = parentInstance.parentNode;
    if (parentNode !== null) {
      if (instance.nodeType === ELEMENT_NODE) {
        warnForDeletedHydratableElement(parentNode, (instance     ));
      } else if (instance.nodeType === COMMENT_NODE) {
        // TODO: warnForDeletedHydratableSuspenseBoundary
      } else {
        warnForDeletedHydratableText(parentNode, (instance     ));
      }
    }
  }
}

export function didNotHydrateInstance(
  parentType        ,
  parentProps       ,
  parentInstance          ,
  instance                    ,
  isConcurrentMode         ,
) {
  if (__DEV__) {
    if (isConcurrentMode || parentProps[SUPPRESS_HYDRATION_WARNING] !== true) {
      if (instance.nodeType === ELEMENT_NODE) {
        warnForDeletedHydratableElement(parentInstance, (instance     ));
      } else if (instance.nodeType === COMMENT_NODE) {
        // TODO: warnForDeletedHydratableSuspenseBoundary
      } else {
        warnForDeletedHydratableText(parentInstance, (instance     ));
      }
    }
  }
}

export function didNotFindHydratableInstanceWithinContainer(
  parentContainer           ,
  type        ,
  props       ,
) {
  if (__DEV__) {
    warnForInsertedHydratedElement(parentContainer, type, props);
  }
}

export function didNotFindHydratableTextInstanceWithinContainer(
  parentContainer           ,
  text        ,
) {
  if (__DEV__) {
    warnForInsertedHydratedText(parentContainer, text);
  }
}

export function didNotFindHydratableSuspenseInstanceWithinContainer(
  parentContainer           ,
) {
  if (__DEV__) {
    // TODO: warnForInsertedHydratedSuspense(parentContainer);
  }
}

export function didNotFindHydratableInstanceWithinSuspenseInstance(
  parentInstance                  ,
  type        ,
  props       ,
) {
  if (__DEV__) {
    // $FlowFixMe[incompatible-type]: Only Element or Document can be parent nodes.
    const parentNode                            = parentInstance.parentNode;
    if (parentNode !== null)
      warnForInsertedHydratedElement(parentNode, type, props);
  }
}

export function didNotFindHydratableTextInstanceWithinSuspenseInstance(
  parentInstance                  ,
  text        ,
) {
  if (__DEV__) {
    // $FlowFixMe[incompatible-type]: Only Element or Document can be parent nodes.
    const parentNode                            = parentInstance.parentNode;
    if (parentNode !== null) warnForInsertedHydratedText(parentNode, text);
  }
}

export function didNotFindHydratableSuspenseInstanceWithinSuspenseInstance(
  parentInstance                  ,
) {
  if (__DEV__) {
    // const parentNode: Element | Document | null = parentInstance.parentNode;
    // TODO: warnForInsertedHydratedSuspense(parentNode);
  }
}

export function didNotFindHydratableInstance(
  parentType        ,
  parentProps       ,
  parentInstance          ,
  type        ,
  props       ,
  isConcurrentMode         ,
) {
  if (__DEV__) {
    if (isConcurrentMode || parentProps[SUPPRESS_HYDRATION_WARNING] !== true) {
      warnForInsertedHydratedElement(parentInstance, type, props);
    }
  }
}

export function didNotFindHydratableTextInstance(
  parentType        ,
  parentProps       ,
  parentInstance          ,
  text        ,
  isConcurrentMode         ,
) {
  if (__DEV__) {
    if (isConcurrentMode || parentProps[SUPPRESS_HYDRATION_WARNING] !== true) {
      warnForInsertedHydratedText(parentInstance, text);
    }
  }
}

export function didNotFindHydratableSuspenseInstance(
  parentType        ,
  parentProps       ,
  parentInstance          ,
) {
  if (__DEV__) {
    // TODO: warnForInsertedHydratedSuspense(parentInstance);
  }
}

export function errorHydratingContainer(parentContainer           )       {
  if (__DEV__) {
    // TODO: This gets logged by onRecoverableError, too, so we should be
    // able to remove it.
    console.error(
      'An error occurred during hydration. The server HTML was replaced with client content in <%s>.',
      parentContainer.nodeName.toLowerCase(),
    );
  }
}

// -------------------
//     Test Selectors
// -------------------

export const supportsTestSelectors = true;

export function findFiberRoot(node          )                   {
  const stack = [node];
  let index = 0;
  while (index < stack.length) {
    const current = stack[index++];
    if (isContainerMarkedAsRoot(current)) {
      return ((getInstanceFromNodeDOMTree(current)     )           );
    }
    stack.push(...current.children);
  }
  return null;
}

export function getBoundingRect(node          )               {
  const rect = node.getBoundingClientRect();
  return {
    x: rect.left,
    y: rect.top,
    width: rect.width,
    height: rect.height,
  };
}

export function matchAccessibilityRole(node          , role        )          {
  if (hasRole(node, role)) {
    return true;
  }

  return false;
}

export function getTextContent(fiber       )                {
  switch (fiber.tag) {
    case HostHoistable:
    case HostSingleton:
    case HostComponent:
      let textContent = '';
      const childNodes = fiber.stateNode.childNodes;
      for (let i = 0; i < childNodes.length; i++) {
        const childNode = childNodes[i];
        if (childNode.nodeType === Node.TEXT_NODE) {
          textContent += childNode.textContent;
        }
      }
      return textContent;
    case HostText:
      return fiber.stateNode.textContent;
  }

  return null;
}

export function isHiddenSubtree(fiber       )          {
  return fiber.tag === HostComponent && fiber.memoizedProps.hidden === true;
}

export function setFocusIfFocusable(node          )          {
  // The logic for determining if an element is focusable is kind of complex,
  // and since we want to actually change focus anyway- we can just skip it.
  // Instead we'll just listen for a "focus" event to verify that focus was set.
  //
  // We could compare the node to document.activeElement after focus,
  // but this would not handle the case where application code managed focus to automatically blur.
  let didFocus = false;
  const handleFocus = () => {
    didFocus = true;
  };

  const element = ((node     )             );
  try {
    element.addEventListener('focus', handleFocus);
    // $FlowFixMe[method-unbinding]
    (element.focus || HTMLElement.prototype.focus).call(element);
  } finally {
    element.removeEventListener('focus', handleFocus);
  }

  return didFocus;
}

                  
                
                     
  

export function setupIntersectionObserver(
  targets                 ,
  callback                             ,
  options                              ,
)   
                         
                                        
                                          
  {
  const rectRatioCache                           = new Map();
  targets.forEach(target => {
    rectRatioCache.set(target, {
      rect: getBoundingRect(target),
      ratio: 0,
    });
  });

  const handleIntersection = (entries                                  ) => {
    entries.forEach(entry => {
      const {boundingClientRect, intersectionRatio, target} = entry;
      rectRatioCache.set(target, {
        rect: {
          x: boundingClientRect.left,
          y: boundingClientRect.top,
          width: boundingClientRect.width,
          height: boundingClientRect.height,
        },
        ratio: intersectionRatio,
      });
    });

    callback(Array.from(rectRatioCache.values()));
  };

  const observer = new IntersectionObserver(handleIntersection, options);
  targets.forEach(target => {
    observer.observe((target     ));
  });

  return {
    disconnect: () => observer.disconnect(),
    observe: target => {
      rectRatioCache.set(target, {
        rect: getBoundingRect(target),
        ratio: 0,
      });
      observer.observe((target     ));
    },
    unobserve: target => {
      rectRatioCache.delete(target);
      observer.unobserve((target     ));
    },
  };
}

export function requestPostPaintCallback(callback                        ) {
  localRequestAnimationFrame(() => {
    localRequestAnimationFrame(time => callback(time));
  });
}

// -------------------
//     Singletons
// -------------------

export const supportsSingletons = true;

export function isHostSingletonType(type        )          {
  return type === 'html' || type === 'head' || type === 'body';
}

export function resolveSingletonInstance(
  type        ,
  props       ,
  rootContainerInstance           ,
  hostContext             ,
  validateDOMNestingDev         ,
)           {
  if (__DEV__) {
    const hostContextDev = ((hostContext     )                );
    if (validateDOMNestingDev) {
      validateDOMNesting(type, hostContextDev.ancestorInfo);
    }
  }
  const ownerDocument = getOwnerDocumentFromRootContainer(
    rootContainerInstance,
  );
  switch (type) {
    case 'html': {
      const documentElement = ownerDocument.documentElement;
      if (!documentElement) {
        throw new Error(
          'React expected an <html> element (document.documentElement) to exist in the Document but one was' +
            ' not found. React never removes the documentElement for any Document it renders into so' +
            ' the cause is likely in some other script running on this page.',
        );
      }
      return documentElement;
    }
    case 'head': {
      const head = ownerDocument.head;
      if (!head) {
        throw new Error(
          'React expected a <head> element (document.head) to exist in the Document but one was' +
            ' not found. React never removes the head for any Document it renders into so' +
            ' the cause is likely in some other script running on this page.',
        );
      }
      return head;
    }
    case 'body': {
      const body = ownerDocument.body;
      if (!body) {
        throw new Error(
          'React expected a <body> element (document.body) to exist in the Document but one was' +
            ' not found. React never removes the body for any Document it renders into so' +
            ' the cause is likely in some other script running on this page.',
        );
      }
      return body;
    }
    default: {
      throw new Error(
        'resolveSingletonInstance was called with an element type that is not supported. This is a bug in React.',
      );
    }
  }
}

export function acquireSingletonInstance(
  type        ,
  props       ,
  instance          ,
  internalInstanceHandle        ,
)       {
  if (__DEV__) {
    const currentInstanceHandle = getInstanceFromNodeDOMTree(instance);
    if (currentInstanceHandle) {
      const tagName = instance.tagName.toLowerCase();
      console.error(
        'You are mounting a new %s component when a previous one has not first unmounted. It is an' +
          ' error to render more than one %s component at a time and attributes and children of these' +
          ' components will likely fail in unpredictable ways. Please only render a single instance of' +
          ' <%s> and if you need to mount a new one, ensure any previous ones have unmounted first.',
        tagName,
        tagName,
        tagName,
      );
    }
    switch (type) {
      case 'html':
      case 'head':
      case 'body': {
        break;
      }
      default: {
        console.error(
          'acquireSingletonInstance was called with an element type that is not supported. This is a bug in React.',
        );
      }
    }
  }

  const attributes = instance.attributes;
  while (attributes.length) {
    instance.removeAttributeNode(attributes[0]);
  }

  setInitialProperties(instance, type, props);
  precacheFiberNode(internalInstanceHandle, instance);
  updateFiberProps(instance, props);
}

export function releaseSingletonInstance(instance          )       {
  const attributes = instance.attributes;
  while (attributes.length) {
    instance.removeAttributeNode(attributes[0]);
  }
  detachDeletedInstance(instance);
}

export function clearSingleton(instance          )       {
  const element          = (instance     );
  let node = element.firstChild;
  while (node) {
    const nextNode = node.nextSibling;
    const nodeName = node.nodeName;
    if (
      isMarkedHoistable(node) ||
      nodeName === 'HEAD' ||
      nodeName === 'BODY' ||
      nodeName === 'SCRIPT' ||
      nodeName === 'STYLE' ||
      (nodeName === 'LINK' &&
        ((node     )                 ).rel.toLowerCase() === 'stylesheet')
    ) {
      // retain these nodes
    } else {
      element.removeChild(node);
    }
    node = nextNode;
  }
  return;
}

// -------------------
//     Resources
// -------------------

export const supportsResources = true;

                                                  
               
                                                
                  
     
          
                            
                
           
  
                                                                   
                                                 
                                                           
                                                
                                            
                                                                     

                           
const NotLoaded = /*       */ 0b000;
const Loaded = /*          */ 0b001;
const Errored = /*         */ 0b010;
const Settled = /*         */ 0b011;
const Inserted = /*        */ 0b100;

                        
                        
                                  
  

                      
                      
                            
                  
  
                        
                    
               
                            
                  
  

                    
              
              
                  
  

                     
                 
                
                  
  

                             
                                              
                                                
  

export function prepareToCommitHoistables() {
  tagCaches = null;
}

// global collections of Resources
const preloadPropsMap                            = new Map();
const preconnectsSet              = new Set();

                                                  

// getRootNode is missing from IE and old jsdom versions
export function getHoistableRoot(container           )                {
  // $FlowFixMe[method-unbinding]
  return typeof container.getRootNode === 'function'
    ? /* $FlowFixMe[incompatible-return] Flow types this as returning a `Node`,
       * but it's either a `Document` or `ShadowRoot`. */
      container.getRootNode()
    : container.ownerDocument;
}

function getCurrentResourceRoot()                       {
  const currentContainer = getCurrentRootHostContainer();
  return currentContainer ? getHoistableRoot(currentContainer) : null;
}

function getDocumentFromRoot(root               )           {
  return root.ownerDocument || root;
}

// We want this to be the default dispatcher on ReactDOMSharedInternals but we don't want to mutate
// internals in Module scope. Instead we export it and Internals will import it. There is already a cycle
// from Internals -> ReactDOM -> HostConfig -> Internals so this doesn't introduce a new one.
export const ReactDOMClientDispatcher                 = {
  prefetchDNS,
  preconnect,
  preload,
  preinit,
};

// We expect this to get inlined. It is a function mostly to communicate the special nature of
// how we resolve the HoistableRoot for ReactDOM.pre*() methods. Because we support calling
// these methods outside of render there is no way to know which Document or ShadowRoot is 'scoped'
// and so we have to fall back to something universal. Currently we just refer to the global document.
// This is notable because nowhere else in ReactDOM do we actually reference the global document or window
// because we may be rendering inside an iframe.
function getDocumentForImperativeFloatMethods()           {
  return document;
}

function preconnectAs(
  rel                               ,
  crossOrigin                               ,
  href        ,
) {
  const ownerDocument = getDocumentForImperativeFloatMethods();
  if (typeof href === 'string' && href) {
    const limitedEscapedHref =
      escapeSelectorAttributeValueInsideDoubleQuotes(href);
    let key = `link[rel="${rel}"][href="${limitedEscapedHref}"]`;
    if (typeof crossOrigin === 'string') {
      key += `[crossorigin="${crossOrigin}"]`;
    }
    if (!preconnectsSet.has(key)) {
      preconnectsSet.add(key);

      const preconnectProps = {rel, crossOrigin, href};
      if (null === ownerDocument.querySelector(key)) {
        const instance = ownerDocument.createElement('link');
        setInitialProperties(instance, 'link', preconnectProps);
        markNodeAsHoistable(instance);
        (ownerDocument.head     ).appendChild(instance);
      }
    }
  }
}

function prefetchDNS(href        , options                      ) {
  if (!enableFloat) {
    return;
  }
  if (__DEV__) {
    if (typeof href !== 'string' || !href) {
      console.error(
        'ReactDOM.prefetchDNS(): Expected the `href` argument (first) to be a non-empty string but encountered %s instead.',
        getValueDescriptorExpectingObjectForWarning(href),
      );
    } else if (options != null) {
      if (
        typeof options === 'object' &&
        hasOwnProperty.call(options, 'crossOrigin')
      ) {
        console.error(
          'ReactDOM.prefetchDNS(): Expected only one argument, `href`, but encountered %s as a second argument instead. This argument is reserved for future options and is currently disallowed. It looks like the you are attempting to set a crossOrigin property for this DNS lookup hint. Browsers do not perform DNS queries using CORS and setting this attribute on the resource hint has no effect. Try calling ReactDOM.prefetchDNS() with just a single string argument, `href`.',
          getValueDescriptorExpectingEnumForWarning(options),
        );
      } else {
        console.error(
          'ReactDOM.prefetchDNS(): Expected only one argument, `href`, but encountered %s as a second argument instead. This argument is reserved for future options and is currently disallowed. Try calling ReactDOM.prefetchDNS() with just a single string argument, `href`.',
          getValueDescriptorExpectingEnumForWarning(options),
        );
      }
    }
  }
  preconnectAs('dns-prefetch', null, href);
}

function preconnect(href        , options                     ) {
  if (!enableFloat) {
    return;
  }
  if (__DEV__) {
    if (typeof href !== 'string' || !href) {
      console.error(
        'ReactDOM.preconnect(): Expected the `href` argument (first) to be a non-empty string but encountered %s instead.',
        getValueDescriptorExpectingObjectForWarning(href),
      );
    } else if (options != null && typeof options !== 'object') {
      console.error(
        'ReactDOM.preconnect(): Expected the `options` argument (second) to be an object but encountered %s instead. The only supported option at this time is `crossOrigin` which accepts a string.',
        getValueDescriptorExpectingEnumForWarning(options),
      );
    } else if (options != null && typeof options.crossOrigin !== 'string') {
      console.error(
        'ReactDOM.preconnect(): Expected the `crossOrigin` option (second argument) to be a string but encountered %s instead. Try removing this option or passing a string value instead.',
        getValueDescriptorExpectingObjectForWarning(options.crossOrigin),
      );
    }
  }
  const crossOrigin =
    options == null || typeof options.crossOrigin !== 'string'
      ? null
      : options.crossOrigin === 'use-credentials'
      ? 'use-credentials'
      : '';
  preconnectAs('preconnect', crossOrigin, href);
}

function preload(href        , options                ) {
  if (!enableFloat) {
    return;
  }
  if (__DEV__) {
    // TODO move this to ReactDOMFloat and expose a stricter function interface or possibly
    // typed functions (preloadImage, preloadStyle, ...)
    let encountered = '';
    if (typeof href !== 'string' || !href) {
      encountered += `The \`href\` argument encountered was ${getValueDescriptorExpectingObjectForWarning(
        href,
      )}.`;
    }
    if (options == null || typeof options !== 'object') {
      encountered += `The \`options\` argument encountered was ${getValueDescriptorExpectingObjectForWarning(
        options,
      )}.`;
    } else if (typeof options.as !== 'string' || !options.as) {
      encountered += `The \`as\` option encountered was ${getValueDescriptorExpectingObjectForWarning(
        options.as,
      )}.`;
    }
    if (encountered) {
      console.error(
        'ReactDOM.preload(): Expected two arguments, a non-empty `href` string and an `options` object with an `as` property valid for a `<link rel="preload" as="..." />` tag. %s',
        encountered,
      );
    }
  }
  const ownerDocument = getDocumentForImperativeFloatMethods();
  if (
    typeof href === 'string' &&
    href &&
    typeof options === 'object' &&
    options !== null &&
    typeof options.as === 'string' &&
    options.as &&
    ownerDocument
  ) {
    const as = options.as;
    let preloadSelector = `link[rel="preload"][as="${escapeSelectorAttributeValueInsideDoubleQuotes(
      as,
    )}"]`;
    if (as === 'image') {
      const {imageSrcSet, imageSizes} = options;
      if (typeof imageSrcSet === 'string' && imageSrcSet !== '') {
        preloadSelector += `[imagesrcset="${escapeSelectorAttributeValueInsideDoubleQuotes(
          imageSrcSet,
        )}"]`;
        if (typeof imageSizes === 'string') {
          preloadSelector += `[imagesizes="${escapeSelectorAttributeValueInsideDoubleQuotes(
            imageSizes,
          )}"]`;
        }
      } else {
        preloadSelector += `[href="${escapeSelectorAttributeValueInsideDoubleQuotes(
          href,
        )}"]`;
      }
    } else {
      preloadSelector += `[href="${escapeSelectorAttributeValueInsideDoubleQuotes(
        href,
      )}"]`;
    }
    // Some preloads are keyed under their selector. This happens when the preload is for
    // an arbitrary type. Other preloads are keyed under the resource key they represent a preload for.
    // Here we figure out which key to use to determine if we have a preload already.
    let key = preloadSelector;
    switch (as) {
      case 'style':
        key = getStyleKey(href);
        break;
      case 'script':
        key = getScriptKey(href);
        break;
    }
    if (!preloadPropsMap.has(key)) {
      const preloadProps = preloadPropsFromPreloadOptions(href, as, options);
      preloadPropsMap.set(key, preloadProps);

      if (null === ownerDocument.querySelector(preloadSelector)) {
        if (
          as === 'style' &&
          ownerDocument.querySelector(getStylesheetSelectorFromKey(key))
        ) {
          // We already have a stylesheet for this key. We don't need to preload it.
          return;
        } else if (
          as === 'script' &&
          ownerDocument.querySelector(getScriptSelectorFromKey(key))
        ) {
          // We already have a stylesheet for this key. We don't need to preload it.
          return;
        }
        const instance = ownerDocument.createElement('link');
        setInitialProperties(instance, 'link', preloadProps);
        markNodeAsHoistable(instance);
        (ownerDocument.head     ).appendChild(instance);
      }
    }
  }
}

function preloadPropsFromPreloadOptions(
  href        ,
  as        ,
  options                ,
)               {
  return {
    rel: 'preload',
    as,
    // There is a bug in Safari where imageSrcSet is not respected on preload links
    // so we omit the href here if we have imageSrcSet b/c safari will load the wrong image.
    // This harms older browers that do not support imageSrcSet by making their preloads not work
    // but this population is shrinking fast and is already small so we accept this tradeoff.
    href: as === 'image' && options.imageSrcSet ? undefined : href,
    crossOrigin: as === 'font' ? '' : options.crossOrigin,
    integrity: options.integrity,
    type: options.type,
    nonce: options.nonce,
    fetchPriority: options.fetchPriority,
    imageSrcSet: options.imageSrcSet,
    imageSizes: options.imageSizes,
    referrerPolicy: options.referrerPolicy,
  };
}

function preinit(href        , options                ) {
  if (!enableFloat) {
    return;
  }
  if (__DEV__) {
    validatePreinitArguments(href, options);
  }
  const ownerDocument = getDocumentForImperativeFloatMethods();

  if (
    typeof href === 'string' &&
    href &&
    typeof options === 'object' &&
    options !== null
  ) {
    const as = options.as;

    switch (as) {
      case 'style': {
        const styles = getResourcesFromRoot(ownerDocument).hoistableStyles;

        const key = getStyleKey(href);
        const precedence = options.precedence || 'default';

        // Check if this resource already exists
        let resource = styles.get(key);
        if (resource) {
          // We can early return. The resource exists and there is nothing
          // more to do
          return;
        }

        const state = {
          loading: NotLoaded,
          preload: null,
        };

        // Attempt to hydrate instance from DOM
        let instance                  = ownerDocument.querySelector(
          getStylesheetSelectorFromKey(key),
        );
        if (instance) {
          state.loading = Loaded;
        } else {
          // Construct a new instance and insert it
          const stylesheetProps = stylesheetPropsFromPreinitOptions(
            href,
            precedence,
            options,
          );
          const preloadProps = preloadPropsMap.get(key);
          if (preloadProps) {
            adoptPreloadPropsForStylesheet(stylesheetProps, preloadProps);
          }
          const link = (instance = ownerDocument.createElement('link'));
          markNodeAsHoistable(link);
          setInitialProperties(link, 'link', stylesheetProps);

          (link     )._p = new Promise((resolve, reject) => {
            link.onload = resolve;
            link.onerror = reject;
          });
          link.addEventListener('load', () => {
            state.loading |= Loaded;
          });
          link.addEventListener('error', () => {
            state.loading |= Errored;
          });

          state.loading |= Inserted;
          insertStylesheet(instance, precedence, ownerDocument);
        }

        // Construct a Resource and cache it
        resource = {
          type: 'stylesheet',
          instance,
          count: 1,
          state,
        };
        styles.set(key, resource);
        return;
      }
      case 'script': {
        const src = href;
        const scripts = getResourcesFromRoot(ownerDocument).hoistableScripts;

        const key = getScriptKey(src);

        // Check if this resource already exists
        let resource = scripts.get(key);
        if (resource) {
          // We can early return. The resource exists and there is nothing
          // more to do
          return;
        }

        // Attempt to hydrate instance from DOM
        let instance                  = ownerDocument.querySelector(
          getScriptSelectorFromKey(key),
        );
        if (!instance) {
          // Construct a new instance and insert it
          const scriptProps = scriptPropsFromPreinitOptions(src, options);
          // Adopt certain preload props
          const preloadProps = preloadPropsMap.get(key);
          if (preloadProps) {
            adoptPreloadPropsForScript(scriptProps, preloadProps);
          }
          instance = ownerDocument.createElement('script');
          markNodeAsHoistable(instance);
          setInitialProperties(instance, 'link', scriptProps);
          (ownerDocument.head     ).appendChild(instance);
        }

        // Construct a Resource and cache it
        resource = {
          type: 'script',
          instance,
          count: 1,
          state: null,
        };
        scripts.set(key, resource);
        return;
      }
    }
  }
}

function stylesheetPropsFromPreinitOptions(
  href        ,
  precedence        ,
  options                ,
)                  {
  return {
    rel: 'stylesheet',
    href,
    'data-precedence': precedence,
    crossOrigin: options.crossOrigin,
    integrity: options.integrity,
    fetchPriority: options.fetchPriority,
  };
}

function scriptPropsFromPreinitOptions(
  src        ,
  options                ,
)              {
  return {
    src,
    async: true,
    crossOrigin: options.crossOrigin,
    integrity: options.integrity,
    nonce: options.nonce,
    fetchPriority: options.fetchPriority,
  };
}

                                
               
                     
                  
  

                                  
                    
               
                     
                  
  

// This function is called in begin work and we should always have a currentDocument set
export function getResource(
  type        ,
  currentProps     ,
  pendingProps     ,
)                  {
  const resourceRoot = getCurrentResourceRoot();
  if (!resourceRoot) {
    throw new Error(
      '"resourceRoot" was expected to exist. This is a bug in React.',
    );
  }
  switch (type) {
    case 'meta':
    case 'title': {
      return null;
    }
    case 'style': {
      if (
        typeof pendingProps.precedence === 'string' &&
        typeof pendingProps.href === 'string'
      ) {
        const key = getStyleKey(pendingProps.href);
        const styles = getResourcesFromRoot(resourceRoot).hoistableStyles;
        let resource = styles.get(key);
        if (!resource) {
          resource = {
            type: 'style',
            instance: null,
            count: 0,
            state: null,
          };
          styles.set(key, resource);
        }
        return resource;
      }
      return {
        type: 'void',
        instance: null,
        count: 0,
        state: null,
      };
    }
    case 'link': {
      if (
        pendingProps.rel === 'stylesheet' &&
        typeof pendingProps.href === 'string' &&
        typeof pendingProps.precedence === 'string'
      ) {
        const qualifiedProps                            = pendingProps;
        const key = getStyleKey(qualifiedProps.href);

        const styles = getResourcesFromRoot(resourceRoot).hoistableStyles;

        let resource = styles.get(key);
        if (!resource) {
          // We asserted this above but Flow can't figure out that the type satisfies
          const ownerDocument = getDocumentFromRoot(resourceRoot);
          resource = {
            type: 'stylesheet',
            instance: null,
            count: 0,
            state: {
              loading: NotLoaded,
              preload: null,
            },
          };
          styles.set(key, resource);
          if (!preloadPropsMap.has(key)) {
            preloadStylesheet(
              ownerDocument,
              key,
              preloadPropsFromStylesheet(qualifiedProps),
              resource.state,
            );
          }
        }
        return resource;
      }
      return null;
    }
    case 'script': {
      if (typeof pendingProps.src === 'string' && pendingProps.async === true) {
        const scriptProps              = pendingProps;
        const key = getScriptKey(scriptProps.src);
        const scripts = getResourcesFromRoot(resourceRoot).hoistableScripts;

        let resource = scripts.get(key);
        if (!resource) {
          resource = {
            type: 'script',
            instance: null,
            count: 0,
            state: null,
          };
          scripts.set(key, resource);
        }
        return resource;
      }
      return {
        type: 'void',
        instance: null,
        count: 0,
        state: null,
      };
    }
    default: {
      throw new Error(
        `getResource encountered a type it did not expect: "${type}". this is a bug in React.`,
      );
    }
  }
}

function styleTagPropsFromRawProps(
  rawProps                         ,
)                {
  return {
    ...rawProps,
    'data-href': rawProps.href,
    'data-precedence': rawProps.precedence,
    href: null,
    precedence: null,
  };
}

function getStyleKey(href        ) {
  const limitedEscapedHref =
    escapeSelectorAttributeValueInsideDoubleQuotes(href);
  return `href="${limitedEscapedHref}"`;
}

function getStyleTagSelector(href        ) {
  const limitedEscapedHref =
    escapeSelectorAttributeValueInsideDoubleQuotes(href);
  return `style[data-href~="${limitedEscapedHref}"]`;
}

function getStylesheetSelectorFromKey(key        ) {
  return `link[rel="stylesheet"][${key}]`;
}

function getPreloadStylesheetSelectorFromKey(key        ) {
  return `link[rel="preload"][as="style"][${key}]`;
}

function stylesheetPropsFromRawProps(
  rawProps                           ,
)                  {
  return {
    ...rawProps,
    'data-precedence': rawProps.precedence,
    precedence: null,
  };
}
function preloadStylesheet(
  ownerDocument          ,
  key        ,
  preloadProps              ,
  state                 ,
) {
  preloadPropsMap.set(key, preloadProps);

  if (!ownerDocument.querySelector(getStylesheetSelectorFromKey(key))) {
    // There is no matching stylesheet instance in the Document.
    // We will insert a preload now to kick off loading because
    // we expect this stylesheet to commit
    const preloadEl = ownerDocument.querySelector(
      getPreloadStylesheetSelectorFromKey(key),
    );
    if (preloadEl) {
      // If we find a preload already it was SSR'd and we won't have an actual
      // loading state to track. For now we will just assume it is loaded
      state.loading = Loaded;
    } else {
      const instance = ownerDocument.createElement('link');
      state.preload = instance;
      instance.addEventListener('load', () => (state.loading |= Loaded));
      instance.addEventListener('error', () => (state.loading |= Errored));
      setInitialProperties(instance, 'link', preloadProps);
      markNodeAsHoistable(instance);
      (ownerDocument.head     ).appendChild(instance);
    }
  }
}

function preloadPropsFromStylesheet(
  props                           ,
)               {
  return {
    rel: 'preload',
    as: 'style',
    href: props.href,
    crossOrigin: props.crossOrigin,
    integrity: props.integrity,
    media: props.media,
    hrefLang: props.hrefLang,
    referrerPolicy: props.referrerPolicy,
  };
}

function getScriptKey(src        )         {
  const limitedEscapedSrc = escapeSelectorAttributeValueInsideDoubleQuotes(src);
  return `[src="${limitedEscapedSrc}"]`;
}

function getScriptSelectorFromKey(key        )         {
  return 'script[async]' + key;
}

export function acquireResource(
  hoistableRoot               ,
  resource          ,
  props     ,
)                  {
  resource.count++;
  if (resource.instance === null) {
    switch (resource.type) {
      case 'style': {
        const qualifiedProps                          = props;

        // Attempt to hydrate instance from DOM
        let instance                  = hoistableRoot.querySelector(
          getStyleTagSelector(qualifiedProps.href),
        );
        if (instance) {
          resource.instance = instance;
          markNodeAsHoistable(instance);
          return instance;
        }

        const styleProps = styleTagPropsFromRawProps(props);
        const ownerDocument = getDocumentFromRoot(hoistableRoot);
        instance = ownerDocument.createElement('style');

        markNodeAsHoistable(instance);
        setInitialProperties(instance, 'style', styleProps);

        // TODO: `style` does not have loading state for tracking insertions. I
        // guess because these aren't suspensey? Not sure whether this is a
        // factoring smell.
        // resource.state.loading |= Inserted;
        insertStylesheet(instance, qualifiedProps.precedence, hoistableRoot);
        resource.instance = instance;

        return instance;
      }
      case 'stylesheet': {
        // This typing is enforce by `getResource`. If we change the logic
        // there for what qualifies as a stylesheet resource we need to ensure
        // this cast still makes sense;
        const qualifiedProps                            = props;
        const key = getStyleKey(qualifiedProps.href);

        // Attempt to hydrate instance from DOM
        let instance                  = hoistableRoot.querySelector(
          getStylesheetSelectorFromKey(key),
        );
        if (instance) {
          resource.instance = instance;
          markNodeAsHoistable(instance);
          return instance;
        }

        const stylesheetProps = stylesheetPropsFromRawProps(props);
        const preloadProps = preloadPropsMap.get(key);
        if (preloadProps) {
          adoptPreloadPropsForStylesheet(stylesheetProps, preloadProps);
        }

        // Construct and insert a new instance
        const ownerDocument = getDocumentFromRoot(hoistableRoot);
        instance = ownerDocument.createElement('link');
        markNodeAsHoistable(instance);
        const linkInstance                  = (instance     );
        (linkInstance     )._p = new Promise((resolve, reject) => {
          linkInstance.onload = resolve;
          linkInstance.onerror = reject;
        });
        setInitialProperties(instance, 'link', stylesheetProps);
        resource.state.loading |= Inserted;
        insertStylesheet(instance, qualifiedProps.precedence, hoistableRoot);
        resource.instance = instance;

        return instance;
      }
      case 'script': {
        // This typing is enforce by `getResource`. If we change the logic
        // there for what qualifies as a stylesheet resource we need to ensure
        // this cast still makes sense;
        const borrowedScriptProps              = props;
        const key = getScriptKey(borrowedScriptProps.src);

        // Attempt to hydrate instance from DOM
        let instance                  = hoistableRoot.querySelector(
          getScriptSelectorFromKey(key),
        );
        if (instance) {
          resource.instance = instance;
          markNodeAsHoistable(instance);
          return instance;
        }

        let scriptProps = borrowedScriptProps;
        const preloadProps = preloadPropsMap.get(key);
        if (preloadProps) {
          scriptProps = {...borrowedScriptProps};
          adoptPreloadPropsForScript(scriptProps, preloadProps);
        }

        // Construct and insert a new instance
        const ownerDocument = getDocumentFromRoot(hoistableRoot);
        instance = ownerDocument.createElement('script');
        markNodeAsHoistable(instance);
        setInitialProperties(instance, 'link', scriptProps);
        (ownerDocument.head     ).appendChild(instance);
        resource.instance = instance;

        return instance;
      }
      case 'void': {
        return null;
      }
      default: {
        throw new Error(
          `acquireResource encountered a resource type it did not expect: "${resource.type}". this is a bug in React.`,
        );
      }
    }
  } else {
    // In the case of stylesheets, they might have already been assigned an
    // instance during `suspendResource`. But that doesn't mean they were
    // inserted, because the commit might have been interrupted. So we need to
    // check now.
    //
    // The other resource types are unaffected because they are not
    // yet suspensey.
    //
    // TODO: This is a bit of a code smell. Consider refactoring how
    // `suspendResource` and `acquireResource` work together. The idea is that
    // `suspendResource` does all the same stuff as `acquireResource` except
    // for the insertion.
    if (
      resource.type === 'stylesheet' &&
      (resource.state.loading & Inserted) === NotLoaded
    ) {
      const qualifiedProps                            = props;
      const instance           = resource.instance;
      resource.state.loading |= Inserted;
      insertStylesheet(instance, qualifiedProps.precedence, hoistableRoot);
    }
  }
  return resource.instance;
}

export function releaseResource(resource          )       {
  resource.count--;
}

function insertStylesheet(
  instance         ,
  precedence        ,
  root               ,
)       {
  const nodes = root.querySelectorAll(
    'link[rel="stylesheet"][data-precedence],style[data-precedence]',
  );
  const last = nodes.length ? nodes[nodes.length - 1] : null;
  let prior = last;
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    const nodePrecedence = node.dataset.precedence;
    if (nodePrecedence === precedence) {
      prior = node;
    } else if (prior !== last) {
      break;
    }
  }

  if (prior) {
    // We get the prior from the document so we know it is in the tree.
    // We also know that links can't be the topmost Node so the parentNode
    // must exist.
    ((prior.parentNode     )      ).insertBefore(instance, prior.nextSibling);
  } else {
    const parent =
      root.nodeType === DOCUMENT_NODE
        ? ((((root     )          ).head     )         )
        : ((root     )            );
    parent.insertBefore(instance, parent.firstChild);
  }
}

function adoptPreloadPropsForStylesheet(
  stylesheetProps                 ,
  preloadProps              ,
)       {
  if (stylesheetProps.crossOrigin == null)
    stylesheetProps.crossOrigin = preloadProps.crossOrigin;
  if (stylesheetProps.referrerPolicy == null)
    stylesheetProps.referrerPolicy = preloadProps.referrerPolicy;
  if (stylesheetProps.title == null) stylesheetProps.title = preloadProps.title;
}

function adoptPreloadPropsForScript(
  scriptProps             ,
  preloadProps              ,
)       {
  if (scriptProps.crossOrigin == null)
    scriptProps.crossOrigin = preloadProps.crossOrigin;
  if (scriptProps.referrerPolicy == null)
    scriptProps.referrerPolicy = preloadProps.referrerPolicy;
  if (scriptProps.integrity == null)
    scriptProps.referrerPolicy = preloadProps.integrity;
}

                                                 
                                                      
let tagCaches                           = null;

export function hydrateHoistable(
  hoistableRoot               ,
  type                  ,
  props     ,
  internalInstanceHandle        ,
)           {
  const ownerDocument = getDocumentFromRoot(hoistableRoot);

  let instance            = null;
  getInstance: switch (type) {
    case 'title': {
      instance = ownerDocument.getElementsByTagName('title')[0];
      if (
        !instance ||
        isOwnedInstance(instance) ||
        instance.namespaceURI === SVG_NAMESPACE ||
        instance.hasAttribute('itemprop')
      ) {
        instance = ownerDocument.createElement(type);
        (ownerDocument.head     ).insertBefore(
          instance,
          ownerDocument.querySelector('head > title'),
        );
      }
      setInitialProperties(instance, type, props);
      precacheFiberNode(internalInstanceHandle, instance);
      markNodeAsHoistable(instance);
      return instance;
    }
    case 'link': {
      const cache = getHydratableHoistableCache('link', 'href', ownerDocument);
      const key = type + (props.href || '');
      const maybeNodes = cache.get(key);
      if (maybeNodes) {
        const nodes = maybeNodes;
        for (let i = 0; i < nodes.length; i++) {
          const node = nodes[i];
          if (
            node.getAttribute('href') !==
              (props.href == null ? null : props.href) ||
            node.getAttribute('rel') !==
              (props.rel == null ? null : props.rel) ||
            node.getAttribute('title') !==
              (props.title == null ? null : props.title) ||
            node.getAttribute('crossorigin') !==
              (props.crossOrigin == null ? null : props.crossOrigin)
          ) {
            // mismatch, try the next node;
            continue;
          }
          instance = node;
          nodes.splice(i, 1);
          break getInstance;
        }
      }
      instance = ownerDocument.createElement(type);
      setInitialProperties(instance, type, props);
      (ownerDocument.head     ).appendChild(instance);
      break;
    }
    case 'meta': {
      const cache = getHydratableHoistableCache(
        'meta',
        'content',
        ownerDocument,
      );
      const key = type + (props.content || '');
      const maybeNodes = cache.get(key);
      if (maybeNodes) {
        const nodes = maybeNodes;
        for (let i = 0; i < nodes.length; i++) {
          const node = nodes[i];

          // We coerce content to string because it is the most likely one to
          // use a `toString` capable value. For the rest we just do identity match
          // passing non-strings here is not really valid anyway.
          if (__DEV__) {
            checkAttributeStringCoercion(props.content, 'content');
          }
          if (
            node.getAttribute('content') !==
              (props.content == null ? null : '' + props.content) ||
            node.getAttribute('name') !==
              (props.name == null ? null : props.name) ||
            node.getAttribute('property') !==
              (props.property == null ? null : props.property) ||
            node.getAttribute('http-equiv') !==
              (props.httpEquiv == null ? null : props.httpEquiv) ||
            node.getAttribute('charset') !==
              (props.charSet == null ? null : props.charSet)
          ) {
            // mismatch, try the next node;
            continue;
          }
          instance = node;
          nodes.splice(i, 1);
          break getInstance;
        }
      }
      instance = ownerDocument.createElement(type);
      setInitialProperties(instance, type, props);
      (ownerDocument.head     ).appendChild(instance);
      break;
    }
    default:
      throw new Error(
        `getNodesForType encountered a type it did not expect: "${type}". This is a bug in React.`,
      );
  }

  // This node is a match
  precacheFiberNode(internalInstanceHandle, instance);
  markNodeAsHoistable(instance);
  return instance;
}

function getHydratableHoistableCache(
  type                  ,
  keyAttribute        ,
  ownerDocument          ,
)                {
  let cache               ;
  let caches                   ;
  if (tagCaches === null) {
    cache = new Map();
    caches = tagCaches = new Map();
    caches.set(ownerDocument, cache);
  } else {
    caches = tagCaches;
    const maybeCache = caches.get(ownerDocument);
    if (!maybeCache) {
      cache = new Map();
      caches.set(ownerDocument, cache);
    } else {
      cache = maybeCache;
    }
  }

  if (cache.has(type)) {
    // We use type as a special key that signals that this cache has been seeded for this type
    return cache;
  }

  // Mark this cache as seeded for this type
  cache.set(type, (null     ));

  const nodes = ownerDocument.getElementsByTagName(type);
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    if (
      !isOwnedInstance(node) &&
      (type !== 'link' || node.getAttribute('rel') !== 'stylesheet') &&
      node.namespaceURI !== SVG_NAMESPACE
    ) {
      const nodeKey = node.getAttribute(keyAttribute) || '';
      const key = type + nodeKey;
      const existing = cache.get(key);
      if (existing) {
        existing.push(node);
      } else {
        cache.set(key, [node]);
      }
    }
  }

  return cache;
}

export function mountHoistable(
  hoistableRoot               ,
  type                  ,
  instance          ,
)       {
  const ownerDocument = getDocumentFromRoot(hoistableRoot);
  (ownerDocument.head     ).insertBefore(
    instance,
    type === 'title' ? ownerDocument.querySelector('head > title') : null,
  );
}

export function unmountHoistable(instance          )       {
  (instance.parentNode     ).removeChild(instance);
}

export function isHostHoistableType(
  type        ,
  props          ,
  hostContext             ,
)          {
  let outsideHostContainerContext         ;
  let hostContextProd                 ;
  if (__DEV__) {
    const hostContextDev                 = (hostContext     );
    // We can only render resources when we are not within the host container context
    outsideHostContainerContext =
      !hostContextDev.ancestorInfo.containerTagInScope;
    hostContextProd = hostContextDev.context;
  } else {
    hostContextProd = (hostContext     );
  }

  // Global opt out of hoisting for anything in SVG Namespace or anything with an itemProp inside an itemScope
  if (hostContextProd === HostContextNamespaceSvg || props.itemProp != null) {
    if (__DEV__) {
      if (
        outsideHostContainerContext &&
        props.itemProp != null &&
        (type === 'meta' ||
          type === 'title' ||
          type === 'style' ||
          type === 'link' ||
          type === 'script')
      ) {
        console.error(
          'Cannot render a <%s> outside the main document if it has an `itemProp` prop. `itemProp` suggests the tag belongs to an' +
            ' `itemScope` which can appear anywhere in the DOM. If you were intending for React to hoist this <%s> remove the `itemProp` prop.' +
            ' Otherwise, try moving this tag into the <head> or <body> of the Document.',
          type,
          type,
        );
      }
    }
    return false;
  }

  switch (type) {
    case 'meta':
    case 'title': {
      return true;
    }
    case 'style': {
      if (
        typeof props.precedence !== 'string' ||
        typeof props.href !== 'string' ||
        props.href === ''
      ) {
        if (__DEV__) {
          if (outsideHostContainerContext) {
            console.error(
              'Cannot render a <style> outside the main document without knowing its precedence and a unique href key.' +
                ' React can hoist and deduplicate <style> tags if you provide a `precedence` prop along with an `href` prop that' +
                ' does not conflic with the `href` values used in any other hoisted <style> or <link rel="stylesheet" ...> tags. ' +
                ' Note that hoisting <style> tags is considered an advanced feature that most will not use directly.' +
                ' Consider moving the <style> tag to the <head> or consider adding a `precedence="default"` and `href="some unique resource identifier"`, or move the <style>' +
                ' to the <style> tag.',
            );
          }
        }
        return false;
      }
      return true;
    }
    case 'link': {
      if (
        typeof props.rel !== 'string' ||
        typeof props.href !== 'string' ||
        props.href === '' ||
        props.onLoad ||
        props.onError
      ) {
        if (__DEV__) {
          if (
            props.rel === 'stylesheet' &&
            typeof props.precedence === 'string'
          ) {
            validateLinkPropsForStyleResource(props);
          }
          if (outsideHostContainerContext) {
            if (
              typeof props.rel !== 'string' ||
              typeof props.href !== 'string' ||
              props.href === ''
            ) {
              console.error(
                'Cannot render a <link> outside the main document without a `rel` and `href` prop.' +
                  ' Try adding a `rel` and/or `href` prop to this <link> or moving the link into the <head> tag',
              );
            } else if (props.onError || props.onLoad) {
              console.error(
                'Cannot render a <link> with onLoad or onError listeners outside the main document.' +
                  ' Try removing onLoad={...} and onError={...} or moving it into the root <head> tag or' +
                  ' somewhere in the <body>.',
              );
            }
          }
        }
        return false;
      }
      switch (props.rel) {
        case 'stylesheet': {
          const {precedence, disabled} = props;
          if (__DEV__) {
            if (typeof precedence !== 'string') {
              if (outsideHostContainerContext) {
                console.error(
                  'Cannot render a <link rel="stylesheet" /> outside the main document without knowing its precedence.' +
                    ' Consider adding precedence="default" or moving it into the root <head> tag.',
                );
              }
            }
          }
          return typeof precedence === 'string' && disabled == null;
        }
        default: {
          return true;
        }
      }
    }
    case 'script': {
      if (
        props.async !== true ||
        props.onLoad ||
        props.onError ||
        typeof props.src !== 'string' ||
        !props.src
      ) {
        if (__DEV__) {
          if (outsideHostContainerContext) {
            if (props.async !== true) {
              console.error(
                'Cannot render a sync or defer <script> outside the main document without knowing its order.' +
                  ' Try adding async="" or moving it into the root <head> tag.',
              );
            } else if (props.onLoad || props.onError) {
              console.error(
                'Cannot render a <script> with onLoad or onError listeners outside the main document.' +
                  ' Try removing onLoad={...} and onError={...} or moving it into the root <head> tag or' +
                  ' somewhere in the <body>.',
              );
            } else {
              console.error(
                'Cannot render a <script> outside the main document without `async={true}` and a non-empty `src` prop.' +
                  ' Ensure there is a valid `src` and either make the script async or move it into the root <head> tag or' +
                  ' somewhere in the <body>.',
              );
            }
          }
        }
        return false;
      }
      return true;
    }
    case 'noscript':
    case 'template': {
      if (__DEV__) {
        if (outsideHostContainerContext) {
          console.error(
            'Cannot render <%s> outside the main document. Try moving it into the root <head> tag.',
            type,
          );
        }
      }
      return false;
    }
  }
  return false;
}

export function maySuspendCommit(type      , props       )          {
  return false;
}

export function mayResourceSuspendCommit(resource          )          {
  return (
    resource.type === 'stylesheet' &&
    (resource.state.loading & Inserted) === NotLoaded
  );
}

export function preloadInstance(type      , props       )          {
  // Return true to indicate it's already loaded
  return true;
}

export function preloadResource(resource          )          {
  if (
    resource.type === 'stylesheet' &&
    (resource.state.loading & Settled) === NotLoaded
  ) {
    // we have not finished loading the underlying stylesheet yet.
    return false;
  }
  // Return true to indicate it's already loaded
  return true;
}

                       
                                                             
                
                                 
  
let suspendedState                        = null;

// We use a noop function when we begin suspending because if possible we want the
// waitfor step to finish synchronously. If it doesn't we'll return a function to
// provide the actual unsuspend function and that will get completed when the count
// hits zero or it will get cancelled if the root starts new work.
function noop() {}

export function startSuspendingCommit()       {
  suspendedState = {
    stylesheets: null,
    count: 0,
    unsuspend: noop,
  };
}

export function suspendInstance(type      , props       )       {
  return;
}

export function suspendResource(
  hoistableRoot               ,
  resource          ,
  props     ,
)       {
  if (suspendedState === null) {
    throw new Error(
      'Internal React Error: suspendedState null when it was expected to exists. Please report this as a React bug.',
    );
  }
  const state = suspendedState;
  if (resource.type === 'stylesheet') {
    if (typeof props.media === 'string') {
      // If we don't currently match media we avoid suspending on this resource
      // and let it insert on the mutation path
      if (matchMedia(props.media).matches === false) {
        return;
      }
    }
    if (resource.instance === null) {
      const qualifiedProps                            = props;
      const key = getStyleKey(qualifiedProps.href);

      // Attempt to hydrate instance from DOM
      let instance                  = hoistableRoot.querySelector(
        getStylesheetSelectorFromKey(key),
      );
      if (instance) {
        // If this instance has a loading state it came from the Fizz runtime.
        // If there is not loading state it is assumed to have been server rendered
        // as part of the preamble and therefore synchronously loaded. It could have
        // errored however which we still do not yet have a means to detect. For now
        // we assume it is loaded.
        const maybeLoadingState                  = (instance     )._p;
        if (
          maybeLoadingState !== null &&
          typeof maybeLoadingState === 'object' &&
          // $FlowFixMe[method-unbinding]
          typeof maybeLoadingState.then === 'function'
        ) {
          const loadingState = maybeLoadingState;
          state.count++;
          const ping = onUnsuspend.bind(state);
          loadingState.then(ping, ping);
        }
        resource.state.loading |= Inserted;
        resource.instance = instance;
        markNodeAsHoistable(instance);
        return;
      }

      const ownerDocument = getDocumentFromRoot(hoistableRoot);

      const stylesheetProps = stylesheetPropsFromRawProps(props);
      const preloadProps = preloadPropsMap.get(key);
      if (preloadProps) {
        adoptPreloadPropsForStylesheet(stylesheetProps, preloadProps);
      }

      // Construct and insert a new instance
      instance = ownerDocument.createElement('link');
      markNodeAsHoistable(instance);
      const linkInstance                  = (instance     );
      // This Promise is a loading state used by the Fizz runtime. We need this incase there is a race
      // between this resource being rendered on the client and being rendered with a late completed boundary.
      (linkInstance     )._p = new Promise((resolve, reject) => {
        linkInstance.onload = resolve;
        linkInstance.onerror = reject;
      });
      setInitialProperties(instance, 'link', stylesheetProps);
      resource.instance = instance;
    }

    if (state.stylesheets === null) {
      state.stylesheets = new Map();
    }
    state.stylesheets.set(resource, hoistableRoot);

    const preloadEl = resource.state.preload;
    if (preloadEl && (resource.state.loading & Settled) === NotLoaded) {
      state.count++;
      const ping = onUnsuspend.bind(state);
      preloadEl.addEventListener('load', ping);
      preloadEl.addEventListener('error', ping);
    }
  }
}

export function waitForCommitToBeReady()                                {
  if (suspendedState === null) {
    throw new Error(
      'Internal React Error: suspendedState null when it was expected to exists. Please report this as a React bug.',
    );
  }

  const state = suspendedState;

  if (state.stylesheets && state.count === 0) {
    // We are not currently blocked but we have not inserted all stylesheets.
    // If this insertion happens and loads or errors synchronously then we can
    // avoid suspending the commit. To do this we check the count again immediately after
    insertSuspendedStylesheets(state, state.stylesheets);
  }

  // We need to check the count again because the inserted stylesheets may have led to new
  // tasks to wait on.
  if (state.count > 0) {
    return commit => {
      // We almost never want to show content before its styles have loaded. But
      // eventually we will give up and allow unstyled content. So this number is
      // somewhat arbitrary — big enough that you'd only reach it under
      // extreme circumstances.
      // TODO: Figure out what the browser engines do during initial page load and
      // consider aligning our behavior with that.
      const stylesheetTimer = setTimeout(() => {
        if (state.stylesheets) {
          insertSuspendedStylesheets(state, state.stylesheets);
        }
        if (state.unsuspend) {
          const unsuspend = state.unsuspend;
          state.unsuspend = null;
          unsuspend();
        }
      }, 60000); // one minute

      state.unsuspend = commit;

      return () => {
        state.unsuspend = null;
        clearTimeout(stylesheetTimer);
      };
    };
  }
  return null;
}

function onUnsuspend(                    ) {
  this.count--;
  if (this.count === 0) {
    if (this.stylesheets) {
      // If we haven't actually inserted the stylesheets yet we need to do so now before starting the commit.
      // The reason we do this after everything else has finished is because we want to have all the stylesheets
      // load synchronously right before mutating. Ideally the new styles will cause a single recalc only on the
      // new tree. When we filled up stylesheets we only inlcuded stylesheets with matching media attributes so we
      // wait for them to load before actually continuing. We expect this to increase the count above zero
      insertSuspendedStylesheets(this, this.stylesheets);
    } else if (this.unsuspend) {
      const unsuspend = this.unsuspend;
      this.unsuspend = null;
      unsuspend();
    }
  }
}

// This is typecast to non-null because it will always be set before read.
// it is important that this not be used except when the stack guarantees it exists.
// Currentlyt his is only during insertSuspendedStylesheet.
let precedencesByRoot                                            = (null     );

function insertSuspendedStylesheets(
  state                ,
  resources                                        ,
)       {
  // We need to clear this out so we don't try to reinsert after the stylesheets have loaded
  state.stylesheets = null;

  if (state.unsuspend === null) {
    // The suspended commit was cancelled. We don't need to insert any stylesheets.
    return;
  }

  // Temporarily increment count. we don't want any synchronously loaded stylesheets to try to unsuspend
  // before we finish inserting all stylesheets.
  state.count++;

  precedencesByRoot = new Map();
  resources.forEach(insertStylesheetIntoRoot, state);
  precedencesByRoot = (null     );

  // We can remove our temporary count and if we're still at zero we can unsuspend.
  // If we are in the synchronous phase before deciding if the commit should suspend and this
  // ends up hitting the unsuspend path it will just invoke the noop unsuspend.
  onUnsuspend.call(state);
}

function insertStylesheetIntoRoot(
                       
  root               ,
  resource                    ,
  map                                        ,
) {
  if (resource.state.loading & Inserted) {
    // This resource was inserted by another root committing. we don't need to insert it again
    return;
  }

  let last;
  let precedences = precedencesByRoot.get(root);
  if (!precedences) {
    precedences = new Map();
    precedencesByRoot.set(root, precedences);
    const nodes = root.querySelectorAll(
      'link[data-precedence],style[data-precedence]',
    );
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      if (
        node.nodeName === 'link' ||
        // We omit style tags with media="not all" because they are not in the right position
        // and will be hoisted by the Fizz runtime imminently.
        node.getAttribute('media') !== 'not all'
      ) {
        precedences.set('p' + node.dataset.precedence, node);
        last = node;
      }
    }
    if (last) {
      precedences.set('last', last);
    }
  } else {
    last = precedences.get('last');
  }

  // We only call this after we have constructed an instance so we assume it here
  const instance                  = (resource.instance     );
  // We will always have a precedence for stylesheet instances
  const precedence         = (instance.getAttribute('data-precedence')     );

  const prior = precedences.get('p' + precedence) || last;
  if (prior === last) {
    precedences.set('last', instance);
  }
  precedences.set(precedence, instance);

  this.count++;
  const onComplete = onUnsuspend.bind(this);
  instance.addEventListener('load', onComplete);
  instance.addEventListener('error', onComplete);

  if (prior) {
    (prior.parentNode     ).insertBefore(instance, prior.nextSibling);
  } else {
    const parent =
      root.nodeType === DOCUMENT_NODE
        ? ((((root     )          ).head     )         )
        : ((root     )            );
    parent.insertBefore(instance, parent.firstChild);
  }
  resource.state.loading |= Inserted;
}

export const NotPendingTransition                   = NotPending;
