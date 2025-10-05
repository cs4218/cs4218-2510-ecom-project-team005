exports.mockReq = (body = {}, params = {}, user = {}) => ({
  body,
  params,
  user,
});

exports.mockRes = () => {
  const res = {};
  res.statusCode = 200;
  res.status = jest.fn((code) => {
    res.statusCode = code;
    return res;
  });
  res.json = jest.fn((payload) => {
    res.payload = payload;
    return res;
  });
  res.send = jest.fn((payload) => {
    res.payload = payload;
    return res;
  });
  return res;
};
