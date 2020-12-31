const Connection = require('../../src/tedious').Connection;
const assert = require('chai').assert;
const fs = require('fs');

function ensureConnectionIsClosed(connection, callback) {
  if (connection.closed) {
    process.nextTick(callback);
    return;
  }

  connection.on('end', callback);
  connection.close();
}

describe('Connection configuration validation', function() {
  const config = JSON.parse(
    fs.readFileSync(require('os').homedir() + '/.tedious/test-connection.json', 'utf8')
  ).config;

  beforeEach(function() {
    config.options = { encrypt: false };
  });

  it('default transient retry interval', () => {
    const connection = new Connection(config);
    assert.strictEqual(connection.config.options.connectionRetryInterval, 500);
    ensureConnectionIsClosed(connection, () => {});
  });

  it('good transient retry interval', () => {
    const goodRetryInterval = 75;
    config.options.connectionRetryInterval = goodRetryInterval;
    const connection = new Connection(config);
    assert.strictEqual(connection.config.options.connectionRetryInterval, goodRetryInterval);
    ensureConnectionIsClosed(connection, () => {});
  });

  it('bad transient retry interval', () => {
    const zeroRetryInterval = 0;
    config.options.connectionRetryInterval = zeroRetryInterval;
    assert.throws(() => {
      new Connection(config);
    });

    const negativeRetryInterval = -25;
    config.options.connectionRetryInterval = negativeRetryInterval;
    assert.throws(() => {
      new Connection(config);
    });
  });

  it('default max transient retries', () => {
    const connection = new Connection(config);
    assert.strictEqual(connection.config.options.maxRetriesOnTransientErrors, 3);
    ensureConnectionIsClosed(connection, () => {});
  });

  it('good max transient retries', () => {
    const zeroMaxRetries = 0;
    config.options.maxRetriesOnTransientErrors = zeroMaxRetries;
    const firstConnection = new Connection(config);
    assert.strictEqual(firstConnection.config.options.maxRetriesOnTransientErrors, zeroMaxRetries);

    const nonZeroMaxRetries = 5;
    config.options.maxRetriesOnTransientErrors = nonZeroMaxRetries;
    const secondConnection = new Connection(config);
    assert.strictEqual(secondConnection.config.options.maxRetriesOnTransientErrors, nonZeroMaxRetries);

    ensureConnectionIsClosed(firstConnection, () => {
      ensureConnectionIsClosed(secondConnection, () => {});
    });
  });

  it('bad max transient retries', () => {
    const negativeMaxRetries = -5;
    config.options.maxRetriesOnTransientErrors = negativeMaxRetries;
    assert.throws(() => {
      new Connection(config);
    });
  });

  it('bad azure ad authentication method', () => {
    const authenticationMethod = 'abc';
    config.authentication = authenticationMethod;
    assert.throws(() => {
      new Connection(config);
    });
  });

  it('bad tds version for with azure ad', () => {
    const authenticationMethod = 'activedirectorypassword';
    config.authentication = authenticationMethod;
    config.options.tdsVersion = '7_2';
    assert.throws(() => {
      new Connection(config);
    });
  });

  it('bad validateBulkLoadParameters value', () => {
    const validateBulkLoadParametersVal = 'text';
    config.options.validateBulkLoadParameters = validateBulkLoadParametersVal;
    config.options.tdsVersion = '7_2';
    assert.throws(() => {
      new Connection(config);
    });
  });
});
