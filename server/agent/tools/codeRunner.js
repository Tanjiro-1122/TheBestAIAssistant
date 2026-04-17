const { VM } = require('vm2');

function codeRunner(input) {
  try {
    const vm = new VM({
      timeout: 1000,
      sandbox: { Math, Date },
      eval: false,
      wasm: false,
    });

    const code = String(input || '');
    const result = vm.run(code);
    return { ok: true, result: String(result) };
  } catch (error) {
    return { ok: false, error: `Code execution error: ${error.message}` };
  }
}

module.exports = { codeRunner };
