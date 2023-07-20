/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 *      
 */

export function validateLinkPropsForStyleResource(props     )          {
  if (__DEV__) {
    // This should only be called when we know we are opting into Resource semantics (i.e. precedence is not null)
    const {href, onLoad, onError, disabled} = props;
    const includedProps = [];
    if (onLoad) includedProps.push('`onLoad`');
    if (onError) includedProps.push('`onError`');
    if (disabled != null) includedProps.push('`disabled`');

    let includedPropsPhrase = propNamesListJoin(includedProps, 'and');
    includedPropsPhrase += includedProps.length === 1 ? ' prop' : ' props';
    const withArticlePhrase =
      includedProps.length === 1
        ? 'an ' + includedPropsPhrase
        : 'the ' + includedPropsPhrase;

    if (includedProps.length) {
      console.error(
        'React encountered a <link rel="stylesheet" href="%s" ... /> with a `precedence` prop that' +
          ' also included %s. The presence of loading and error handlers indicates an intent to manage' +
          ' the stylesheet loading state from your from your Component code and React will not hoist or' +
          ' deduplicate this stylesheet. If your intent was to have React hoist and deduplciate this stylesheet' +
          ' using the `precedence` prop remove the %s, otherwise remove the `precedence` prop.',
        href,
        withArticlePhrase,
        includedPropsPhrase,
      );
      return true;
    }
  }
  return false;
}

function propNamesListJoin(
  list               ,
  combinator              ,
)         {
  switch (list.length) {
    case 0:
      return '';
    case 1:
      return list[0];
    case 2:
      return list[0] + ' ' + combinator + ' ' + list[1];
    default:
      return (
        list.slice(0, -1).join(', ') +
        ', ' +
        combinator +
        ' ' +
        list[list.length - 1]
      );
  }
}

export function validatePreinitArguments(href       , options       ) {
  if (__DEV__) {
    if (!href || typeof href !== 'string') {
      const typeOfArg = getValueDescriptorExpectingObjectForWarning(href);
      console.error(
        'ReactDOM.preinit() expected the first argument to be a string representing an href but found %s instead.',
        typeOfArg,
      );
    } else if (typeof options !== 'object' || options === null) {
      const typeOfArg = getValueDescriptorExpectingObjectForWarning(options);
      console.error(
        'ReactDOM.preinit() expected the second argument to be an options argument containing at least an "as" property' +
          ' specifying the Resource type. It found %s instead. The href for the preload call where this warning originated is "%s".',
        typeOfArg,
        href,
      );
    } else {
      const as = options.as;
      switch (as) {
        case 'style':
        case 'script': {
          break;
        }

        // We have an invalid as type and need to warn
        default: {
          const typeOfAs = getValueDescriptorExpectingEnumForWarning(as);
          console.error(
            'ReactDOM.preinit() expected the second argument to be an options argument containing at least an "as" property' +
              ' specifying the Resource type. It found %s instead. Currently, valid resource types for for preinit are "style"' +
              ' and "script". The href for the preinit call where this warning originated is "%s".',
            typeOfAs,
            href,
          );
        }
      }
    }
  }
}

export function getValueDescriptorExpectingObjectForWarning(
  thing     ,
)         {
  return thing === null
    ? '`null`'
    : thing === undefined
    ? '`undefined`'
    : thing === ''
    ? 'an empty string'
    : `something with type "${typeof thing}"`;
}

export function getValueDescriptorExpectingEnumForWarning(thing     )         {
  return thing === null
    ? '`null`'
    : thing === undefined
    ? '`undefined`'
    : thing === ''
    ? 'an empty string'
    : typeof thing === 'string'
    ? JSON.stringify(thing)
    : `something with type "${typeof thing}"`;
}

                        
            
                  
    
          
                  
    
              
               
                    
                  
      
    
  
