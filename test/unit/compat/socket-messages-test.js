if (process.env.INCLUDE_COMPAT_TESTS) {
  const zmq = require("./load")
  const {assert} = require("chai")
  const {testProtos, uniqAddress} = require("../helpers")

  for (const proto of testProtos("tcp", "inproc")) {
    describe(`compat socket with ${proto} messages`, function() {
      let push, pull

      beforeEach(function() {
        push = zmq.socket("push")
        pull = zmq.socket("pull")
      })

      it("should support messages", function(done) {
        const address = uniqAddress(proto)

        let n = 0

        pull.on("message", function(msg) {
          msg = msg.toString()
          switch (n++) {
            case 0:
              assert.equal(msg, "string")
              break
            case 1:
              assert.equal(msg, "15.99")
              break
            case 2:
              assert.equal(msg, "buffer")
              push.close()
              pull.close()
              done()
              break
          }
        })

        pull.bind(address, err => {
          if (err) throw err
          push.connect(address)
          push.send("string")
          push.send(15.99)
          push.send(Buffer.from("buffer"))
        })
      })

      it("should support multipart messages", function(done) {
        const address = uniqAddress(proto)

        pull.on("message", function(msg1, msg2, msg3) {
          assert.equal(msg1.toString(), "string")
          assert.equal(msg2.toString(), "15.99")
          assert.equal(msg3.toString(), "buffer")
          push.close()
          pull.close()
          done()
        })

        pull.bind(address, err => {
          if (err) throw err
          push.connect(address)
          push.send(["string", 15.99, Buffer.from("buffer")])
        })
      })

      it("should support sndmore", function(done) {
        const address = uniqAddress(proto)

        pull.on("message", function(a, b, c, d, e) {
          assert.equal(a.toString(), "tobi")
          assert.equal(b.toString(), "loki")
          assert.equal(c.toString(), "jane")
          assert.equal(d.toString(), "luna")
          assert.equal(e.toString(), "manny")
          push.close()
          pull.close()
          done()
        })

        pull.bind(address, err => {
          if (err) throw err
          push.connect(address)
          push.send(["tobi", "loki"], zmq.ZMQ_SNDMORE)
          push.send(["jane", "luna"], zmq.ZMQ_SNDMORE)
          push.send("manny")
        })
      })

      if (proto != "inproc") {
        it("should handle late connect", function(done) {
          const address = uniqAddress(proto)
          let n = 0

          pull.on("message", function(msg) {
            msg = msg.toString()
            switch (n++) {
              case 0:
                assert.equal(msg, "string")
                break
              case 1:
                assert.equal(msg, "15.99")
                break
              case 2:
                assert.equal(msg, "buffer")
                push.close()
                pull.close()
                done()
                break
            }
          })

          push.setsockopt(zmq.ZMQ_SNDHWM, 1)
          pull.setsockopt(zmq.ZMQ_RCVHWM, 1)

          push.bind(address, err => {
            if (err) throw err
            push.send("string")
            push.send(15.99)
            push.send(Buffer.from("buffer"))
            pull.connect(address)
          })
        })
      }

      it("should call send callbacks", function(done) {
        const address = uniqAddress(proto)
        let received = 0
        let callbacks = 0

        function cb() {
          callbacks += 1
        }

        pull.on("message", function() {
          received += 1

          if (received === 4) {
            assert.equal(callbacks, received)
            pull.close()
            push.close()
            done()
          }
        })

        pull.bind(address, err => {
          if (err) throw err
          push.connect(address)

          push.send("hello", null, cb)
          push.send("hello", null, cb)
          push.send("hello", null, cb)
          push.send(["hello", "world"], null, cb)
        })
      })
    })
  }
}
