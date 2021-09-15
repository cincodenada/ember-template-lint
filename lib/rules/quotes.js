'use strict';

const createErrorMessage = require('../helpers/create-error-message');
const Rule = require('./_base');

const badChars = { double: "'", single: '"' };

function getParentType(path, steps) {
  let rel = path;
  for (let i = 0; i < steps; i++) {
    if (!rel.parent) {
      return false;
    }
    rel = rel.parent;
  }
  return rel.node.type;
}

module.exports = class Quotes extends Rule {
  parseConfig(config) {
    let configType = typeof config;

    switch (configType) {
      case 'boolean':
        if (!config) {
          return false;
        }
        break;
      case 'string':
        if (['double', 'single'].includes(config)) {
          return {
            attrs: config,
            componentAttrs: config,
            blockPositionalParameters: config,
            literals: config,
          };
        } else if (config === 'double-attrs') {
          return {
            attrs: 'double',
            componentAttrs: 'double',
            blockPositionalParameters: 'double',
            literals: 'single',
          };
        }
        break;
      case 'object':
        config = {
          attrs: 'double',
          literals: 'single',
          ...config,
        };
        if (!config.componentAttrs) {
          config.componentAttrs = config.attrs;
        }
        if (!config.blockPositionalParameters) {
          config.blockPositionalParameters = config.attrs;
        }
        return config;
      case 'undefined':
        return false;
    }

    let errorMessage = createErrorMessage(
      this.ruleName,
      [
        '  * "double" - requires the use of double quotes wherever possible',
        '  * "single" - requires the use of single quotes wherever possible',
        '  * "double-attrs" - requires the use of double quotes for attributes and single quotes for string literals',
      ],
      config
    );

    throw new Error(errorMessage);
  }

  visitor() {
    return {
      AttrNode(node) {
        let source = this.sourceForNode(node);
        const badChar = badChars[this.config.attrs];
        const message = `you must use ${this.config.attrs} quotes in attrs`;

        if (!node.isValueless && node.quoteType === badChar) {
          return this.log({
            message,
            node,
          });
        }
      },

      StringLiteral(node, path) {
        let source = this.sourceForNode(node);
        let errorSource = this.sourceForNode(path.parentNode);

        let quoteType = this.config.literals;
        let contextName = 'string literals';
        if (
          getParentType(path, 1) === 'HashPair' &&
          ['MustacheStatement', 'BlockStatement'].includes(getParentType(path, 3))
        ) {
          quoteType = this.config.componentAttrs;
          contextName = 'component attributes'
        } else if (getParentType(path, 1) === 'BlockStatement') {
          quoteType = this.config.blockPositionalParameters;
          contextName = 'positional block parameters'
        }

        const badChar = badChars[quoteType];
        const message = `you must use ${quoteType} quotes in ${contextName}`;

        if (source[0] === badChar) {
          return this.log({
            message,
            node,
            source: errorSource,
          });
        }
      },
    };
  }
};