function compareResourcePropsForWarning(
  newProps     ,
  currentProps     ,
)                         {
  if (__DEV__) {
    let propDiffs                         = null;

    const allProps = Array.from(
      new Set(Object.keys(currentProps).concat(Object.keys(newProps))),
    );

    for (let i = 0; i < allProps.length; i++) {
      const propName = allProps[i];
      const newValue = newProps[propName];
      const currentValue = currentProps[propName];
      if (
        newValue !== currentValue &&
        !(newValue == null && currentValue == null)
      ) {
        if (newValue == null) {
          if (propDiffs === null) {
            propDiffs = ({
              missing: {},
              extra: {},
              different: {},
            }                 );
          }
          propDiffs.missing[propName] = currentValue;
        } else if (currentValue == null) {
          if (propDiffs === null) {
            propDiffs = ({
              missing: {},
              extra: {},
              different: {},
            }                 );
          }
          propDiffs.extra[propName] = newValue;
        } else {
          if (propDiffs === null) {
            propDiffs = ({
              missing: {},
              extra: {},
              different: {},
            }                 );
          }
          propDiffs.different[propName] = {
            original: currentValue,
            latest: newValue,
          };
        }
      }
    }

    return propDiffs;
  }
  return null;
}

export function describeDifferencesForStylesheets(
  newProps     ,
  currentProps     ,
)         {
  const diff = compareResourcePropsForWarning(newProps, currentProps);
  if (!diff) return '';

  let description = '';

  for (const propName in diff.missing) {
    const propValue = diff.missing[propName];
    if (propName === 'media') {
      description += `\n  "${propName}" missing for props, original value: ${getValueDescriptorExpectingEnumForWarning(
        propValue,
      )}`;
    }
  }
  for (const propName in diff.extra) {
    const propValue = diff.extra[propName];
    description += `\n  "${propName}" prop value: ${getValueDescriptorExpectingEnumForWarning(
      propValue,
    )}, missing from original props`;
  }
  for (const propName in diff.different) {
    const latestValue = diff.different[propName].latest;
    const originalValue = diff.different[propName].original;
    description += `\n  "${propName}" prop value: ${getValueDescriptorExpectingEnumForWarning(
      latestValue,
    )}, original value: ${getValueDescriptorExpectingEnumForWarning(
      originalValue,
    )}`;
  }
  return description;
}

export function describeDifferencesForStylesheetOverPreinit(
  newProps     ,
  currentProps     ,
)         {
  const diff = compareResourcePropsForWarning(newProps, currentProps);
  if (!diff) return '';

  let description = '';

  for (const propName in diff.extra) {
    const propValue = diff.extra[propName];
    if (
      propName === 'precedence' ||
      propName === 'crossOrigin' ||
      propName === 'integrity'
    ) {
      description += `\n  "${propName}" prop value: ${getValueDescriptorExpectingEnumForWarning(
        propValue,
      )}, option missing`;
    } else {
      description += `\n  "${propName}" prop value: ${getValueDescriptorExpectingEnumForWarning(
        propValue,
      )}, option not available with ReactDOM.preinit()`;
    }
  }
  for (const propName in diff.different) {
    const latestValue = diff.different[propName].latest;
    const originalValue = diff.different[propName].original;
    if (propName === 'precedence' && originalValue === 'default') {
      description += `\n  "${propName}" prop value: ${getValueDescriptorExpectingEnumForWarning(
        latestValue,
      )}, missing from options`;
    } else {
      description += `\n  "${propName}" prop value: ${getValueDescriptorExpectingEnumForWarning(
        latestValue,
      )}, option value: ${getValueDescriptorExpectingEnumForWarning(
        originalValue,
      )}`;
    }
  }
  return description;
}

