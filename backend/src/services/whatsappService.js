const axios = require('axios');

const sendWhatsAppMessage = async (
  phoneNumber,
  message,
  token,
  phoneNumberId
) => {
  try {
    const response = await axios.post(
      `https://graph.facebook.com/v23.0/${phoneNumberId}/messages`,
      {
        messaging_product: "whatsapp",
        to: phoneNumber,
        type: "text",
        text: {
          body: message
        }
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error(error.response?.data || error.message);
    throw error;
  }
};

module.exports = {
  sendWhatsAppMessage
};