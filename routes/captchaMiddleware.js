const svgCaptcha = require('svg-captcha');

// Generate CAPTCHA and add to session
exports.generateCaptcha = (req, res, next) => {
  const captcha = svgCaptcha.create({
    size: 6,           // CAPTCHA string length
    noise: 2,          // number of noise lines
    color: true,       // characters will have color
    background: '#f0f0f0' // background color
  });

  // Store CAPTCHA text in session
  req.session.captchaText = captcha.text;

  // Add CAPTCHA data to response locals
  res.locals.captchaData = captcha.data;
  next();
};

// Verify CAPTCHA input
exports.verifyCaptcha = (req, res, next) => {
  const userInput = req.body.captcha;
  const captchaText = req.session.captchaText;
  
  if (!userInput || !captchaText || userInput.toLowerCase() !== captchaText.toLowerCase()) {
    return res.status(400).json({ error: 'CAPTCHA verification failed' });
  }
  
  // Clear the used CAPTCHA
  delete req.session.captchaText;
  next();
};