const { sendWhatsAppMessage } = require('../services/whatsappService');

exports.sendMessage = async (req, res) => {
  try {
    const {
      phoneNumber,
      message,
      token,
      phoneNumberId
    } = req.body;

    const result = await sendWhatsAppMessage(
      phoneNumber,
      message,
      token,
      phoneNumberId
    );

    res.json({
      success: true,
      result
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};