'use babel'

// Our sugar method that allows us to pass async functions and do await in it
function promisedIt(name, callback) {
  it(name, function() {
    const value = callback()
    if (value && typeof value.then === 'function') {
      waitsForPromise({ timeout: 60 * 1000 }, function() {
        return value
      })
    }
  })
}

module.exports.it = promisedIt
