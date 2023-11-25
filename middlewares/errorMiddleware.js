

const handleErrors = (err, req, res, next) => {
    console.error(err.stack);
  
    // Check if the error is a 404 error
    if (err.status === 404) {
      // res.status(404).render('404', { error: err });
      return res.redirect('/404');
    } else {
      // For other errors, you can render a generic error page or handle them as needed
      res.status(500).render('error', { error: err });
    }
  };
  
  module.exports = handleErrors;