exports.collector = (req, res) => {
  console.log('I am a log entry!');
  console.error('I am an error!');
  res.end();
};
