export default function (test) {
  return (done) => {
    test.call(this, done)
      .catch((error) => { done.fail(error.message); });
  };
}