export function describeDifferencesForPreinitOverStylesheet(
  newProps     ,
  currentProps     ,
)         {
  const diff = compareResourcePropsForWarning(newProps, currentProps);
  if (!diff) return '';

  let description = '';
  for (const propName in diff.missing) {
    const propValue = diff.missing[propName];
    if (propName === 'precedence' && propValue !== 'default') {
      description += `\n  "${propName}" missing from options, prop value: ${getValueDescriptorExpectingEnumForWarning(
        propValue,
      )}`;
    }
  }
  for (const propName in diff.extra) {
    const propValue = diff.extra[propName];
    if (
      propName === 'precedence' ||
      propName === 'crossOrigin' ||
      propName === 'integrity'
    ) {
      description += `\n  "${propName}" option value: ${getValueDescriptorExpectingEnumForWarning(
        propValue,
      )}, missing from props`;
    }
  }
  for (const propName in diff.different) {
    const latestValue = diff.different[propName].latest;
    const originalValue = diff.different[propName].original;
    description += `\n  "${propName}" option value: ${getValueDescriptorExpectingEnumForWarning(
      latestValue,
    )}, prop value: ${getValueDescriptorExpectingEnumForWarning(
      originalValue,
    )}`;
  }
  return description;
}

export function describeDifferencesForPreinits(
  newProps     ,
  currentProps     ,
)         {
  const diff = compareResourcePropsForWarning(newProps, currentProps);
  if (!diff) return '';

  let description = '';
  for (const propName in diff.missing) {
    const propValue = diff.missing[propName];
    if (propName === 'precedence' && propValue !== 'default') {
      description += `\n  "${propName}" missing from options, original option value: ${getValueDescriptorExpectingEnumForWarning(
        propValue,
      )}`;
    }
  }
  for (const propName in diff.extra) {
    const propValue = diff.extra[propName];
    if (
      (propName === 'precedence' && propValue !== 'default') ||
      propName === 'crossOrigin' ||
      propName === 'integrity'
    ) {
      description += `\n  "${propName}" option value: ${getValueDescriptorExpectingEnumForWarning(
        propValue,
      )}, missing from original options`;
    }
  }
  for (const propName in diff.different) {
    const latestValue = diff.different[propName].latest;
    const originalValue = diff.different[propName].original;
    description += `\n  "${propName}" option value: ${getValueDescriptorExpectingEnumForWarning(
      latestValue,
    )}, original option value: ${getValueDescriptorExpectingEnumForWarning(
      originalValue,
    )}`;
  }
  return description;
}

const preloadOptionsForComparison = ['as', 'crossOrigin', 'integrity', 'media'];

export function describeDifferencesForPreloads(
  newProps     ,
  currentProps     ,
)         {
  const diff = compareResourcePropsForWarning(newProps, currentProps);
  if (!diff) return '';

  let description = '';
  for (const propName in diff.missing) {
    const propValue = diff.missing[propName];
    if (preloadOptionsForComparison.includes(propName)) {
      description += `\n  "${propName}" missing from options, original option value: ${getValueDescriptorExpectingEnumForWarning(
        propValue,
      )}`;
    }
  }
  for (const propName in diff.extra) {
    const propValue = diff.extra[propName];
    if (preloadOptionsForComparison.includes(propName)) {
      description += `\n  "${propName}" option value: ${getValueDescriptorExpectingEnumForWarning(
        propValue,
      )}, missing from original options`;
    }
  }
  for (const propName in diff.different) {
    const latestValue = diff.different[propName].latest;
    const originalValue = diff.different[propName].original;
    if (preloadOptionsForComparison.includes(propName)) {
      description += `\n  "${propName}" option value: ${getValueDescriptorExpectingEnumForWarning(
        latestValue,
      )}, original option value: ${getValueDescriptorExpectingEnumForWarning(
        originalValue,
      )}`;
    }
  }
  return description;
}

