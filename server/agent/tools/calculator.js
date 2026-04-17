const { evaluate } = require('mathjs');

function calculator(input) {
  try {
    const value = evaluate(String(input));
    return { ok: true, result: String(value) };
  } catch (error) {
    return { ok: false, error: `Calculator error: ${error.message}` };
  }
}

module.exports = { calculator };
