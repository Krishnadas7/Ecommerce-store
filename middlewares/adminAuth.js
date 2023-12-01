const isLogin = async (req, res, next) => {
  try {
    if (req.session.Admin) {
      next()
    } else {
      res.redirect('/admin')
    }
  } catch (error) {
    res.status(500).send('Server Error')
  }
}

const isLogout = async (req, res, next) => {
  try {
    if (req.session.Admin) {
      res.redirect('/admin/homepage')
    } else {
      next()
    }
  } catch (error) {
    res.status(500).send('Server Error')
  }
}

module.exports = {
  isLogin,
  isLogout
}
