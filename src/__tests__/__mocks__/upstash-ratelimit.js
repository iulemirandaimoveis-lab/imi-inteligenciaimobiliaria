class Ratelimit {
  constructor() {}
  static slidingWindow() { return {} }
  async limit() { return { success: true, remaining: 10, reset: Date.now() + 60000 } }
}

module.exports = { Ratelimit }
