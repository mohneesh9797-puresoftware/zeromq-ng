if (process.env.INCLUDE_COMPAT_TESTS) {
  const zmq = require("./load")
  const semver = require("semver")
  const {assert} = require("chai")
  const {testProtos, uniqAddress} = require("../helpers")

  /* TODO: This test regularly hangs. */
  for (const proto of testProtos("tcp")) {
    describe(`compat socket with ${proto} unbind`, function() {
      beforeEach(function() {
        /* Seems < 4.2 is affected by https://github.com/zeromq/libzmq/issues/1583 */
        if (semver.satisfies(zmq.version, "< 4.2")) this.skip()
      })

      let sockA, sockB, sockC

      beforeEach(function() {
        sockA = zmq.socket("dealer", {linger: 0})
        sockB = zmq.socket("dealer", {linger: 0})
        sockC = zmq.socket("dealer", {linger: 0})
      })

      afterEach(function() {
        sockA.close()
        sockB.close()
        sockC.close()
      })

      it("should be able to unbind", function(done) {
        const address1 = uniqAddress(proto)
        const address2 = uniqAddress(proto)

        let msgCount = 0
        sockA.bind(address1, async err => {
          if (err) throw err
          sockA.bind(address2, async err => {
            if (err) throw err
            sockB.connect(address1)
            sockC.connect(address2)
            sockB.send("Hello from sockB.")
            sockC.send("Hello from sockC.")
          })
        })

        sockA.on("unbind", async function(addr) {
          if (addr === address1) {
            sockB.send("Error from sockB.")
            sockC.send("Messsage from sockC.")
            sockC.send("Final message from sockC.")
          }
        })

        sockA.on("message", async function(msg) {
          msgCount++
          if (msg.toString() === "Hello from sockB.") {
            sockA.unbind(address1, err => {
              if (err) throw err
            })
          } else if (msg.toString() === "Final message from sockC.") {
            assert.equal(msgCount, 4)
            done()
          } else if (msg.toString() === "Error from sockB.") {
            throw Error("sockB should have been unbound")
          }
        })
      })
    })
  }
}
