'use strict';

const createErrorMessage = require('../helpers/create-error-message');
const Rule = require('./_base');

const badChars = {double: '"', single: "'"}

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
            literals: config
          }
        }
        break;
      case 'object':
        return config
      case 'undefined':
        return false;
    }

    let errorMessage = createErrorMessage(
      this.ruleName,
      [
        '  * "double" - requires the use of double quotes wherever possible',
        '  * "single" - requires the use of single quotes wherever possible',
      ],
      config
    );

    throw new Error(errorMessage);
  }

  visitor() {
    return {
      AttrNode(node) {
        let source = this.sourceForNode(node);
        const badChar = badChars[this.config.attrs]
        const message = `you must use ${this.config.attrs} quotes in attrs`

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
        const badChar = badChars[this.config.literals]
        const message = `you must use ${this.config.attrs} quotes in string literals`

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