export function describeDifferencesForPreloadOverImplicitPreload(
  newProps     ,
  currentProps     ,
)         {
  const diff = compareResourcePropsForWarning(newProps, currentProps);
  if (!diff) return '';

  let description = '';
  for (const propName in diff.missing) {
    const propValue = diff.missing[propName];
    if (preloadOptionsForComparison.includes(propName)) {
      description += `\n  "${propName}" missing from options, underlying prop value: ${getValueDescriptorExpectingEnumForWarning(
        propValue,
      )}`;
    }
  }
  for (const propName in diff.extra) {
    const propValue = diff.extra[propName];
    if (preloadOptionsForComparison.includes(propName)) {
      description += `\n  "${propName}" option value: ${getValueDescriptorExpectingEnumForWarning(
        propValue,
      )}, missing from underlying props`;
    }
  }
  for (const propName in diff.different) {
    const latestValue = diff.different[propName].latest;
    const originalValue = diff.different[propName].original;
    if (preloadOptionsForComparison.includes(propName)) {
      description += `\n  "${propName}" option value: ${getValueDescriptorExpectingEnumForWarning(
        latestValue,
      )}, underlying prop value: ${getValueDescriptorExpectingEnumForWarning(
        originalValue,
      )}`;
    }
  }
  return description;
}

export function describeDifferencesForScripts(
  newProps     ,
  currentProps     ,
)         {
  const diff = compareResourcePropsForWarning(newProps, currentProps);
  if (!diff) return '';

  let description = '';

  for (const propName in diff.missing) {
    const propValue = diff.missing[propName];
    description += `\n  "${propName}" missing for props, original value: ${getValueDescriptorExpectingEnumForWarning(
      propValue,
    )}`;
  }
  for (const propName in diff.extra) {
    const propValue = diff.extra[propName];
    description += `\n  "${propName}" prop value: ${getValueDescriptorExpectingEnumForWarning(
      propValue,
    )}, missing from original props`;
  }
  for (const propName in diff.different) {
    const latestValue = diff.different[propName].latest;
    const originalValue = diff.different[propName].original;
    description += `\n  "${propName}" prop value: ${getValueDescriptorExpectingEnumForWarning(
      latestValue,
    )}, original value: ${getValueDescriptorExpectingEnumForWarning(
      originalValue,
    )}`;
  }
  return description;
}

export function describeDifferencesForScriptOverPreinit(
  newProps     ,
  currentProps     ,
)         {
  const diff = compareResourcePropsForWarning(newProps, currentProps);
  if (!diff) return '';

  let description = '';

  for (const propName in diff.extra) {
    const propValue = diff.extra[propName];
    if (propName === 'crossOrigin' || propName === 'integrity') {
      description += `\n  "${propName}" prop value: ${getValueDescriptorExpectingEnumForWarning(
        propValue,
      )}, option missing`;
    } else {
      description += `\n  "${propName}" prop value: ${getValueDescriptorExpectingEnumForWarning(
        propValue,
      )}, option not available with ReactDOM.preinit()`;
    }
  }
  for (const propName in diff.different) {
    const latestValue = diff.different[propName].latest;
    const originalValue = diff.different[propName].original;
    description += `\n  "${propName}" prop value: ${getValueDescriptorExpectingEnumForWarning(
      latestValue,
    )}, option value: ${getValueDescriptorExpectingEnumForWarning(
      originalValue,
    )}`;
  }
  return description;
}

export function describeDifferencesForPreinitOverScript(
  newProps     ,
  currentProps     ,
)         {
  const diff = compareResourcePropsForWarning(newProps, currentProps);
  if (!diff) return '';

  let description = '';

  for (const propName in diff.extra) {
    const propValue = diff.extra[propName];
    if (propName === 'crossOrigin' || propName === 'integrity') {
      description += `\n  "${propName}" option value: ${getValueDescriptorExpectingEnumForWarning(
        propValue,
      )}, missing from props`;
    }
  }
  for (const propName in diff.different) {
    const latestValue = diff.different[propName].latest;
    const originalValue = diff.different[propName].original;
    description += `\n  "${propName}" option value: ${getValueDescriptorExpectingEnumForWarning(
      latestValue,
    )}, prop value: ${getValueDescriptorExpectingEnumForWarning(
      originalValue,
    )}`;
  }
  return description;
}
