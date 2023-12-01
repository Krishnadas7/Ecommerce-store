const isLogin = async (req, res, next) => {
    try {
        if (req.session.user) {
            next();
        } else {
            res.redirect('/login');
        }
    } catch (error) {
        res.render('500')
    }
  }
  
  const isLogout = async (req, res, next) => {
    try {
        if (req.session.user) {
            res.redirect('/');
        } else {
            next();
        }
    } catch (error) {
        res.render('500')
    }
  }
  
  module.exports = {
    isLogin,
    isLogout
  }