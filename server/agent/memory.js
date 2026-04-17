function buildShortTermMemory(messages = [], limit = 8) {
  if (!Array.isArray(messages)) {
    return [];
  }

  return messages.slice(Math.max(messages.length - limit, 0));
}

module.exports = {
  buildShortTermMemory,
};
